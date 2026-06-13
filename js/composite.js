/* ===== CamShare — Phase 3: Canvas Composite Module ===== */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────
  var W = 1080;
  var H = 1920;
  var COLORS = {
    bg: '#ffffff',
    titleBar: '#1e3a5f',
    accent: '#93c5fd',
    textDark: '#1e3a5f',
    textLight: '#ffffff',
    textMuted: '#9ca3af',
    border: '#d1d5db',
    lineGray: '#e5e7eb',
  };

  // ── Font preload ────────────────────────────────────────
  var fontLoaded = false;
  var FONT_FAMILY = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

  function preloadFont() {
    if (fontLoaded) return Promise.resolve();

    var notoFont = new FontFace(
      'Noto Sans TC',
      'url(https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829OofrH4F4UPfBY2Hs0Q.woff2)',
      { style: 'normal', weight: '700' }
    );

    var notoFontRegular = new FontFace(
      'Noto Sans TC',
      'url(https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829OofrH4F4UPfBY2Hs0Q.woff2)',
      { style: 'normal', weight: '400' }
    );

    return Promise.all([
      notoFont.load().catch(function () { /* fallback to system */ }),
      notoFontRegular.load().catch(function () { /* fallback to system */ }),
    ]).then(function () {
      document.fonts.add(notoFont);
      fontLoaded = true;
    }).catch(function () {
      // Fonts failed, use system fallback
      fontLoaded = true;
    });
  }

  function ensureFonts() {
    if (fontLoaded) return Promise.resolve();
    return document.fonts.ready.then(function () {
      fontLoaded = true;
    });
  }

  // ── Draw helpers ────────────────────────────────────────

  function pct(val, total) {
    return val * total;
  }

  // ── Generate composite ──────────────────────────────────
  function generateComposite(photoData, userInfo) {
    return preloadFont()
      .then(function () { return ensureFonts(); })
      .then(function () {
        return new Promise(function (resolve, reject) {
          var canvas = document.createElement('canvas');
          canvas.width = W;
          canvas.height = H;
          var ctx = canvas.getContext('2d');

          // 1. White background
          ctx.fillStyle = COLORS.bg;
          ctx.fillRect(0, 0, W, H);

          // 2. Outer border
          var borderWidth = 3;
          var borderPad = pct(0.033, W); // ~36px
          ctx.strokeStyle = COLORS.titleBar;
          ctx.lineWidth = borderWidth;
          ctx.beginPath();
          drawRoundRect(ctx, borderPad, borderPad, W - borderPad * 2, H - borderPad * 2, 8);
          ctx.stroke();

          // 3. Title bar (top 5%, height 8%)
          var titleBarTop = pct(0.05, H);
          var titleBarHeight = pct(0.08, H);
          ctx.fillStyle = COLORS.titleBar;
          ctx.beginPath();
          drawRoundRect(ctx, 0, titleBarTop, W, titleBarHeight, 0);
          ctx.fill();

          // 4. Title text "尋人啟事"
          ctx.fillStyle = COLORS.textLight;
          ctx.font = 'bold ' + pct(0.045, H) + 'px ' + FONT_FAMILY;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.letterSpacing = '8px';
          ctx.fillText('尋人啟事', W / 2, titleBarTop + titleBarHeight / 2);

          // Reset letter spacing
          ctx.letterSpacing = '0px';

          // 5. Subtitle accent line
          var lineY = titleBarTop + titleBarHeight + pct(0.015, H);
          ctx.strokeStyle = COLORS.accent;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pct(0.28, W), lineY);
          ctx.lineTo(pct(0.72, W), lineY);
          ctx.stroke();

          // 6. Left decorative bracket
          var bracketTop = pct(0.18, H);
          var bracketBottom = pct(0.67, H);
          var bracketLeft = pct(0.09, W);
          var bracketArm = pct(0.04, W);

          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bracketLeft + bracketArm, bracketTop);
          ctx.lineTo(bracketLeft, bracketTop);
          ctx.lineTo(bracketLeft, bracketBottom);
          ctx.lineTo(bracketLeft + bracketArm, bracketBottom);
          ctx.stroke();

          // 7. Right decorative bracket
          var bracketRight = pct(0.91, W);

          ctx.beginPath();
          ctx.moveTo(bracketRight - bracketArm, bracketTop);
          ctx.lineTo(bracketRight, bracketTop);
          ctx.lineTo(bracketRight, bracketBottom);
          ctx.lineTo(bracketRight - bracketArm, bracketBottom);
          ctx.stroke();

          // 8. Elliptical photo area with clip
          var photoCenterX = W / 2;
          var photoCenterY = pct(0.42, H);
          var photoRx = pct(0.30, W);  // horizontal radius
          var photoRy = pct(0.26, H);  // vertical radius

          // Load photo and draw into ellipse
          var photoImg = new Image();
          photoImg.onload = function () {
            // Clip ellipse
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(photoCenterX, photoCenterY, photoRx, photoRy, 0, 0, Math.PI * 2);
            ctx.clip();

            // Cover mode: scale to fill the ellipse bounding box
            var ellipseW = photoRx * 2;
            var ellipseH = photoRy * 2;
            var imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
            var ellipseAspect = ellipseW / ellipseH;

            var drawW, drawH, drawX, drawY;
            if (imgAspect > ellipseAspect) {
              // Image is wider — fit height, crop width
              drawH = ellipseH;
              drawW = ellipseH * imgAspect;
              drawX = photoCenterX - drawW / 2;
              drawY = photoCenterY - drawH / 2;
            } else {
              // Image is taller — fit width, crop height
              drawW = ellipseW;
              drawH = drawW / imgAspect;
              drawX = photoCenterX - drawW / 2;
              drawY = photoCenterY - drawH / 2;
            }

            ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
            ctx.restore();

            // Ellipse border (dashed)
            ctx.strokeStyle = COLORS.lineGray;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.ellipse(photoCenterX, photoCenterY, photoRx, photoRy, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // 9. Divider line above info area
            var dividerY = pct(0.70, H);
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(pct(0.17, W), dividerY);
            ctx.lineTo(pct(0.83, W), dividerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // 10. Name text (large, centered)
            var name = userInfo.name || '___';
            var nameY = pct(0.76, H);
            ctx.fillStyle = COLORS.textDark;
            ctx.font = 'bold ' + pct(0.042, H) + 'px ' + FONT_FAMILY;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, W / 2, nameY);

            // 11. Gender + Age text (smaller, centered)
            var gender = userInfo.gender || '';
            var age = userInfo.age ? String(userInfo.age) : '';
            var infoParts = [];
            if (gender) infoParts.push('性別：' + gender);
            if (age) infoParts.push('年齡：' + age);
            var infoText = infoParts.join('　');
            var infoY = pct(0.80, H);

            ctx.fillStyle = COLORS.textMuted;
            ctx.font = pct(0.022, H) + 'px ' + FONT_FAMILY;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(infoText || '　', W / 2, infoY);

            // 12. Bottom decorative dots
            var dotY = pct(0.95, H);
            ctx.beginPath();
            ctx.arc(W / 2 - 20, dotY, 3, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.border;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(W / 2, dotY, 3, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.accent;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(W / 2 + 20, dotY, 3, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.border;
            ctx.fill();

            // Output as PNG blob
            canvas.toBlob(function (blob) {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            }, 'image/png');
          };

          photoImg.onerror = function () {
            // Even if photo fails, draw the poster without photo
            // Draw empty ellipse area
            ctx.strokeStyle = COLORS.lineGray;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.ellipse(photoCenterX, photoCenterY, photoRx, photoRy, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Still output the poster
            canvas.toBlob(function (blob) {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            }, 'image/png');
          };

          // Load photo from blob
          if (photoData instanceof Blob) {
            var photoUrl = URL.createObjectURL(photoData);
            photoImg.src = photoUrl;
          } else {
            reject(new Error('Invalid photo data'));
          }
        });
      });
  }

  // ── Rounded rectangle helper ────────────────────────────
  function drawRoundRect(ctx, x, y, w, h, r) {
    if (r === 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ── Download composite ──────────────────────────────────
  function downloadComposite(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'camshare-尋人啟事.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke after a short delay to ensure download starts
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // ── Share composite ─────────────────────────────────────
  function shareComposite(blob) {
    // If Web Share API is supported and can share files
    if (isWebShareSupported()) {
      var file = new File([blob], 'camshare-尋人啟事.png', { type: 'image/png' });
      var shareData = {
        title: '我的尋人啟事',
        text: '看看我的 CamShare 尋人啟事！',
        files: [file],
      };

      // Check if we can actually share this
      if (navigator.canShare && navigator.canShare(shareData)) {
        return navigator.share(shareData)
          .then(function () {
            return 'shared';
          })
          .catch(function (err) {
            // User cancelled or error
            if (err.name === 'AbortError') {
              return 'cancelled';
            }
            // Fallback to download
            downloadComposite(blob);
            return 'downloaded';
          });
      }
    }

    // Fallback: download
    downloadComposite(blob);
    return Promise.resolve('downloaded');
  }

  // ── Web Share API detection ─────────────────────────────
  function isWebShareSupported() {
    return !!(navigator.share && navigator.canShare);
  }

  // ── WebView detection ──────────────────────────────────
  function isWebView() {
    var ua = navigator.userAgent || navigator.vendor || '';
    // LINE in-app browser
    if (/Line\//i.test(ua)) return true;
    // Facebook in-app browser
    if (/FBAN|FBAV|FBBV/i.test(ua)) return true;
    // Facebook Messenger
    if (/Messenger/i.test(ua)) return true;
    // Instagram in-app browser
    if (/Instagram/i.test(ua)) return true;
    // WeChat
    if (/MicroMessenger/i.test(ua)) return true;
    // Generic WebView indicators
    if (/wv/i.test(ua)) return true;
    // iOS WebView (not Safari)
    if (/iPhone|iPad|iPod/.test(ua) && !/Safari/i.test(ua)) return true;
    return false;
  }

  // ── Create composite preview URL ───────────────────────
  function createPreviewURL(blob) {
    return URL.createObjectURL(blob);
  }

  // ── Create JPEG blob for sharing (smaller size) ─────────
  function createShareBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, 'image/jpeg', 0.85);
    });
  }

  // ── Expose API ──────────────────────────────────────────
  window.CamComposite = {
    generateComposite: generateComposite,
    downloadComposite: downloadComposite,
    shareComposite: shareComposite,
    isWebShareSupported: isWebShareSupported,
    isWebView: isWebView,
    createPreviewURL: createPreviewURL,
  };

})();