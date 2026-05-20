"""
=============================================================
  Palestine Smart Transportation System — Flask Backend
  app.py — MongoDB Edition
=============================================================
  Roles: Passenger | Driver | Transportation Manager
  Features: Auth, Booking, Live Status, AI Suggestions,
            Driver Community, Route Management, Analytics
=============================================================

  MongoDB connection: set MONGO_URI environment variable.
  Default: mongodb://localhost:27017/transport_ps

  Demo accounts (phone / password):
    Passenger : 0599000001 / pass123
    Driver    : 0599000002 / pass123
    Manager   : 0599000003 / pass123
=============================================================
"""

import os
import json
import hashlib
import secrets
import math
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, g, send_from_directory
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from bson.errors import InvalidId
import anthropic

# ─────────────────────────────────────────────
# App Configuration
# ─────────────────────────────────────────────
app = Flask(__name__, static_folder="static", static_url_path="")

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", secrets.token_hex(32))

app.config["MONGO_URI"] = os.environ.get(
    "MONGO_URI",
    "mongodb+srv://nanadabest2007_db_user:zGa8fuWAW57ykU8E@mawasalati.nxqwvqs.mongodb.net/mawasalati?retryWrites=true&w=majority"
)

app.config["DEBUG"] = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
# Anthropic client
ai_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


# ─────────────────────────────────────────────
# MongoDB Connection
# ─────────────────────────────────────────────
_mongo_client: MongoClient | None = None
_db = None


def get_db():
    global _mongo_client, _db

    if _db is None:
        _mongo_client = MongoClient(app.config["MONGO_URI"])
        _db = _mongo_client["mawasalati"]   # ✅ هنا الصح

    return _db




def col(name: str):
    """Shorthand: get a collection."""
    return get_db()[name]


def to_id(value) -> ObjectId | None:
    """Convert string → ObjectId, return None on failure."""
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        return None


