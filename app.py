"""
=============================================================
  Palestine Smart Transportation System — Flask Backend
  app.py — All backend logic in one file
=============================================================
  Roles: Passenger | Driver | Transportation Manager
  Features: Auth, Booking, Live Status, AI Suggestions,
            Driver Community, Route Management, Analytics
=============================================================
"""

import os
import json
import sqlite3
import hashlib
import hmac
import secrets
import math
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory
import anthropic

# ─────────────────────────────────────────────
# App Configuration
# ─────────────────────────────────────────────
app = Flask(__name__, static_folder="static", static_url_path="")

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", secrets.token_hex(32))
app.config["DATABASE"] = os.environ.get("DATABASE", "transport.db")
app.config["DEBUG"] = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

# Anthropic client (key injected from environment)
ai_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

# ─────────────────────────────────────────────
# Database helpers
# ─────────────────────────────────────────────
def get_db():
    """Return a thread-local database connection."""
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(
            app.config["DATABASE"], detect_types=sqlite3.PARSE_DECLTYPES
        )
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
    return db


@app.teardown_appcontext
def close_db(exc):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def query(sql, args=(), one=False):
    cur = get_db().execute(sql, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def execute(sql, args=()):
    db = get_db()
    cur = db.execute(sql, args)
    db.commit()
    return cur


# ─────────────────────────────────────────────
# Schema bootstrap
# ─────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    phone       TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('passenger','driver','manager')),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS driver_profiles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER UNIQUE REFERENCES users(id),
    vehicle_type    TEXT,
    vehicle_color   TEXT,
    plate_number    TEXT UNIQUE,
    vehicle_features TEXT,          -- JSON array
    status          TEXT DEFAULT 'offline' CHECK(status IN ('offline','online','full','departing')),
    current_lat     REAL,
    current_lng     REAL,
    capacity        INTEGER DEFAULT 7,
    current_passengers INTEGER DEFAULT 0,
    rating          REAL DEFAULT 5.0,
    rating_count    INTEGER DEFAULT 0,
    daily_earnings  REAL DEFAULT 0.0,
    approved        INTEGER DEFAULT 0,   -- manager must approve
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    origin      TEXT NOT NULL,
    destination TEXT NOT NULL,
    waypoints   TEXT,               -- JSON array of stops
    distance_km REAL,
    base_price  REAL DEFAULT 3.0,
    vehicle_type TEXT DEFAULT 'shared_taxi',
    active      INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id       INTEGER REFERENCES driver_profiles(id),
    route_id        INTEGER REFERENCES routes(id),
    passenger_id    INTEGER REFERENCES users(id),
    status          TEXT DEFAULT 'waiting'
                    CHECK(status IN ('waiting','in_progress','completed','cancelled')),
    booked_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    departed_at     DATETIME,
    arrived_at      DATETIME,
    fare            REAL,
    passenger_count INTEGER DEFAULT 1,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS ratings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id     INTEGER REFERENCES trips(id),
    passenger_id INTEGER REFERENCES users(id),
    driver_id   INTEGER REFERENCES driver_profiles(id),
    score       INTEGER CHECK(score BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorite_routes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id),
    route_id    INTEGER REFERENCES routes(id),
    UNIQUE(user_id, route_id)
);

