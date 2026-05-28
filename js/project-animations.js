(function () {
  'use strict';

  console.log('project-animations: script loaded');

  var initialized = false;

  function initTextBlockScroll() {
    console.log('project-animations: initTextBlockScroll called');
    if (typeof gsap === 'undefined') { console.error('project-animations: GSAP not defined'); return; }
    if (typeof ScrollTrigger === 'undefined') { console.error('project-animations: ScrollTrigger not defined'); return; }

    gsap.registerPlugin(ScrollTrigger);
    console.log('project-animations: GSAP and ScrollTrigger OK');

    var sections = document.querySelectorAll('.main-cont-details');
    console.log('project-animations: found ' + sections.length + ' sections');

    sections.forEach(function (section) {
      var firstBlock = section.querySelector('.first-text-block');
      var secondBlock = section.querySelector('.second-text-block');
      console.log('project-animations: firstBlock=' + !!firstBlock + ' secondBlock=' + !!secondBlock);
      if (!firstBlock && !secondBlock) return;

      gsap.set(firstBlock, { opacity: 1 });
      gsap.set(secondBlock, { opacity: 0 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1
        }
      });

      tl.to(firstBlock, { opacity: 0, duration: 0.2 }, 0.35);
      tl.to(secondBlock, { opacity: 1, duration: 0.2 }, 0.5);
      console.log('project-animations: ScrollTrigger created');
    });
  }

  function tryInit() {
    if (initialized) return;
    if (!document.querySelector('.main-cont-details')) return;
    initialized = true;
    console.log('project-animations: tryInit - initializing');
    initTextBlockScroll();
  }

  // Immediate init if elements exist
  if (document.querySelector('.main-cont-details')) {
    console.log('project-animations: immediate init');
    tryInit();
  }

  // Watch for dynamic content injection (page.html)
  var target = document.getElementById('page-content') || document.querySelector('.page-content') || document.body;
  var observer = new MutationObserver(function () {
    if (initialized) { observer.disconnect(); return; }
    if (document.querySelector('.main-cont-details')) {
      console.log('project-animations: MutationObserver triggered init');
      tryInit();
      observer.disconnect();
    }
  });
  observer.observe(target, { childList: true, subtree: true });

  // Fallback
  document.addEventListener('DOMContentLoaded', function () {
    console.log('project-animations: DOMContentLoaded');
    tryInit();
  });
})();