def serialize(doc) -> dict:
    """Recursively convert ObjectIds to strings so Flask can jsonify."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    if isinstance(doc, dict):
        return {k: serialize(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


# ─────────────────────────────────────────────
# Schema / Index bootstrap + seed data
# ─────────────────────────────────────────────
def init_db():
    db = get_db()

    # ── Indexes ──────────────────────────────
    db.users.create_index("phone", unique=True)
    db.users.create_index("email", sparse=True, unique=True)
    db.driver_profiles.create_index("user_id", unique=True)
    db.driver_profiles.create_index("plate_number", unique=True, sparse=True)
    db.driver_profiles.create_index([("current_lat", ASCENDING), ("current_lng", ASCENDING)])
    db.sessions.create_index("expires_at", expireAfterSeconds=0)  # TTL index
    db.sessions.create_index("user_id")
    db.trips.create_index([("passenger_id", ASCENDING), ("booked_at", DESCENDING)])
    db.trips.create_index([("driver_id", ASCENDING), ("status", ASCENDING)])
    db.trips.create_index([("route_id", ASCENDING), ("status", ASCENDING)])
    db.community_reports.create_index([("active", ASCENDING), ("created_at", DESCENDING)])
    db.favorite_routes.create_index([("user_id", ASCENDING), ("route_id", ASCENDING)], unique=True)
    db.ratings.create_index([("trip_id", ASCENDING), ("passenger_id", ASCENDING)], unique=True)

    # ── Seed routes ──────────────────────────
    if db.routes.count_documents({}) == 0:
        sample_routes = [
            {"name": "Jenin → Arab American University", "origin": "Jenin",
             "destination": "Zababdeh", "waypoints": ["Arrabeh", "Yabad"],
             "distance_km": 18, "base_price": 4.0, "vehicle_type": "bus", "active": True},
            {"name": "Ramallah → Jerusalem", "origin": "Ramallah",
             "destination": "Jerusalem", "waypoints": ["Al-Bireh", "Qalandiya"],
             "distance_km": 16, "base_price": 6.0, "vehicle_type": "shared_taxi", "active": True},
            {"name": "Nablus → Ramallah", "origin": "Nablus",
             "destination": "Ramallah", "waypoints": ["Huwwara", "Beit El"],
             "distance_km": 65, "base_price": 10.0, "vehicle_type": "bus", "active": True},
            {"name": "Jenin → Nablus", "origin": "Jenin",
             "destination": "Nablus", "waypoints": ["Ya'bad", "Silat al-Harithiyya"],
             "distance_km": 55, "base_price": 8.0, "vehicle_type": "shared_taxi", "active": True},
            {"name": "Hebron → Bethlehem", "origin": "Hebron",
             "destination": "Bethlehem", "waypoints": ["Halhul", "Beit Ummar"],
             "distance_km": 30, "base_price": 5.0, "vehicle_type": "shared_taxi", "active": True},
            {"name": "Tulkarm → Qalqilya", "origin": "Tulkarm",
             "destination": "Qalqilya", "waypoints": ["Illar"],
             "distance_km": 20, "base_price": 3.5, "vehicle_type": "shared_taxi", "active": True},
            {"name": "Jericho → Ramallah", "origin": "Jericho",
             "destination": "Ramallah", "waypoints": ["Ma'ale Adumim junction"],
             "distance_km": 38, "base_price": 7.0, "vehicle_type": "bus", "active": True},
            {"name": "Bethlehem → Jerusalem", "origin": "Bethlehem",
             "destination": "Jerusalem", "waypoints": ["Beit Jala", "Rachel's Tomb"],
             "distance_km": 9, "base_price": 4.0, "vehicle_type": "shared_taxi", "active": True},
        ]
        now = datetime.utcnow()
        for r in sample_routes:
            r["created_at"] = now
        db.routes.insert_many(sample_routes)

    # ── Seed demo users ───────────────────────
    if db.users.count_documents({}) == 0:
        def hp(pw):
            return hashlib.sha256(pw.encode()).hexdigest()

        now = datetime.utcnow()
        users = [
            {"name": "Ahmad Khalil",    "phone": "0599000001", "email": "passenger@demo.ps",
             "password": hp("pass123"), "role": "passenger", "created_at": now},
            {"name": "Mohammed Nassar", "phone": "0599000002", "email": "driver@demo.ps",
             "password": hp("pass123"), "role": "driver",    "created_at": now},
            {"name": "Sara Barakat",    "phone": "0599000003", "email": "manager@demo.ps",
             "password": hp("pass123"), "role": "manager",   "created_at": now},
        ]
        result = db.users.insert_many(users)
        driver_user_id = result.inserted_ids[1]   # Mohammed Nassar

        db.driver_profiles.insert_one({
            "user_id":            driver_user_id,
            "vehicle_type":       "shared_taxi",
            "vehicle_color":      "White",
            "plate_number":       "P-12345",
            "vehicle_features":   ["Air Conditioning", "Music", "USB Charging"],
            "capacity":           7,
            "current_passengers": 3,
            "status":             "online",
            "current_lat":        32.4606,
            "current_lng":        35.2956,
            "rating":             5.0,
            "rating_count":       0,
            "daily_earnings":     0.0,
            "approved":           True,
            "created_at":         now,
        })

    print("=" * 55)
    print("  Palestine Smart Transportation — Backend")
    print("  (MongoDB Edition)")
    print("=" * 55)
    print("  Database  :", app.config["MONGO_URI"])
    print()
    print("  Demo accounts (phone / password):")
    print("    Passenger : 0599000001 / pass123")
    print("    Driver    : 0599000002 / pass123")
    print("    Manager   : 0599000003 / pass123")
    print("=" * 55)


# ─────────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_session(user_id: ObjectId) -> str:
    token      = secrets.token_hex(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    col("sessions").insert_one({
        "_id":        token,
        "user_id":    user_id,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
    })
    return token


def get_current_user() -> dict | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    session = col("sessions").find_one({
        "_id":        token,
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not session:
        return None
    user = col("users").find_one({"_id": session["user_id"]})
    return user


def login_required(roles=None):
    """Decorator: enforce authentication and optional role check."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Unauthorized"}), 401
            if roles and user["role"] not in roles:
                return jsonify({"error": "Forbidden — wrong role"}), 403
            g.user = user
            return f(*args, **kwargs)
        return wrapped
    return decorator


# ─────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def occupancy_label(current: int, capacity: int) -> str:
    pct = current / capacity if capacity else 0
    if pct >= 1:    return "full"
    if pct >= 0.8:  return "almost_full"
    if pct >= 0.5:  return "filling"
    return "available"


def public_user(user: dict) -> dict:
    u = serialize(user.copy())
    u.pop("password", None)
    u["id"] = u.pop("_id", None)
    return u


