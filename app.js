document.addEventListener("DOMContentLoaded", () => {

  // 1) Scroll Reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });


  // 2) Role Buttons
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const card = this.closest('.role-card');

      const role = card.classList.contains('passenger') ? 'الراكب'
                 : card.classList.contains('driver') ? 'السائق'
                 : 'المدير';

      alert(`مرحباً! سيتم توجيهك لصفحة تسجيل دخول ${role}`);
    });
  });


  // 3) Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});