(function () {
  'use strict';

  /* ============================================================
   * 1. LOTTIE LOADER + SCROLL-TRIGGERED PLAYBACK
   * ============================================================ */
  function initLottie() {
    var elements = document.querySelectorAll('[data-animation-type="lottie"]');
    if (!elements.length || typeof lottie === 'undefined') return;

    elements.forEach(function (el) {
      var src = el.getAttribute('data-src') || '';
      if (!src) return;

      var loop = el.getAttribute('data-loop') !== '0';
      var autoplay = el.getAttribute('data-autoplay') !== '0';
      var direction = parseInt(el.getAttribute('data-direction')) || 1;
      var renderer = el.getAttribute('data-renderer') || 'svg';

      var anim = lottie.loadAnimation({
        container: el,
        renderer: renderer,
        loop: loop,
        autoplay: autoplay,
        path: src
      });

      if (direction === -1) {
        anim.setDirection(-1);
      }

      if (el.hasAttribute('data-scroll') && !autoplay) {
        anim.addEventListener('DOMLoaded', function () {
          if (typeof ScrollTrigger === 'undefined') return;
          var totalFrames = anim.totalFrames;
          var section = el.closest('#About');
          ScrollTrigger.create({
            trigger: section || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            onUpdate: function (self) {
              anim.goToAndStop(self.progress * totalFrames, true);
            }
          });
        });
      }
    });
  }

  /* ============================================================
   * 2. MODAL OPEN/CLOSE
   * ============================================================ */
  function initModal() {
    var modal = document.querySelector('.modal-let-s-tak');
    if (!modal) return;

    var openTrigger = document.querySelector('[data-modal="trigger"]');
    var closeBackdrop = document.querySelector('[data-modal="close-backdrop"]');
    var closeBtn = document.querySelector('[data-modal="close-btn"]');

    function openModal() {
      modal.classList.add('visible');
      animateModalText();
    }

    function closeModal() {
      modal.classList.remove('visible');
    }

    if (openTrigger) {
      openTrigger.addEventListener('click', openModal);
    }

    if (closeBackdrop) {
      closeBackdrop.addEventListener('click', closeModal);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ============================================================
   * 3. MODAL TEXT ENTRANCE ANIMATION
   * ============================================================ */
  function animateModalText() {
    if (typeof gsap === 'undefined') return;

    var modalTexts = document.querySelectorAll('.label-modal.modal');
    if (!modalTexts.length) return;

    gsap.fromTo(modalTexts,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out'
      }
    );
  }

  /* ============================================================
   * 4. MOUSE-FOLLOW PARALLAX (reel-mouse / interactive-iframe)
   * ============================================================ */
  function initMouseFollow() {
    var el = document.querySelector('.reel-mouse.interactive-iframe');
    if (!el) return;

    var maxX = 8, maxY = 14;
    var currentX = 0, currentY = 0, targetX = 0, targetY = 0;

    document.addEventListener('mousemove', function (e) {
      targetX = ((e.clientX / window.innerWidth)  - 0.5) * 2 * maxX;
      targetY = ((e.clientY / window.innerHeight) - 0.5) * 2 * maxY;
    });

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      el.style.transform = 'translate3d(' + currentX.toFixed(4) + '%, ' + currentY.toFixed(4) + '%, 0px)';
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ============================================================
   * 5. SCROLL REVEAL FALLBACK (per elementi opachi/nascosti)
   * ============================================================ */
  function initScrollReveal() {
    var els = document.querySelectorAll('[style*="opacity:0"], [style*="display: none"], [style*="display:none"]');
    if (!els.length) return;

    els.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.style.opacity = '1';
        el.style.display = '';
      } else {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.display = '';
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });
        obs.observe(el);
      }
    });
  }

  /* ============================================================
   * INIT
   * ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initModal();
    initScrollReveal();
    initMouseFollow();
    if (typeof lottie !== 'undefined') initLottie();
  });
})();