CREATE TABLE IF NOT EXISTS community_reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id   INTEGER REFERENCES driver_profiles(id),
    type        TEXT NOT NULL CHECK(type IN ('checkpoint','traffic','road_closure','road_condition','other')),
    location    TEXT NOT NULL,
    description TEXT NOT NULL,
    lat         REAL,
    lng         REAL,
    active      INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME
);
"""


def init_db():
    """Create tables and seed sample Palestinian routes/data."""
    db = sqlite3.connect(app.config["DATABASE"])
    db.executescript(SCHEMA)

    # Seed sample routes if table is empty
    count = db.execute("SELECT COUNT(*) FROM routes").fetchone()[0]
    if count == 0:
        sample_routes = [
            ("Jenin → Arab American University", "Jenin", "Zababdeh", json.dumps(["Arrabeh", "Yabad"]), 18, 4.0, "bus"),
            ("Ramallah → Jerusalem", "Ramallah", "Jerusalem", json.dumps(["Al-Bireh", "Qalandiya"]), 16, 6.0, "shared_taxi"),
            ("Nablus → Ramallah", "Nablus", "Ramallah", json.dumps(["Huwwara", "Beit El"]), 65, 10.0, "bus"),
            ("Jenin → Nablus", "Jenin", "Nablus", json.dumps(["Ya'bad", "Silat al-Harithiyya"]), 55, 8.0, "shared_taxi"),
            ("Hebron → Bethlehem", "Hebron", "Bethlehem", json.dumps(["Halhul", "Beit Ummar"]), 30, 5.0, "shared_taxi"),
            ("Tulkarm → Qalqilya", "Tulkarm", "Qalqilya", json.dumps(["Illar"]), 20, 3.5, "shared_taxi"),
            ("Jericho → Ramallah", "Jericho", "Ramallah", json.dumps(["Ma'ale Adumim junction"]), 38, 7.0, "bus"),
            ("Bethlehem → Jerusalem", "Bethlehem", "Jerusalem", json.dumps(["Beit Jala", "Rachel's Tomb"]), 9, 4.0, "shared_taxi"),
        ]
        db.executemany(
            "INSERT INTO routes (name,origin,destination,waypoints,distance_km,base_price,vehicle_type) VALUES (?,?,?,?,?,?,?)",
            sample_routes,
        )

    # Seed demo users
    count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        def hp(pw):
            return hashlib.sha256(pw.encode()).hexdigest()

        db.executemany(
            "INSERT INTO users (name,phone,email,password,role) VALUES (?,?,?,?,?)",
            [
                ("Ahmad Khalil",   "0599000001", "passenger@demo.ps", hp("pass123"), "passenger"),
                ("Mohammed Nassar","0599000002", "driver@demo.ps",    hp("pass123"), "driver"),
                ("Sara Barakat",   "0599000003", "manager@demo.ps",   hp("pass123"), "manager"),
            ],
        )
        # Create driver profile for demo driver
        driver_user = db.execute("SELECT id FROM users WHERE phone='0599000002'").fetchone()
        if driver_user:
            db.execute(
                """INSERT OR IGNORE INTO driver_profiles
                   (user_id,vehicle_type,vehicle_color,plate_number,vehicle_features,
                    capacity,current_passengers,status,current_lat,current_lng,approved)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (driver_user[0], "shared_taxi", "White", "P-12345",
                 json.dumps(["Air Conditioning", "Music", "USB Charging"]),
                 7, 3, "online", 32.4606, 35.2956, 1),
            )

    db.commit()
    db.close()


# ─────────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_session(user_id: int) -> str:
    token = secrets.token_hex(32)
    expires = datetime.utcnow() + timedelta(days=7)
    execute(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?,?,?)",
        (token, user_id, expires),
    )
    return token


def get_current_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    row = query(
        """SELECT u.*, s.expires_at FROM users u
           JOIN sessions s ON s.user_id = u.id
           WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP""",
        (token,), one=True,
    )
    return dict(row) if row else None


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
def haversine(lat1, lng1, lat2, lng2):
    """Distance in km between two coordinates."""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def occupancy_label(current, capacity):
    pct = current / capacity if capacity else 0
    if pct >= 1:
        return "full"
    elif pct >= 0.8:
        return "almost_full"
    elif pct >= 0.5:
        return "filling"
    else:
        return "available"


def row_to_dict(row):
    return dict(row) if row else None


