/* ============================================================
   HUH — scroll reveal logic
   ------------------------------------------------------------
   Watches every [data-reveal] element and adds the .in class
   once it scrolls into view (then stops watching it).

   Group staggering: inside an element with [data-reveal-group],
   child [data-reveal] elements get an increasing transition
   delay (80ms each) so grids cascade in one by one.

   If the browser lacks IntersectionObserver, or the user
   prefers reduced motion, everything shows instantly.
   ============================================================ */
(function () {
  'use strict';

  // No-Go for reduced-motion users: leave everything visible.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Cascade within groups: delay each child a little more.
  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    group.querySelectorAll('[data-reveal]').forEach(function (el, i) {
      el.style.transitionDelay = i * 80 + 'ms';
    });
  });

  var targets = document.querySelectorAll('[data-reveal]');

  // Old browsers: just show everything.
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target); // animate once, then forget it
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px' // trigger just before the element centers
  });

  targets.forEach(function (el) { observer.observe(el); });
})();