# ─────────────────────────────────────────────
# ══════════════ AUTH ROUTES ══════════════════
# ─────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    for field in ["name", "phone", "password", "role"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    if data["role"] not in ("passenger", "driver", "manager"):
        return jsonify({"error": "Invalid role"}), 400

    try:
        result = col("users").insert_one({
            "name":       data["name"],
            "phone":      data["phone"],
            "email":      data.get("email"),
            "password":   hash_password(data["password"]),
            "role":       data["role"],
            "created_at": datetime.utcnow(),
        })
    except DuplicateKeyError:
        return jsonify({"error": "Phone number already registered"}), 409

    user_id = result.inserted_id
    if data["role"] == "driver":
        col("driver_profiles").insert_one({
            "user_id":            user_id,
            "vehicle_type":       None,
            "vehicle_color":      None,
            "plate_number":       None,
            "vehicle_features":   [],
            "capacity":           7,
            "current_passengers": 0,
            "status":             "offline",
            "current_lat":        None,
            "current_lng":        None,
            "rating":             5.0,
            "rating_count":       0,
            "daily_earnings":     0.0,
            "approved":           False,
            "created_at":         datetime.utcnow(),
        })

    token = create_session(user_id)
    user  = col("users").find_one({"_id": user_id})
    return jsonify({"token": token, "user": public_user(user)}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data     = request.json or {}
    phone    = data.get("phone", "").strip()
    password = data.get("password", "")
    if not phone or not password:
        return jsonify({"error": "Phone and password are required"}), 400

    user = col("users").find_one({"phone": phone, "password": hash_password(password)})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_session(user["_id"])
    return jsonify({"token": token, "user": public_user(user)})


@app.route("/api/auth/logout", methods=["POST"])
@login_required()
def logout():
    token = request.headers.get("Authorization", "")[7:]
    col("sessions").delete_one({"_id": token})
    return jsonify({"message": "Logged out"})


@app.route("/api/auth/me", methods=["GET"])
@login_required()
def me():
    user = public_user(g.user)
    if g.user["role"] == "driver":
        profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
        user["driver_profile"] = serialize(profile)
    return jsonify(user)


# ─────────────────────────────────────────────
# ══════════════ ROUTES API ═══════════════════
# ─────────────────────────────────────────────
@app.route("/api/routes", methods=["GET"])
@login_required()
def list_routes():
    origin = request.args.get("origin", "")
    dest   = request.args.get("destination", "")
    query  = {"active": True}
    if origin:
        query["origin"]      = {"$regex": origin, "$options": "i"}
    if dest:
        query["destination"] = {"$regex": dest, "$options": "i"}
    rows = list(col("routes").find(query))
    return jsonify(serialize(rows))


@app.route("/api/routes/<route_id>", methods=["GET"])
@login_required()
def get_route(route_id):
    oid = to_id(route_id)
    if not oid:
        return jsonify({"error": "Invalid route id"}), 400
    row = col("routes").find_one({"_id": oid})
    if not row:
        return jsonify({"error": "Route not found"}), 404
    return jsonify(serialize(row))


@app.route("/api/routes", methods=["POST"])
@login_required(roles=["manager"])
def create_route():
    data = request.json or {}
    for field in ["name", "origin", "destination"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400
    col("routes").insert_one({
        "name":         data["name"],
        "origin":       data["origin"],
        "destination":  data["destination"],
        "waypoints":    data.get("waypoints", []),
        "distance_km":  data.get("distance_km", 0),
        "base_price":   data.get("base_price", 3.0),
        "vehicle_type": data.get("vehicle_type", "shared_taxi"),
        "active":       True,
        "created_at":   datetime.utcnow(),
    })
    return jsonify({"message": "Route created"}), 201


@app.route("/api/routes/<route_id>", methods=["PUT"])
@login_required(roles=["manager"])
def update_route(route_id):
    oid = to_id(route_id)
    if not oid:
        return jsonify({"error": "Invalid route id"}), 400
    data = request.json or {}
    allowed = ["name", "origin", "destination", "waypoints",
               "distance_km", "base_price", "vehicle_type", "active"]
    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400
    result = col("routes").update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        return jsonify({"error": "Route not found"}), 404
    return jsonify({"message": "Route updated"})


# ─────────────────────────────────────────────
# ══════════════ VEHICLES / LIVE STATUS ═══════
# ─────────────────────────────────────────────
@app.route("/api/vehicles/nearby", methods=["GET"])
@login_required(roles=["passenger"])
def nearby_vehicles():
    try:
        lat = float(request.args.get("lat", 32.2211))
        lng = float(request.args.get("lng", 35.2544))
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

    radius_km = float(request.args.get("radius", 10))

    drivers = list(col("driver_profiles").find({
        "status":      {"$ne": "offline"},
        "approved":    True,
        "current_lat": {"$ne": None},
    }))

    results = []
    for d in drivers:
        dist = haversine(lat, lng, d["current_lat"], d["current_lng"])
        if dist <= radius_km:
            user = col("users").find_one({"_id": d["user_id"]}, {"name": 1, "phone": 1})
            item = serialize(d)
            item["driver_name"]     = user["name"]  if user else ""
            item["driver_phone"]    = user["phone"] if user else ""
            item["distance_km"]     = round(dist, 2)
            item["occupancy"]       = occupancy_label(d["current_passengers"], d["capacity"])
            item["seats_remaining"] = d["capacity"] - d["current_passengers"]
            results.append(item)

    results.sort(key=lambda x: x["distance_km"])
    return jsonify(results)


@app.route("/api/vehicles/route/<route_id>", methods=["GET"])
@login_required()
def vehicles_on_route(route_id):
    oid = to_id(route_id)
    drivers = list(col("driver_profiles").find({
        "status":   {"$ne": "offline"},
        "approved": True,
    }))
    result = []
    for d in drivers:
        user = col("users").find_one({"_id": d["user_id"]}, {"name": 1})
        item = serialize(d)
        item["driver_name"]     = user["name"] if user else ""
        item["seats_remaining"] = d["capacity"] - d["current_passengers"]
        item["occupancy"]       = occupancy_label(d["current_passengers"], d["capacity"])
        result.append(item)
    return jsonify(result)


# ─────────────────────────────────────────────
# ══════════════ BOOKING (PASSENGER) ══════════
# ─────────────────────────────────────────────
@app.route("/api/bookings", methods=["POST"])
@login_required(roles=["passenger"])
def book_trip():
    data      = request.json or {}
    driver_id = to_id(data.get("driver_id"))
    route_id  = to_id(data.get("route_id"))

    if not driver_id or not route_id:
        return jsonify({"error": "driver_id and route_id are required"}), 400

    driver = col("driver_profiles").find_one({"_id": driver_id, "approved": True})
    if not driver:
        return jsonify({"error": "Driver not found or not approved"}), 404
    if driver["status"] == "full":
        return jsonify({"error": "Vehicle is full"}), 409

    route = col("routes").find_one({"_id": route_id})
    if not route:
        return jsonify({"error": "Route not found"}), 404

    fare   = route["base_price"]
    now    = datetime.utcnow()
    result = col("trips").insert_one({
        "driver_id":    driver_id,
        "route_id":     route_id,
        "passenger_id": g.user["_id"],
        "status":       "waiting",
        "booked_at":    now,
        "departed_at":  None,
        "arrived_at":   None,
        "fare":         fare,
        "notes":        data.get("notes", ""),
    })

    col("driver_profiles").update_one(
        {"_id": driver_id},
        {"$inc": {"current_passengers": 1}},
    )
    updated = col("driver_profiles").find_one({"_id": driver_id})
    if updated["current_passengers"] >= updated["capacity"]:
        col("driver_profiles").update_one({"_id": driver_id}, {"$set": {"status": "full"}})
        updated = col("driver_profiles").find_one({"_id": driver_id})

    trip = col("trips").find_one({"_id": result.inserted_id})
    return jsonify({
        "trip":           serialize(trip),
        "vehicle": {
            "type":     driver["vehicle_type"],
            "color":    driver["vehicle_color"],
            "plate":    driver["plate_number"],
            "rating":   driver["rating"],
            "features": driver.get("vehicle_features", []),
        },
        "fare":           fare,
        "seats_remaining": updated["capacity"] - updated["current_passengers"],
        "occupancy":       occupancy_label(updated["current_passengers"], updated["capacity"]),
    }), 201


@app.route("/api/bookings/history", methods=["GET"])
@login_required(roles=["passenger"])
def booking_history():
    trips = list(col("trips").find(
        {"passenger_id": g.user["_id"]},
        sort=[("booked_at", DESCENDING)],
    ))
    result = []
    for t in trips:
        route  = col("routes").find_one({"_id": t["route_id"]})
        driver = col("driver_profiles").find_one({"_id": t["driver_id"]})
        duser  = col("users").find_one({"_id": driver["user_id"]}) if driver else None
        item   = serialize(t)
        item["route_name"]    = route["name"]           if route  else ""
        item["origin"]        = route["origin"]         if route  else ""
        item["destination"]   = route["destination"]    if route  else ""
        item["driver_name"]   = duser["name"]           if duser  else ""
        item["vehicle_type"]  = driver["vehicle_type"]  if driver else ""
        item["vehicle_color"] = driver["vehicle_color"] if driver else ""
        item["plate_number"]  = driver["plate_number"]  if driver else ""
        item["driver_rating"] = driver["rating"]        if driver else None
        result.append(item)
    return jsonify(result)


@app.route("/api/bookings/<trip_id>/cancel", methods=["POST"])
@login_required(roles=["passenger"])
def cancel_booking(trip_id):
    oid  = to_id(trip_id)
    trip = col("trips").find_one({
        "_id":          oid,
        "passenger_id": g.user["_id"],
        "status":       "waiting",
    })
    if not trip:
        return jsonify({"error": "Trip not found or cannot be cancelled"}), 404
    col("trips").update_one({"_id": oid}, {"$set": {"status": "cancelled"}})
    col("driver_profiles").update_one(
        {"_id": trip["driver_id"]},
        {"$inc": {"current_passengers": -1}},
    )
    # Ensure passenger count doesn't go below 0
    col("driver_profiles").update_one(
        {"_id": trip["driver_id"], "current_passengers": {"$lt": 0}},
        {"$set": {"current_passengers": 0}},
    )
    return jsonify({"message": "Booking cancelled"})


# ─────────────────────────────────────────────
# ══════════════ RATINGS ══════════════════════
# ─────────────────────────────────────────────
@app.route("/api/ratings", methods=["POST"])
@login_required(roles=["passenger"])
def submit_rating():
    data    = request.json or {}
    trip_id = to_id(data.get("trip_id"))
    score   = data.get("score")
    if not trip_id or score is None:
        return jsonify({"error": "trip_id and score are required"}), 400
    if not (1 <= int(score) <= 5):
        return jsonify({"error": "Score must be 1–5"}), 400

    trip = col("trips").find_one({
        "_id":          trip_id,
        "passenger_id": g.user["_id"],
        "status":       "completed",
    })
    if not trip:
        return jsonify({"error": "Completed trip not found"}), 404

    try:
        col("ratings").insert_one({
            "trip_id":     trip_id,
            "passenger_id": g.user["_id"],
            "driver_id":   trip["driver_id"],
            "score":       int(score),
            "comment":     data.get("comment", ""),
            "created_at":  datetime.utcnow(),
        })
    except DuplicateKeyError:
        return jsonify({"error": "Already rated this trip"}), 409

    # Recalculate average rating
    pipeline = [
        {"$match": {"driver_id": trip["driver_id"]}},
        {"$group": {"_id": None, "avg": {"$avg": "$score"}, "cnt": {"$sum": 1}}},
    ]
    agg = list(col("ratings").aggregate(pipeline))
    if agg:
        new_avg = round(agg[0]["avg"], 2)
        col("driver_profiles").update_one(
            {"_id": trip["driver_id"]},
            {"$set": {"rating": new_avg, "rating_count": agg[0]["cnt"]}},
        )
    else:
        new_avg = 5.0

    return jsonify({"message": "Rating submitted", "new_avg": new_avg}), 201


@app.route("/api/ratings/mine", methods=["GET"])
@login_required(roles=["passenger"])
def my_ratings():
    ratings = list(col("ratings").find(
        {"passenger_id": g.user["_id"]},
        sort=[("created_at", DESCENDING)],
    ))
    result = []
    for r in ratings:
        trip   = col("trips").find_one({"_id": r["trip_id"]})
        route  = col("routes").find_one({"_id": trip["route_id"]}) if trip else None
        driver = col("driver_profiles").find_one({"_id": r["driver_id"]})
        duser  = col("users").find_one({"_id": driver["user_id"]}) if driver else None
        item   = serialize(r)
        item["route_name"]  = route["name"] if route else ""
        item["driver_name"] = duser["name"] if duser else ""
        result.append(item)
    return jsonify(result)


# ─────────────────────────────────────────────
# ══════════════ FAVORITE ROUTES ══════════════
# ─────────────────────────────────────────────
@app.route("/api/favorites", methods=["GET"])
@login_required(roles=["passenger"])
def list_favorites():
    favs   = list(col("favorite_routes").find({"user_id": g.user["_id"]}))
    rids   = [f["route_id"] for f in favs]
    routes = list(col("routes").find({"_id": {"$in": rids}}))
    return jsonify(serialize(routes))


@app.route("/api/favorites/<route_id>", methods=["POST"])
@login_required(roles=["passenger"])
def add_favorite(route_id):
    oid = to_id(route_id)
    if not oid:
        return jsonify({"error": "Invalid route id"}), 400
    try:
        col("favorite_routes").insert_one({
            "user_id":  g.user["_id"],
            "route_id": oid,
        })
    except DuplicateKeyError:
        return jsonify({"error": "Already in favorites"}), 409
    return jsonify({"message": "Added to favorites"}), 201


@app.route("/api/favorites/<route_id>", methods=["DELETE"])
@login_required(roles=["passenger"])
def remove_favorite(route_id):
    oid = to_id(route_id)
    col("favorite_routes").delete_one({"user_id": g.user["_id"], "route_id": oid})
    return jsonify({"message": "Removed from favorites"})


# ─────────────────────────────────────────────
# ══════════════ DRIVER DASHBOARD ═════════════
# ─────────────────────────────────────────────
@app.route("/api/driver/dashboard", methods=["GET"])
@login_required(roles=["driver"])
def driver_dashboard():
    profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
    if not profile:
        return jsonify({"error": "Driver profile not found"}), 404

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_trips = list(col("trips").find({
        "driver_id":  profile["_id"],
        "status":     "completed",
        "arrived_at": {"$gte": today_start},
    }))
    today_earnings = sum(t.get("fare", 0) or 0 for t in today_trips)

    total_completed = col("trips").count_documents({
        "driver_id": profile["_id"],
        "status":    "completed",
    })

    waiting_passengers = list(col("trips").find({
        "driver_id": profile["_id"],
        "status":    "waiting",
    }))
    passenger_list = []
    for t in waiting_passengers:
        puser = col("users").find_one({"_id": t["passenger_id"]}, {"name": 1, "phone": 1})
        passenger_list.append({
            "trip_id":   str(t["_id"]),
            "name":      puser["name"]  if puser else "",
            "phone":     puser["phone"] if puser else "",
            "booked_at": t["booked_at"].isoformat() if t.get("booked_at") else "",
        })

    return jsonify({
        "profile":            serialize(profile),
        "vehicle_features":   profile.get("vehicle_features", []),
        "today_trips":        len(today_trips),
        "today_earnings":     round(today_earnings, 2),
        "total_trips":        total_completed,
        "rating":             profile["rating"],
        "current_passengers": passenger_list,
        "seats_remaining":    profile["capacity"] - profile["current_passengers"],
        "status":             profile["status"],
    })


@app.route("/api/driver/profile", methods=["PUT"])
@login_required(roles=["driver"])
def update_driver_profile():
    data    = request.json or {}
    profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
    if not profile:
        return jsonify({"error": "Driver profile not found"}), 404

    allowed  = ["vehicle_type", "vehicle_color", "plate_number",
                "vehicle_features", "capacity"]
    updates  = {k: data[k] for k in allowed if k in data}
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400
    col("driver_profiles").update_one({"_id": profile["_id"]}, {"$set": updates})
    return jsonify({"message": "Profile updated"})


@app.route("/api/driver/status", methods=["PUT"])
@login_required(roles=["driver"])
def update_driver_status():
    data    = request.json or {}
    profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    updates = {}
    if data.get("status") in ("offline", "online", "full", "departing"):
        updates["status"] = data["status"]
    if data.get("lat") is not None:
        updates["current_lat"] = float(data["lat"])
    if data.get("lng") is not None:
        updates["current_lng"] = float(data["lng"])
    if updates:
        col("driver_profiles").update_one({"_id": profile["_id"]}, {"$set": updates})
    return jsonify({"message": "Status updated"})


@app.route("/api/driver/trip/<trip_id>/start", methods=["POST"])
@login_required(roles=["driver"])
def start_trip(trip_id):
    oid     = to_id(trip_id)
    profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
    trip    = col("trips").find_one({
        "_id":       oid,
        "driver_id": profile["_id"],
        "status":    "waiting",
    })
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    col("trips").update_one(
        {"_id": oid},
        {"$set": {"status": "in_progress", "departed_at": datetime.utcnow()}},
    )
    col("driver_profiles").update_one(
        {"_id": profile["_id"]},
        {"$set": {"status": "departing"}},
    )
    return jsonify({"message": "Trip started"})


@app.route("/api/driver/trip/<trip_id>/complete", methods=["POST"])
@login_required(roles=["driver"])
def complete_trip(trip_id):
    oid     = to_id(trip_id)
    profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
    trip    = col("trips").find_one({
        "_id":       oid,
        "driver_id": profile["_id"],
        "status":    "in_progress",
    })
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    col("trips").update_one(
        {"_id": oid},
        {"$set": {"status": "completed", "arrived_at": datetime.utcnow()}},
    )
    col("driver_profiles").update_one(
        {"_id": profile["_id"]},
        {"$set":  {"current_passengers": 0, "status": "online"},
         "$inc":  {"daily_earnings": trip.get("fare") or 0}},
    )
    return jsonify({"message": "Trip completed"})


# ─────────────────────────────────────────────
# ══════════════ COMMUNITY REPORTS ════════════
# ─────────────────────────────────────────────
@app.route("/api/community/reports", methods=["GET"])
@login_required(roles=["driver", "manager"])
def list_reports():
    hours    = int(request.args.get("hours", 6))
    since    = datetime.utcnow() - timedelta(hours=hours)
    reports  = list(col("community_reports").find(
        {"active": True, "created_at": {"$gte": since}},
        sort=[("created_at", DESCENDING)],
    ))
    result = []
    for r in reports:
        profile = col("driver_profiles").find_one({"_id": r["driver_id"]})
        user    = col("users").find_one({"_id": profile["user_id"]}) if profile else None
        item    = serialize(r)
        item["reporter_name"] = user["name"] if user else ""
        result.append(item)
    return jsonify(result)


@app.route("/api/community/reports", methods=["POST"])
@login_required(roles=["driver"])
def create_report():
    data = request.json or {}
    for field in ["type", "location", "description"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400
    if data["type"] not in ("checkpoint", "traffic", "road_closure", "road_condition", "other"):
        return jsonify({"error": "Invalid report type"}), 400

    profile = col("driver_profiles").find_one({"user_id": g.user["_id"]})
    if not profile:
        return jsonify({"error": "Driver profile not found"}), 404

    col("community_reports").insert_one({
        "driver_id":   profile["_id"],
        "type":        data["type"],
        "location":    data["location"],
        "description": data["description"],
        "lat":         data.get("lat"),
        "lng":         data.get("lng"),
        "active":      True,
        "created_at":  datetime.utcnow(),
    })
    return jsonify({"message": "Report submitted"}), 201


@app.route("/api/community/reports/<report_id>/resolve", methods=["POST"])
@login_required(roles=["driver", "manager"])
def resolve_report(report_id):
    oid = to_id(report_id)
    col("community_reports").update_one({"_id": oid}, {"$set": {"active": False}})
    return jsonify({"message": "Report resolved"})


# ─────────────────────────────────────────────
# ══════════════ MANAGER DASHBOARD ════════════
# ─────────────────────────────────────────────
@app.route("/api/manager/dashboard", methods=["GET"])
@login_required(roles=["manager"])
def manager_dashboard():
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total_drivers     = col("driver_profiles").count_documents({})
    approved_drivers  = col("driver_profiles").count_documents({"approved": True})
    online_drivers    = col("driver_profiles").count_documents(
        {"approved": True, "status": {"$ne": "offline"}}
    )
    total_routes      = col("routes").count_documents({"active": True})
    total_trips_today = col("trips").count_documents({"booked_at": {"$gte": today_start}})
    total_passengers  = col("users").count_documents({"role": "passenger"})
    pending_approvals = col("driver_profiles").count_documents({"approved": False})

    popular_pipeline = [
        {"$group": {"_id": "$route_id", "trip_count": {"$sum": 1}}},
        {"$sort":  {"trip_count": DESCENDING}},
        {"$limit": 5},
        {"$lookup": {"from": "routes", "localField": "_id",
                     "foreignField": "_id", "as": "route"}},
        {"$unwind": "$route"},
        {"$project": {"name": "$route.name", "origin": "$route.origin",
                      "destination": "$route.destination",
                      "trip_count": 1, "_id": 0}},
    ]
    popular = list(col("trips").aggregate(popular_pipeline))

    return jsonify({
        "total_drivers":            total_drivers,
        "approved_drivers":         approved_drivers,
        "online_drivers":           online_drivers,
        "total_routes":             total_routes,
        "total_trips_today":        total_trips_today,
        "total_passengers":         total_passengers,
        "pending_driver_approvals": pending_approvals,
        "popular_routes":           serialize(popular),
    })


@app.route("/api/manager/drivers", methods=["GET"])
@login_required(roles=["manager"])
def list_drivers():
    profiles = list(col("driver_profiles").find(
        {}, sort=[("approved", ASCENDING), ("created_at", DESCENDING)]
    ))
    result = []
    for p in profiles:
        user = col("users").find_one({"_id": p["user_id"]}, {"name": 1, "phone": 1, "email": 1})
        item = serialize(p)
        if user:
            item["name"]  = user["name"]
            item["phone"] = user["phone"]
            item["email"] = user.get("email")
        result.append(item)
    return jsonify(result)


@app.route("/api/manager/drivers/<driver_profile_id>/approve", methods=["POST"])
@login_required(roles=["manager"])
def approve_driver(driver_profile_id):
    oid = to_id(driver_profile_id)
    col("driver_profiles").update_one({"_id": oid}, {"$set": {"approved": True}})
    return jsonify({"message": "Driver approved"})


@app.route("/api/manager/drivers/<driver_profile_id>/block", methods=["POST"])
@login_required(roles=["manager"])
def block_driver(driver_profile_id):
    oid = to_id(driver_profile_id)
    col("driver_profiles").update_one(
        {"_id": oid},
        {"$set": {"approved": False, "status": "offline"}},
    )
    return jsonify({"message": "Driver blocked"})


@app.route("/api/manager/analytics", methods=["GET"])
@login_required(roles=["manager"])
def analytics():
    since_30 = datetime.utcnow() - timedelta(days=30)

    daily_pipeline = [
        {"$match": {"booked_at": {"$gte": since_30}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$booked_at"}},
            "trips":   {"$sum": 1},
            "revenue": {"$sum": {
                "$cond": [{"$eq": ["$status", "completed"]}, "$fare", 0]
            }},
        }},
        {"$sort": {"_id": ASCENDING}},
        {"$project": {"day": "$_id", "trips": 1, "revenue": 1, "_id": 0}},
    ]

    route_pipeline = [
        {"$group": {
            "_id":      "$route_id",
            "bookings": {"$sum": 1},
        }},
        {"$lookup": {"from": "routes", "localField": "_id",
                     "foreignField": "_id", "as": "route"}},
        {"$unwind": "$route"},
        {"$sort":   {"bookings": DESCENDING}},
        {"$project": {"name": "$route.name", "origin": "$route.origin",
                      "destination": "$route.destination",
                      "bookings": 1, "_id": 0}},
    ]

    return jsonify({
        "daily_stats":   serialize(list(col("trips").aggregate(daily_pipeline))),
        "route_demand":  serialize(list(col("trips").aggregate(route_pipeline))),
    })


@app.route("/api/manager/demand", methods=["GET"])
@login_required(roles=["manager"])
def passenger_demand():
    pipeline = [
        {"$match": {"status": "waiting"}},
        {"$group": {"_id": "$route_id", "waiting_passengers": {"$sum": 1}}},
        {"$lookup": {"from": "routes", "localField": "_id",
                     "foreignField": "_id", "as": "route"}},
        {"$unwind": "$route"},
        {"$sort":   {"waiting_passengers": DESCENDING}},
        {"$project": {"name": "$route.name", "origin": "$route.origin",
                      "destination": "$route.destination",
                      "waiting_passengers": 1, "_id": 0}},
    ]
    return jsonify(serialize(list(col("trips").aggregate(pipeline))))


# ─────────────────────────────────────────────
# ══════════════ AI FEATURES ══════════════════
# ─────────────────────────────────────────────
def build_context_for_ai() -> str:
    routes  = list(col("routes").find({"active": True},
                   {"name": 1, "origin": 1, "destination": 1,
                    "base_price": 1, "vehicle_type": 1}))
    drivers = list(col("driver_profiles").find(
        {"status": {"$ne": "offline"}, "approved": True},
        {"vehicle_type": 1, "current_passengers": 1,
         "capacity": 1, "status": 1, "rating": 1},
    ))
    since   = datetime.utcnow() - timedelta(hours=3)
    reports = list(col("community_reports").find(
        {"active": True, "created_at": {"$gte": since}},
        {"type": 1, "location": 1, "description": 1},
    ))

    ctx = f"""
You are the AI assistant for a Palestinian transportation app.
Today is {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC.

AVAILABLE ROUTES:
{json.dumps(serialize(routes), ensure_ascii=False, indent=2)}

ACTIVE VEHICLES RIGHT NOW:
{json.dumps(serialize(drivers), ensure_ascii=False, indent=2)}

RECENT ROAD REPORTS (last 3 hours):
{json.dumps(serialize(reports), ensure_ascii=False, indent=2)}

Palestinian context:
- Shared taxis (servees) typically depart when full (7 passengers), not on a fixed schedule.
- Buses may have a scheduled time but also wait until full or near-full.
- Checkpoints and road closures are common and affect travel time significantly.
- Passengers value cost and crowding information heavily.

Answer in clear, friendly Arabic or English depending on the user's message.
Keep responses concise and practical.
""".strip()
    return ctx


@app.route("/api/ai/suggest", methods=["POST"])
@login_required(roles=["passenger"])
def ai_suggest():
    data   = request.json or {}
    origin = data.get("origin", "")
    dest   = data.get("destination", "")
    note   = data.get("note", "")
    if not origin or not dest:
        return jsonify({"error": "origin and destination are required"}), 400

    prompt = f"""
The passenger wants to travel from '{origin}' to '{dest}'.
Additional note: {note or 'None'}

Please:
1. Recommend the best transportation option (shared taxi or bus) and why.
2. Estimate current waiting time based on vehicle fill levels.
3. Suggest cost estimate.
4. Mention any relevant road reports or checkpoints.
5. Suggest any alternative route if the main route has issues.
"""
    try:
        response = ai_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=600,
            system=build_context_for_ai(),
            messages=[{"role": "user", "content": prompt}],
        )
        suggestion = response.content[0].text
    except Exception as e:
        suggestion = f"AI service temporarily unavailable. ({e})"

    return jsonify({"suggestion": suggestion, "origin": origin, "destination": dest})


@app.route("/api/ai/predict-crowd", methods=["GET"])
@login_required()
def ai_predict_crowd():
    try:
        response = ai_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=400,
            system=build_context_for_ai(),
            messages=[{"role": "user", "content": (
                "Based on current vehicle fill levels and trip demand, "
                "which routes are likely to be crowded in the next hour? "
                "Which vehicles are almost full? Which routes have the least wait? "
                "Give a short, practical summary."
            )}],
        )
        prediction = response.content[0].text
    except Exception as e:
        prediction = f"AI service temporarily unavailable. ({e})"
    return jsonify({"prediction": prediction})


@app.route("/api/ai/chat", methods=["POST"])
@login_required()
def ai_chat():
    data     = request.json or {}
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "messages array is required"}), 400
    for m in messages:
        if m.get("role") not in ("user", "assistant") or not m.get("content"):
            return jsonify({"error": "Each message must have role and content"}), 400
    try:
        response = ai_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=700,
            system=build_context_for_ai(),
            messages=messages,
        )
        reply = response.content[0].text
    except Exception as e:
        reply = f"AI service temporarily unavailable. ({e})"
    return jsonify({"reply": reply})


