function initTextAnimations() {
  'use strict';
  if (typeof gsap === 'undefined' || typeof SplitType === 'undefined') {
    console.error('Required libraries (GSAP or SplitType) are not loaded.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  class TextAnimator {
    constructor(textElement) {
      if (!textElement || !(textElement instanceof HTMLElement)) {
        console.warn('Invalid text element, skipping animation');
        return;
      }
      this.textElement = textElement;
      this.originalChars = [];
      this._animating = false;
      try {
        this.splitText();
      } catch (e) {
        console.warn('SplitType failed for element, showing without animation');
        textElement.style.opacity = 1;
        this.splitter = null;
      }
    }

    isValid() { return this.splitter !== null; }

    splitText() {
      this.splitter = new SplitType(this.textElement, {
        types: 'words, chars'
      });
      this.originalChars = this.splitter.chars.map(function(char) { return char.innerHTML; });
      this.originalColors = this.splitter.chars.map(function(char) { return getComputedStyle(char).color; });
    }

    animate() {
      if (!this.isValid() || this._animating) return;
      this._animating = true;
      this.reset();
      var chars = this.splitter.chars;
      var self = this;
      var completed = 0;

      chars.forEach(function(char, position) {
        var initialHTML = char.innerHTML;
        var initialColor = getComputedStyle(char).color;

        gsap.timeline({
          onComplete: function() {
            char.innerHTML = initialHTML;
            char.style.color = initialColor;
            completed++;
            if (completed === chars.length) {
              self._animating = false;
            }
          }
        })
          .fromTo(char, {
            opacity: 0,
            transformOrigin: '50% 0%'
          }, {
            duration: 0.03,
            ease: 'none',
            repeat: 2,
            repeatRefresh: true,
            repeatDelay: 0.1,
            delay: (position + 1) * 0.08,
            innerHTML: function() {
              var randomChar = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*-_+=;:,<>';
              var randomColor = ['#22a3a9', '#4ca922', '#a99222', '#1d2619'];
              gsap.set(char, { color: randomColor[Math.floor(Math.random() * randomColor.length)] });
              return randomChar[Math.floor(Math.random() * randomChar.length)];
            },
            opacity: 1
          });
      });
    }

    reset() {
      if (!this.isValid()) return;
      var chars = this.splitter.chars;
      chars.forEach(function(char, index) {
        gsap.killTweensOf(char);
        char.innerHTML = this.originalChars[index];
        char.style.color = this.originalColors[index];
      }.bind(this));
    }
  }

  var animateText = function(animator, delay) {
    if (delay === undefined) delay = 0;
    if (!animator.isValid()) return;
    setTimeout(function() {
      animator.textElement.style.opacity = 1;
      animator.animate();
    }, delay);
  };

  var observeVisibility = function(element, animator, index) {
    if (!animator.isValid()) return;
    var observer = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            animateText(animator, 0);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0 }
    );
    observer.observe(element);
  };

  document.querySelectorAll('.hover-effect').forEach(function(item, index) {
    item.style.opacity = 1;
    var animator = new TextAnimator(item);
    item.addEventListener('mouseenter', function() {
      animateText(animator);
    });
    observeVisibility(item, animator, index);
  });
}