# ─────────────────────────────────────────────
# ══════════════ AUTH ROUTES ══════════════════
# ─────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new user (passenger, driver, or manager)."""
    data = request.json or {}
    required = ["name", "phone", "password", "role"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    if data["role"] not in ("passenger", "driver", "manager"):
        return jsonify({"error": "Invalid role"}), 400

    existing = query("SELECT id FROM users WHERE phone=?", (data["phone"],), one=True)
    if existing:
        return jsonify({"error": "Phone number already registered"}), 409

    execute(
        "INSERT INTO users (name,phone,email,password,role) VALUES (?,?,?,?,?)",
        (data["name"], data["phone"], data.get("email"),
         hash_password(data["password"]), data["role"]),
    )
    user = query("SELECT * FROM users WHERE phone=?", (data["phone"],), one=True)

    # Auto-create empty driver profile
    if data["role"] == "driver":
        execute(
            "INSERT OR IGNORE INTO driver_profiles (user_id) VALUES (?)",
            (user["id"],),
        )

    token = create_session(user["id"])
    return jsonify({"token": token, "user": {
        "id": user["id"], "name": user["name"],
        "role": user["role"], "phone": user["phone"],
    }}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login and return a session token."""
    data = request.json or {}
    phone    = data.get("phone", "").strip()
    password = data.get("password", "")
    if not phone or not password:
        return jsonify({"error": "Phone and password are required"}), 400

    user = query(
        "SELECT * FROM users WHERE phone=? AND password=?",
        (phone, hash_password(password)), one=True,
    )
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_session(user["id"])
    return jsonify({"token": token, "user": {
        "id": user["id"], "name": user["name"],
        "role": user["role"], "phone": user["phone"],
    }})


@app.route("/api/auth/logout", methods=["POST"])
@login_required()
def logout():
    auth = request.headers.get("Authorization", "")[7:]
    execute("DELETE FROM sessions WHERE id=?", (auth,))
    return jsonify({"message": "Logged out"})


@app.route("/api/auth/me", methods=["GET"])
@login_required()
def me():
    user = dict(g.user)
    user.pop("password", None)
    if user["role"] == "driver":
        profile = query(
            "SELECT * FROM driver_profiles WHERE user_id=?", (user["id"],), one=True
        )
        user["driver_profile"] = row_to_dict(profile)
    return jsonify(user)


# ─────────────────────────────────────────────
# ══════════════ ROUTES API ═══════════════════
# ─────────────────────────────────────────────
@app.route("/api/routes", methods=["GET"])
@login_required()
def list_routes():
    """List all active routes, optionally filtered by origin/destination."""
    origin = request.args.get("origin", "")
    dest   = request.args.get("destination", "")
    sql    = "SELECT * FROM routes WHERE active=1"
    args   = []
    if origin:
        sql += " AND origin LIKE ?"
        args.append(f"%{origin}%")
    if dest:
        sql += " AND destination LIKE ?"
        args.append(f"%{dest}%")
    rows = query(sql, args)
    return jsonify([dict(r) for r in rows])


@app.route("/api/routes/<int:route_id>", methods=["GET"])
@login_required()
def get_route(route_id):
    row = query("SELECT * FROM routes WHERE id=?", (route_id,), one=True)
    if not row:
        return jsonify({"error": "Route not found"}), 404
    return jsonify(dict(row))


@app.route("/api/routes", methods=["POST"])
@login_required(roles=["manager"])
def create_route():
    data = request.json or {}
    for field in ["name", "origin", "destination"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400
    execute(
        """INSERT INTO routes (name,origin,destination,waypoints,distance_km,base_price,vehicle_type)
           VALUES (?,?,?,?,?,?,?)""",
        (data["name"], data["origin"], data["destination"],
         json.dumps(data.get("waypoints", [])),
         data.get("distance_km", 0), data.get("base_price", 3.0),
         data.get("vehicle_type", "shared_taxi")),
    )
    return jsonify({"message": "Route created"}), 201


@app.route("/api/routes/<int:route_id>", methods=["PUT"])
@login_required(roles=["manager"])
def update_route(route_id):
    data = request.json or {}
    row  = query("SELECT id FROM routes WHERE id=?", (route_id,), one=True)
    if not row:
        return jsonify({"error": "Route not found"}), 404
    fields = ["name", "origin", "destination", "waypoints", "distance_km", "base_price", "vehicle_type", "active"]
    updates, vals = [], []
    for f in fields:
        if f in data:
            updates.append(f"{f}=?")
            vals.append(json.dumps(data[f]) if f == "waypoints" else data[f])
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400
    vals.append(route_id)
    execute(f"UPDATE routes SET {', '.join(updates)} WHERE id=?", vals)
    return jsonify({"message": "Route updated"})


# ─────────────────────────────────────────────
# ══════════════ VEHICLES / LIVE STATUS ═══════
# ─────────────────────────────────────────────
@app.route("/api/vehicles/nearby", methods=["GET"])
@login_required(roles=["passenger"])
def nearby_vehicles():
    """Return active, approved vehicles near a coordinate."""
    try:
        lat = float(request.args.get("lat", 32.2211))
        lng = float(request.args.get("lng", 35.2544))
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

    radius_km = float(request.args.get("radius", 10))

    drivers = query(
        """SELECT dp.*, u.name AS driver_name, u.phone AS driver_phone
           FROM driver_profiles dp
           JOIN users u ON u.id = dp.user_id
           WHERE dp.status != 'offline' AND dp.approved=1
             AND dp.current_lat IS NOT NULL""",
    )

    results = []
    for d in drivers:
        dist = haversine(lat, lng, d["current_lat"], d["current_lng"])
        if dist <= radius_km:
            item = dict(d)
            item["distance_km"]    = round(dist, 2)
            item["occupancy"]      = occupancy_label(d["current_passengers"], d["capacity"])
            item["seats_remaining"] = d["capacity"] - d["current_passengers"]
            item["vehicle_features"] = json.loads(d["vehicle_features"] or "[]")
            results.append(item)

    results.sort(key=lambda x: x["distance_km"])
    return jsonify(results)


@app.route("/api/vehicles/route/<int:route_id>", methods=["GET"])
@login_required()
def vehicles_on_route(route_id):
    """All active vehicles assigned to a route with seat/status info."""
    # For simplicity: link via most recent in-progress trip on this route
    rows = query(
        """SELECT dp.*, u.name AS driver_name,
                  t.id AS trip_id, t.status AS trip_status
           FROM driver_profiles dp
           JOIN users u ON u.id = dp.user_id
           LEFT JOIN trips t ON t.driver_id = dp.id AND t.route_id=? AND t.status IN ('waiting','in_progress')
           WHERE dp.status != 'offline' AND dp.approved=1""",
        (route_id,),
    )
    result = []
    for r in rows:
        item = dict(r)
        item["seats_remaining"] = r["capacity"] - r["current_passengers"]
        item["occupancy"]       = occupancy_label(r["current_passengers"], r["capacity"])
        item["vehicle_features"] = json.loads(r["vehicle_features"] or "[]")
        result.append(item)
    return jsonify(result)


# ─────────────────────────────────────────────
# ══════════════ BOOKING (PASSENGER) ══════════
# ─────────────────────────────────────────────
@app.route("/api/bookings", methods=["POST"])
@login_required(roles=["passenger"])
def book_trip():
    """Passenger books a seat on a vehicle/route."""
    data = request.json or {}
    driver_id = data.get("driver_id")
    route_id  = data.get("route_id")

    if not driver_id or not route_id:
        return jsonify({"error": "driver_id and route_id are required"}), 400

    driver = query("SELECT * FROM driver_profiles WHERE id=? AND approved=1", (driver_id,), one=True)
    if not driver:
        return jsonify({"error": "Driver not found or not approved"}), 404
    if driver["status"] == "full":
        return jsonify({"error": "Vehicle is full"}), 409

    route = query("SELECT * FROM routes WHERE id=?", (route_id,), one=True)
    if not route:
        return jsonify({"error": "Route not found"}), 404

    fare = route["base_price"]
    execute(
        """INSERT INTO trips (driver_id,route_id,passenger_id,status,fare)
           VALUES (?,?,?,?,?)""",
        (driver_id, route_id, g.user["id"], "waiting", fare),
    )
    execute(
        "UPDATE driver_profiles SET current_passengers=current_passengers+1 WHERE id=?",
        (driver_id,),
    )
    # Update status if now full
    updated = query("SELECT current_passengers, capacity FROM driver_profiles WHERE id=?", (driver_id,), one=True)
    if updated["current_passengers"] >= updated["capacity"]:
        execute("UPDATE driver_profiles SET status='full' WHERE id=?", (driver_id,))

    trip = query("SELECT * FROM trips WHERE rowid=last_insert_rowid()", one=True)
    return jsonify({
        "trip": dict(trip),
        "vehicle": {
            "type": driver["vehicle_type"],
            "color": driver["vehicle_color"],
            "plate": driver["plate_number"],
            "rating": driver["rating"],
            "features": json.loads(driver["vehicle_features"] or "[]"),
        },
        "fare": fare,
        "seats_remaining": updated["capacity"] - updated["current_passengers"],
        "occupancy": occupancy_label(updated["current_passengers"], updated["capacity"]),
    }), 201


@app.route("/api/bookings/history", methods=["GET"])
@login_required(roles=["passenger"])
def booking_history():
    """Passenger: own trip history."""
    rows = query(
        """SELECT t.*, r.name AS route_name, r.origin, r.destination,
                  u.name AS driver_name, dp.vehicle_type, dp.vehicle_color,
                  dp.plate_number, dp.rating AS driver_rating
           FROM trips t
           JOIN routes r ON r.id = t.route_id
           JOIN driver_profiles dp ON dp.id = t.driver_id
           JOIN users u ON u.id = dp.user_id
           WHERE t.passenger_id=?
           ORDER BY t.booked_at DESC""",
        (g.user["id"],),
    )
    return jsonify([dict(r) for r in rows])


@app.route("/api/bookings/<int:trip_id>/cancel", methods=["POST"])
@login_required(roles=["passenger"])
def cancel_booking(trip_id):
    trip = query(
        "SELECT * FROM trips WHERE id=? AND passenger_id=? AND status='waiting'",
        (trip_id, g.user["id"]), one=True,
    )
    if not trip:
        return jsonify({"error": "Trip not found or cannot be cancelled"}), 404
    execute("UPDATE trips SET status='cancelled' WHERE id=?", (trip_id,))
    execute(
        "UPDATE driver_profiles SET current_passengers=MAX(current_passengers-1,0) WHERE id=?",
        (trip["driver_id"],),
    )
    return jsonify({"message": "Booking cancelled"})


# ─────────────────────────────────────────────
# ══════════════ RATINGS ══════════════════════
# ─────────────────────────────────────────────
@app.route("/api/ratings", methods=["POST"])
@login_required(roles=["passenger"])
def submit_rating():
    data = request.json or {}
    trip_id = data.get("trip_id")
    score   = data.get("score")
    if not trip_id or score is None:
        return jsonify({"error": "trip_id and score are required"}), 400
    if not (1 <= int(score) <= 5):
        return jsonify({"error": "Score must be 1–5"}), 400

    trip = query(
        "SELECT * FROM trips WHERE id=? AND passenger_id=? AND status='completed'",
        (trip_id, g.user["id"]), one=True,
    )
    if not trip:
        return jsonify({"error": "Completed trip not found"}), 404

    existing = query(
        "SELECT id FROM ratings WHERE trip_id=? AND passenger_id=?",
        (trip_id, g.user["id"]), one=True,
    )
    if existing:
        return jsonify({"error": "Already rated this trip"}), 409

    execute(
        "INSERT INTO ratings (trip_id,passenger_id,driver_id,score,comment) VALUES (?,?,?,?,?)",
        (trip_id, g.user["id"], trip["driver_id"], score, data.get("comment", "")),
    )

    # Recalculate driver avg rating
    avg = query(
        "SELECT AVG(score) AS avg, COUNT(*) AS cnt FROM ratings WHERE driver_id=?",
        (trip["driver_id"],), one=True,
    )
    execute(
        "UPDATE driver_profiles SET rating=?, rating_count=? WHERE id=?",
        (round(avg["avg"], 2), avg["cnt"], trip["driver_id"]),
    )
    return jsonify({"message": "Rating submitted", "new_avg": round(avg["avg"], 2)}), 201


@app.route("/api/ratings/mine", methods=["GET"])
@login_required(roles=["passenger"])
def my_ratings():
    rows = query(
        """SELECT r.*, t.route_id, ro.name AS route_name, u.name AS driver_name
           FROM ratings r
           JOIN trips t ON t.id = r.trip_id
           JOIN routes ro ON ro.id = t.route_id
           JOIN driver_profiles dp ON dp.id = r.driver_id
           JOIN users u ON u.id = dp.user_id
           WHERE r.passenger_id=?
           ORDER BY r.created_at DESC""",
        (g.user["id"],),
    )
    return jsonify([dict(r) for r in rows])


# ─────────────────────────────────────────────
# ══════════════ FAVORITE ROUTES ══════════════
# ─────────────────────────────────────────────
@app.route("/api/favorites", methods=["GET"])
@login_required(roles=["passenger"])
def list_favorites():
    rows = query(
        """SELECT r.* FROM routes r
           JOIN favorite_routes f ON f.route_id = r.id
           WHERE f.user_id=?""",
        (g.user["id"],),
    )
    return jsonify([dict(r) for r in rows])


@app.route("/api/favorites/<int:route_id>", methods=["POST"])
@login_required(roles=["passenger"])
def add_favorite(route_id):
    try:
        execute(
            "INSERT INTO favorite_routes (user_id,route_id) VALUES (?,?)",
            (g.user["id"], route_id),
        )
    except sqlite3.IntegrityError:
        return jsonify({"error": "Already in favorites"}), 409
    return jsonify({"message": "Added to favorites"}), 201


@app.route("/api/favorites/<int:route_id>", methods=["DELETE"])
@login_required(roles=["passenger"])
def remove_favorite(route_id):
    execute(
        "DELETE FROM favorite_routes WHERE user_id=? AND route_id=?",
        (g.user["id"], route_id),
    )
    return jsonify({"message": "Removed from favorites"})


# ─────────────────────────────────────────────
# ══════════════ DRIVER DASHBOARD ═════════════
# ─────────────────────────────────────────────
@app.route("/api/driver/dashboard", methods=["GET"])
@login_required(roles=["driver"])
def driver_dashboard():
    profile = query(
        "SELECT * FROM driver_profiles WHERE user_id=?", (g.user["id"],), one=True
    )
    if not profile:
        return jsonify({"error": "Driver profile not found"}), 404

    today = datetime.utcnow().date().isoformat()
    completed_today = query(
        """SELECT COUNT(*) AS cnt, SUM(fare) AS earnings
           FROM trips WHERE driver_id=? AND status='completed'
           AND DATE(arrived_at)=?""",
        (profile["id"], today), one=True,
    )
    total_completed = query(
        "SELECT COUNT(*) AS cnt FROM trips WHERE driver_id=? AND status='completed'",
        (profile["id"],), one=True,
    )
    current_passengers_list = query(
        """SELECT t.id AS trip_id, u.name, u.phone, t.booked_at
           FROM trips t JOIN users u ON u.id=t.passenger_id
           WHERE t.driver_id=? AND t.status='waiting'""",
        (profile["id"],),
    )

    return jsonify({
        "profile": dict(profile),
        "vehicle_features": json.loads(profile["vehicle_features"] or "[]"),
        "today_trips": completed_today["cnt"] or 0,
        "today_earnings": round(completed_today["earnings"] or 0, 2),
        "total_trips": total_completed["cnt"] or 0,
        "rating": profile["rating"],
        "current_passengers": [dict(p) for p in current_passengers_list],
        "seats_remaining": profile["capacity"] - profile["current_passengers"],
        "status": profile["status"],
    })


@app.route("/api/driver/profile", methods=["PUT"])
@login_required(roles=["driver"])
def update_driver_profile():
    data = request.json or {}
    profile = query("SELECT * FROM driver_profiles WHERE user_id=?", (g.user["id"],), one=True)
    if not profile:
        return jsonify({"error": "Driver profile not found"}), 404

    fields = ["vehicle_type", "vehicle_color", "plate_number", "capacity"]
    updates, vals = [], []
    for f in fields:
        if f in data:
            updates.append(f"{f}=?")
            vals.append(data[f])
    if "vehicle_features" in data:
        updates.append("vehicle_features=?")
        vals.append(json.dumps(data["vehicle_features"]))
    if not updates:
        return jsonify({"error": "Nothing to update"}), 400
    vals.append(profile["id"])
    execute(f"UPDATE driver_profiles SET {', '.join(updates)} WHERE id=?", vals)
    return jsonify({"message": "Profile updated"})


@app.route("/api/driver/status", methods=["PUT"])
@login_required(roles=["driver"])
def update_driver_status():
    """Update online/offline/full/departing status and location."""
    data    = request.json or {}
    status  = data.get("status")
    lat     = data.get("lat")
    lng     = data.get("lng")
    profile = query("SELECT * FROM driver_profiles WHERE user_id=?", (g.user["id"],), one=True)
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    updates, vals = [], []
    if status in ("offline", "online", "full", "departing"):
        updates.append("status=?"); vals.append(status)
    if lat is not None:
        updates.append("current_lat=?"); vals.append(float(lat))
    if lng is not None:
        updates.append("current_lng=?"); vals.append(float(lng))
    if updates:
        vals.append(profile["id"])
        execute(f"UPDATE driver_profiles SET {', '.join(updates)} WHERE id=?", vals)
    return jsonify({"message": "Status updated"})


@app.route("/api/driver/trip/<int:trip_id>/start", methods=["POST"])
@login_required(roles=["driver"])
def start_trip(trip_id):
    profile = query("SELECT * FROM driver_profiles WHERE user_id=?", (g.user["id"],), one=True)
    trip = query(
        "SELECT * FROM trips WHERE id=? AND driver_id=? AND status='waiting'",
        (trip_id, profile["id"]), one=True,
    )
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    execute(
        "UPDATE trips SET status='in_progress', departed_at=CURRENT_TIMESTAMP WHERE id=?",
        (trip_id,),
    )
    execute("UPDATE driver_profiles SET status='departing' WHERE id=?", (profile["id"],))
    return jsonify({"message": "Trip started"})


@app.route("/api/driver/trip/<int:trip_id>/complete", methods=["POST"])
@login_required(roles=["driver"])
def complete_trip(trip_id):
    profile = query("SELECT * FROM driver_profiles WHERE user_id=?", (g.user["id"],), one=True)
    trip = query(
        "SELECT * FROM trips WHERE id=? AND driver_id=? AND status='in_progress'",
        (trip_id, profile["id"]), one=True,
    )
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    execute(
        "UPDATE trips SET status='completed', arrived_at=CURRENT_TIMESTAMP WHERE id=?",
        (trip_id,),
    )
    execute(
        """UPDATE driver_profiles
           SET current_passengers=0, status='online',
               daily_earnings=daily_earnings+?
           WHERE id=?""",
        (trip["fare"] or 0, profile["id"]),
    )
    return jsonify({"message": "Trip completed"})


# ─────────────────────────────────────────────
# ══════════════ COMMUNITY REPORTS ════════════
# ─────────────────────────────────────────────
@app.route("/api/community/reports", methods=["GET"])
@login_required(roles=["driver", "manager"])
def list_reports():
    hours = int(request.args.get("hours", 6))  # last N hours
    rows = query(
        """SELECT cr.*, u.name AS reporter_name
           FROM community_reports cr
           JOIN driver_profiles dp ON dp.id = cr.driver_id
           JOIN users u ON u.id = dp.user_id
           WHERE cr.active=1
             AND cr.created_at >= DATETIME('now', ? || ' hours')
           ORDER BY cr.created_at DESC""",
        (f"-{hours}",),
    )
    return jsonify([dict(r) for r in rows])


@app.route("/api/community/reports", methods=["POST"])
@login_required(roles=["driver"])
def create_report():
    data = request.json or {}
    for field in ["type", "location", "description"]:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400
    if data["type"] not in ("checkpoint", "traffic", "road_closure", "road_condition", "other"):
        return jsonify({"error": "Invalid report type"}), 400

    profile = query("SELECT id FROM driver_profiles WHERE user_id=?", (g.user["id"],), one=True)
    if not profile:
        return jsonify({"error": "Driver profile not found"}), 404

    execute(
        """INSERT INTO community_reports (driver_id,type,location,description,lat,lng)
           VALUES (?,?,?,?,?,?)""",
        (profile["id"], data["type"], data["location"],
         data["description"], data.get("lat"), data.get("lng")),
    )
    return jsonify({"message": "Report submitted"}), 201


@app.route("/api/community/reports/<int:report_id>/resolve", methods=["POST"])
@login_required(roles=["driver", "manager"])
def resolve_report(report_id):
    execute("UPDATE community_reports SET active=0 WHERE id=?", (report_id,))
    return jsonify({"message": "Report resolved"})


# ─────────────────────────────────────────────
# ══════════════ MANAGER DASHBOARD ════════════
# ─────────────────────────────────────────────
@app.route("/api/manager/dashboard", methods=["GET"])
@login_required(roles=["manager"])
def manager_dashboard():
    total_drivers      = query("SELECT COUNT(*) AS c FROM driver_profiles", one=True)["c"]
    approved_drivers   = query("SELECT COUNT(*) AS c FROM driver_profiles WHERE approved=1", one=True)["c"]
    online_drivers     = query("SELECT COUNT(*) AS c FROM driver_profiles WHERE status!='offline' AND approved=1", one=True)["c"]
    total_routes       = query("SELECT COUNT(*) AS c FROM routes WHERE active=1", one=True)["c"]
    total_trips_today  = query(
        "SELECT COUNT(*) AS c FROM trips WHERE DATE(booked_at)=DATE('now')", one=True
    )["c"]
    total_passengers   = query("SELECT COUNT(*) AS c FROM users WHERE role='passenger'", one=True)["c"]
    pending_approvals  = query(
        "SELECT COUNT(*) AS c FROM driver_profiles WHERE approved=0", one=True
    )["c"]

    # Most popular routes
    popular = query(
        """SELECT r.name, r.origin, r.destination, COUNT(t.id) AS trip_count
           FROM trips t JOIN routes r ON r.id=t.route_id
           GROUP BY r.id ORDER BY trip_count DESC LIMIT 5""",
    )
    return jsonify({
        "total_drivers": total_drivers,
        "approved_drivers": approved_drivers,
        "online_drivers": online_drivers,
        "total_routes": total_routes,
        "total_trips_today": total_trips_today,
        "total_passengers": total_passengers,
        "pending_driver_approvals": pending_approvals,
        "popular_routes": [dict(r) for r in popular],
    })


@app.route("/api/manager/drivers", methods=["GET"])
@login_required(roles=["manager"])
def list_drivers():
    rows = query(
        """SELECT dp.*, u.name, u.phone, u.email
           FROM driver_profiles dp JOIN users u ON u.id=dp.user_id
           ORDER BY dp.approved, dp.created_at DESC""",
    )
    return jsonify([dict(r) for r in rows])


@app.route("/api/manager/drivers/<int:driver_profile_id>/approve", methods=["POST"])
@login_required(roles=["manager"])
def approve_driver(driver_profile_id):
    execute("UPDATE driver_profiles SET approved=1 WHERE id=?", (driver_profile_id,))
    return jsonify({"message": "Driver approved"})


@app.route("/api/manager/drivers/<int:driver_profile_id>/block", methods=["POST"])
@login_required(roles=["manager"])
def block_driver(driver_profile_id):
    execute(
        "UPDATE driver_profiles SET approved=0, status='offline' WHERE id=?",
        (driver_profile_id,),
    )
    return jsonify({"message": "Driver blocked"})


@app.route("/api/manager/analytics", methods=["GET"])
@login_required(roles=["manager"])
def analytics():
    """Trip analytics for last 30 days."""
    daily = query(
        """SELECT DATE(booked_at) AS day, COUNT(*) AS trips,
                  SUM(CASE WHEN status='completed' THEN fare ELSE 0 END) AS revenue
           FROM trips
           WHERE booked_at >= DATE('now', '-30 days')
           GROUP BY day ORDER BY day""",
    )
    route_demand = query(
        """SELECT r.name, r.origin, r.destination, COUNT(t.id) AS bookings,
                  AVG(dp.rating) AS avg_driver_rating
           FROM trips t
           JOIN routes r ON r.id=t.route_id
           JOIN driver_profiles dp ON dp.id=t.driver_id
           GROUP BY r.id ORDER BY bookings DESC""",
    )
    return jsonify({
        "daily_stats": [dict(r) for r in daily],
        "route_demand": [dict(r) for r in route_demand],
    })


@app.route("/api/manager/demand", methods=["GET"])
@login_required(roles=["manager"])
def passenger_demand():
    """How many passengers are waiting per route right now."""
    rows = query(
        """SELECT r.name, r.origin, r.destination, COUNT(t.id) AS waiting_passengers
           FROM trips t JOIN routes r ON r.id=t.route_id
           WHERE t.status='waiting'
           GROUP BY r.id ORDER BY waiting_passengers DESC""",
    )
    return jsonify([dict(r) for r in rows])


# ─────────────────────────────────────────────
# ══════════════ AI FEATURES ══════════════════
# ─────────────────────────────────────────────
def build_context_for_ai() -> str:
    """Gather live system context to pass to the AI."""
    routes = query("SELECT name, origin, destination, base_price, vehicle_type FROM routes WHERE active=1")
    drivers = query(
        """SELECT dp.vehicle_type, dp.current_passengers, dp.capacity,
                  dp.status, dp.rating, r.name AS route_name
           FROM driver_profiles dp
           LEFT JOIN trips t ON t.driver_id=dp.id AND t.status='waiting'
           LEFT JOIN routes r ON r.id=t.route_id
           WHERE dp.status!='offline' AND dp.approved=1"""
    )
    reports = query(
        """SELECT type, location, description FROM community_reports
           WHERE active=1 AND created_at >= DATETIME('now','-3 hours')"""
    )
    ctx = f"""
You are the AI assistant for a Palestinian transportation app.
Today is {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC.

AVAILABLE ROUTES:
{json.dumps([dict(r) for r in routes], ensure_ascii=False, indent=2)}

ACTIVE VEHICLES RIGHT NOW:
{json.dumps([dict(d) for d in drivers], ensure_ascii=False, indent=2)}

RECENT ROAD REPORTS (last 3 hours):
{json.dumps([dict(r) for r in reports], ensure_ascii=False, indent=2)}

Palestinian context:
- Shared taxis (servees) typically depart when full (7 passengers), not on a fixed schedule.
- Buses may have a scheduled time but also wait until full or near-full.
- Checkpoints and road closures are common and affect travel time significantly.
- Passengers value cost and crowding information heavily.

Answer in clear, friendly Arabic or English depending on the user's message.
Keep responses concise and practical.
"""
    return ctx.strip()


@app.route("/api/ai/suggest", methods=["POST"])
@login_required(roles=["passenger"])
def ai_suggest():
    """AI: suggest best transportation option for origin→destination."""
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
        suggestion = f"AI service temporarily unavailable. ({str(e)})"

    return jsonify({"suggestion": suggestion, "origin": origin, "destination": dest})


@app.route("/api/ai/predict-crowd", methods=["GET"])
@login_required()
def ai_predict_crowd():
    """AI: predict which routes will be crowded in the next hour."""
    try:
        response = ai_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=400,
            system=build_context_for_ai(),
            messages=[{
                "role": "user",
                "content": (
                    "Based on current vehicle fill levels and trip demand, "
                    "which routes are likely to be crowded in the next hour? "
                    "Which vehicles are almost full? Which routes have the least wait? "
                    "Give a short, practical summary."
                ),
            }],
        )
        prediction = response.content[0].text
    except Exception as e:
        prediction = f"AI service temporarily unavailable. ({str(e)})"

    return jsonify({"prediction": prediction})


@app.route("/api/ai/chat", methods=["POST"])
@login_required()
def ai_chat():
    """General AI chat — accepts conversation history for multi-turn support."""
    data     = request.json or {}
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "messages array is required"}), 400

    # Validate structure
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
        reply = f"AI service temporarily unavailable. ({str(e)})"

    return jsonify({"reply": reply})


@app.route("/api/ai/estimate-wait", methods=["POST"])
@login_required(roles=["passenger"])
def ai_estimate_wait():
    """AI: estimate waiting time for a specific vehicle/route."""
    data      = request.json or {}
    driver_id = data.get("driver_id")
    route_id  = data.get("route_id")

    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    driver = query("SELECT * FROM driver_profiles WHERE id=?", (driver_id,), one=True)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404

    route = None
    if route_id:
        route = query("SELECT * FROM routes WHERE id=?", (route_id,), one=True)

    seats_left = driver["capacity"] - driver["current_passengers"]
    prompt = f"""
A passenger is asking how long they'll wait for this vehicle:
- Vehicle type: {driver['vehicle_type']}
- Current passengers: {driver['current_passengers']} / {driver['capacity']}
- Seats remaining: {seats_left}
- Vehicle status: {driver['status']}
- Driver rating: {driver['rating']}
{"- Route: " + dict(route)['name'] if route else ""}

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
        estimate = f"AI service temporarily unavailable. ({str(e)})"

    return jsonify({
        "estimate": estimate,
        "seats_remaining": seats_left,
        "occupancy": occupancy_label(driver["current_passengers"], driver["capacity"]),
        "status": driver["status"],
    })


# ─────────────────────────────────────────────
# ══════════════ HEALTH & ROOT ════════════════
# ─────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "app": "Palestine Smart Transportation",
        "version": "1.0.0",
        "time": datetime.utcnow().isoformat(),
    })


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """Serve index.html for all non-API routes (SPA support)."""
    if path and os.path.exists(os.path.join(app.static_folder or "static", path)):
        return send_from_directory(app.static_folder or "static", path)
    index = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(index):
        return send_from_directory(os.path.dirname(__file__), "index.html")
    return jsonify({"message": "Palestine Smart Transportation API is running."}), 200


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
    print("=" * 55)
    print("  Palestine Smart Transportation — Backend")
    print("=" * 55)
    print("  Database  :", app.config["DATABASE"])
    print("  Debug     :", app.config["DEBUG"])
    print()
    print("  Demo accounts (phone / password):")
    print("    Passenger : 0599000001 / pass123")
    print("    Driver    : 0599000002 / pass123")
    print("    Manager   : 0599000003 / pass123")
    print("=" * 55)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)),
            debug=app.config["DEBUG"])