@app.route("/api/ai/estimate-wait", methods=["POST"])
@login_required(roles=["passenger"])
def ai_estimate_wait():
    data      = request.json or {}
    driver_id = to_id(data.get("driver_id"))
    route_id  = to_id(data.get("route_id"))
    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    driver = col("driver_profiles").find_one({"_id": driver_id})
    if not driver:
        return jsonify({"error": "Driver not found"}), 404

    route      = col("routes").find_one({"_id": route_id}) if route_id else None
    seats_left = driver["capacity"] - driver["current_passengers"]

    prompt = f"""
A passenger is asking how long they'll wait for this vehicle:
- Vehicle type: {driver['vehicle_type']}
- Current passengers: {driver['current_passengers']} / {driver['capacity']}
- Seats remaining: {seats_left}
- Vehicle status: {driver['status']}
- Driver rating: {driver['rating']}
{"- Route: " + route['name'] if route else ""}

Remember: in Palestine, shared taxis usually depart when full, not on a fixed time.
Give a realistic, friendly waiting time estimate and advice.
"""
    try:
        response = ai_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=build_context_for_ai(),
            messages=[{"role": "user", "content": prompt}],
        )
        estimate = response.content[0].text
    except Exception as e:
        estimate = f"AI service temporarily unavailable. ({e})"

    return jsonify({
        "estimate":       estimate,
        "seats_remaining": seats_left,
        "occupancy":       occupancy_label(driver["current_passengers"], driver["capacity"]),
        "status":          driver["status"],
    })


# ─────────────────────────────────────────────
# ══════════════ HEALTH & ROOT ════════════════
# ─────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status":  "ok",
        "app":     "Palestine Smart Transportation",
        "version": "2.0.0-mongodb",
        "time":    datetime.utcnow().isoformat(),
    })


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder or "static", path)):
        return send_from_directory(app.static_folder or "static", path)
    index = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(index):
        return send_from_directory(os.path.dirname(__file__), "index.html")
    return jsonify({"message": "Palestine Smart Transportation API (MongoDB) is running."}), 200


# ─────────────────────────────────────────────
# Error handlers
# ─────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=app.config["DEBUG"],
    )
