(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var cards = document.querySelectorAll('.under-building .content');
    if (!cards.length) return;

    cards.forEach(function(contentEl){
      var wrap = contentEl.querySelector('.canvas-wrap');
      if (!wrap) return;

      var img = wrap.querySelector('.canvas-img');
      if (!img) return;

      var pxValues = [1, 2, 4, 9, 100];
      var pxIndex = 4;
      var timer = null;

      var overlay = document.createElement('div');
      overlay.className = 'wip-overlay';

      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      var cardEl = contentEl.closest('.under-building');
      var slug = cardEl ? cardEl.getAttribute('data-slug') : '';
      var isCrc = img.alt.indexOf('CRC-POST') !== -1;
      var isCeralacca = slug === 'ceralacca';
      var siteUrl, fullUrl;
      if (isCeralacca) {
        siteUrl = 'instagram.com/ceralaccaroma';
        fullUrl = 'https://www.instagram.com/ceralaccaroma/';
      } else if (isCrc) {
        siteUrl = 'crcpost.it';
        fullUrl = 'https://www.crcpost.it/';
      } else {
        siteUrl = 'nicolesparvieri.com/en';
        fullUrl = 'https://nicolesparvieri.com/en';
      }

      var label = document.createElement('div');
      label.className = 'wip-label';
      label.innerHTML = 'WORK IN PROGRESS<br><a href="' + fullUrl + '" target="_blank" class="wip-link">' + siteUrl + '</a>';

      overlay.appendChild(canvas);
      overlay.appendChild(label);
      wrap.appendChild(overlay);

      var image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = img.src;

      image.onload = function(){
        var imgRatio = image.width / image.height;

        function setCanvasSize(){
          var rect = wrap.getBoundingClientRect();
          var dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
        }

        function render(){
          var w = canvas.width;
          var h = canvas.height;
          var nw = w, nh = h, nx = 0, ny = 0;

          if (nw / nh > imgRatio){
            nh = Math.round(w / imgRatio);
            ny = Math.round((h - nh) / 2);
          } else {
            nw = Math.round(h * imgRatio);
            nx = Math.round((w - nw) / 2);
          }

          var size = pxValues[pxIndex] * 0.01;
          ctx.imageSmoothingEnabled = size === 1;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(image, 0, 0, w * size, h * size);
          ctx.drawImage(canvas, 0, 0, w * size, h * size, nx, ny, nw, nh);
        }

        function pixelate(){
          pxIndex--;
          if (pxIndex < 0){
            pxIndex = 0;
            return;
          }
          render();
          timer = setTimeout(pixelate, 80);
        }

        function depixelate(){
          pxIndex++;
          if (pxIndex >= pxValues.length){
            pxIndex = pxValues.length - 1;
            overlay.style.opacity = 0;
            return;
          }
          render();
          timer = setTimeout(depixelate, 80);
        }

        cardEl.addEventListener('mouseenter', function(){
          if (timer) clearTimeout(timer);
          pxIndex = pxValues.length - 1;
          overlay.style.opacity = 1;
          setCanvasSize();
          pixelate();
        });

        cardEl.addEventListener('mouseleave', function(){
          if (timer) clearTimeout(timer);
          pxIndex = 0;
          depixelate();
        });

        window.addEventListener('resize', setCanvasSize);
        setCanvasSize();
        render();
      };
    });
  });
})();
