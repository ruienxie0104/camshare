/* ===== CamShare — Phase 4: Canvas Composite Module ===== */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────
  var W = 1080;
  var H = 1920;
  var COLORS = {
    bg: '#f5efe1',          // 羊皮紙亮米色
    bgDark: '#dccfb6',      // 羊皮紙暗褐色 (用於漸層)
    titleBar: '#1c1917',    // 石炭黑
    accent: '#b91c1c',      // 警示復古紅
    textDark: '#1c1917',    // 石炭黑
    textLight: '#f5efe1',   // 羊皮紙米色
    textMuted: '#57534e',   // 灰褐色
    border: '#78716c',      // 石炭灰
    lineGray: '#a8a29e',    // 淺灰泥
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
  // Returns { jpeg: Blob, png: Blob } for sharing (JPEG) and download (PNG)
  function generateComposite(photoData, userInfo) {
    return preloadFont()
      .then(function () { return ensureFonts(); })
      .then(function () {
        return new Promise(function (resolve, reject) {
          var canvas = document.createElement('canvas');
          canvas.width = W;
          canvas.height = H;
          var ctx = canvas.getContext('2d');

          // 1. Vintage paper gradient background
          var bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, Math.max(W, H) / 1.1);
          bgGrad.addColorStop(0, COLORS.bg);
          bgGrad.addColorStop(1, COLORS.bgDark);
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, W, H);

          // Subtle vignette layer
          ctx.fillStyle = 'rgba(120, 80, 40, 0.05)';
          ctx.fillRect(0, 0, W, H);

          // 2. Thick outer border (vintage poster frame)
          var borderPad = pct(0.035, W); // ~38px
          ctx.strokeStyle = COLORS.titleBar;
          ctx.lineWidth = 14;
          ctx.beginPath();
          drawRoundRect(ctx, borderPad, borderPad, W - borderPad * 2, H - borderPad * 2, 4);
          ctx.stroke();

          // Thin inner border line
          ctx.strokeStyle = COLORS.titleBar;
          ctx.lineWidth = 2;
          ctx.beginPath();
          drawRoundRect(ctx, borderPad + 12, borderPad + 12, W - borderPad * 2 - 24, H - borderPad * 2 - 24, 0);
          ctx.stroke();

          // 3. Title bar (top 6%, height 9%)
          var titleBarTop = pct(0.06, H);
          var titleBarHeight = pct(0.09, H);
          ctx.fillStyle = COLORS.titleBar;
          ctx.beginPath();
          drawRoundRect(ctx, borderPad + 14, titleBarTop, W - (borderPad + 14) * 2, titleBarHeight, 0);
          ctx.fill();

          // 4. Title text "尋人啟事"
          ctx.fillStyle = COLORS.textLight;
          ctx.font = 'bold ' + pct(0.050, H) + 'px ' + FONT_FAMILY;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.letterSpacing = '10px';
          ctx.fillText('尋人啟事', W / 2, titleBarTop + titleBarHeight / 2);

          // Reset letter spacing
          ctx.letterSpacing = '0px';

          // 5. Subtitle accent line (Double retro lines)
          var lineY1 = titleBarTop + titleBarHeight + pct(0.015, H);
          var lineY2 = lineY1 + 6;
          ctx.strokeStyle = COLORS.titleBar;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(pct(0.15, W), lineY1);
          ctx.lineTo(pct(0.85, W), lineY1);
          ctx.stroke();

          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pct(0.20, W), lineY2);
          ctx.lineTo(pct(0.80, W), lineY2);
          ctx.stroke();

          // 6. Photo frame variables
          var photoCenterX = W / 2;
          var photoCenterY = pct(0.42, H);
          var photoRx = pct(0.31, W);  // horizontal radius
          var photoRy = pct(0.25, H);  // vertical radius

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
              drawH = ellipseH;
              drawW = ellipseH * imgAspect;
              drawX = photoCenterX - drawW / 2;
              drawY = photoCenterY - drawH / 2;
            } else {
              drawW = ellipseW;
              drawH = drawW / imgAspect;
              drawX = photoCenterX - drawW / 2;
              drawY = photoCenterY - drawH / 2;
            }

            // Apply Sepia vintage filter using offscreen canvas to ensure mobile Safari support
            var offCanvas = document.createElement('canvas');
            offCanvas.width = drawW;
            offCanvas.height = drawH;
            var offCtx = offCanvas.getContext('2d');
            offCtx.drawImage(photoImg, 0, 0, drawW, drawH);
            
            try {
              var imgData = offCtx.getImageData(0, 0, drawW, drawH);
              var data = imgData.data;
              for (var i = 0; i < data.length; i += 4) {
                var r = data[i];
                var g = data[i+1];
                var b = data[i+2];
                
                var gray = 0.3 * r + 0.59 * g + 0.11 * b;
                
                var tr = (gray + 40) * 1.1 * 0.95;
                var tg = (gray + 15) * 1.1 * 0.95;
                var tb = (gray - 15) * 1.1 * 0.95;
                
                data[i] = Math.min(255, tr);
                data[i+1] = Math.min(255, tg);
                data[i+2] = Math.max(0, Math.min(255, tb));
              }
              offCtx.putImageData(imgData, 0, 0);
            } catch (e) {
              console.warn('Canvas pixel manipulation failed (might be tainted):', e);
            }

            ctx.drawImage(offCanvas, drawX, drawY, drawW, drawH);
            ctx.restore();

            // 7. Double oval photo frame
            // Outer thick frame
            ctx.strokeStyle = COLORS.titleBar;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.ellipse(photoCenterX, photoCenterY, photoRx, photoRy, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Inner thin frame
            ctx.strokeStyle = COLORS.bg;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(photoCenterX, photoCenterY, photoRx - 5, photoRy - 5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 8. Red Stamp "REWARD $1,000,000" in retro distressed style
            ctx.save();
            ctx.translate(pct(0.74, W), pct(0.58, H));
            ctx.rotate(14 * Math.PI / 180); // Rotate 14 deg
            
            // Stamp Border
            ctx.strokeStyle = 'rgba(185, 28, 28, 0.82)'; // Red
            ctx.lineWidth = 6;
            ctx.beginPath();
            drawRoundRect(ctx, -125, -40, 250, 80, 10);
            ctx.stroke();

            // Stamp inner border (dashed)
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            drawRoundRect(ctx, -118, -33, 236, 66, 6);
            ctx.stroke();
            ctx.setLineDash([]);

            // Stamp Text
            ctx.fillStyle = 'rgba(185, 28, 28, 0.82)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 24px ' + FONT_FAMILY;
            ctx.fillText('REWARD', 0, -12);
            ctx.font = 'bold 30px ' + FONT_FAMILY;
            ctx.fillText('$1,000,000', 0, 18);
            ctx.restore();

            // 9. Decorative divider lines for Info Area
            var dividerY = pct(0.70, H);
            ctx.strokeStyle = COLORS.titleBar;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pct(0.18, W), dividerY);
            ctx.lineTo(pct(0.82, W), dividerY);
            ctx.stroke();

            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pct(0.24, W), dividerY + 5);
            ctx.lineTo(pct(0.76, W), dividerY + 5);
            ctx.stroke();

            // 10. Name text (large, centered)
            var name = userInfo.name || '___';
            var nameY = pct(0.77, H);
            ctx.fillStyle = COLORS.textDark;
            ctx.font = 'bold ' + pct(0.045, H) + 'px ' + FONT_FAMILY;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('姓名：' + name, W / 2, nameY);

            // 11. Gender + Age text (smaller, centered)
            var gender = userInfo.gender || '不指定';
            var age = userInfo.age ? String(userInfo.age) : '未提供';
            var infoText = '性別：' + gender + '　　年齡：' + age;
            var infoY = pct(0.83, H);

            ctx.fillStyle = COLORS.textMuted;
            ctx.font = 'bold ' + pct(0.026, H) + 'px ' + FONT_FAMILY;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(infoText, W / 2, infoY);

            // Vintage subtext at the very bottom
            var subtextY = pct(0.89, H);
            ctx.fillStyle = COLORS.textMuted;
            ctx.font = pct(0.016, H) + 'px ' + FONT_FAMILY;
            ctx.textAlign = 'center';
            ctx.fillText('如有尋獲，請速與 CamShare 警局聯絡。', W / 2, subtextY);

            // 12. Bottom decorative dots
            var dotY = pct(0.94, H);
            ctx.beginPath();
            ctx.arc(W / 2 - 24, dotY, 4, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.border;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(W / 2, dotY, 5, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.accent;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(W / 2 + 24, dotY, 4, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.border;
            ctx.fill();

            // Output both JPEG (for sharing, quality 0.85) and PNG (for download, high quality)
            canvas.toBlob(function (jpegBlob) {
              if (!jpegBlob) {
                reject(new Error('Canvas toBlob (JPEG) failed'));
                return;
              }
              canvas.toBlob(function (pngBlob) {
                if (!pngBlob) {
                  reject(new Error('Canvas toBlob (PNG) failed'));
                  return;
                }
                resolve({ jpeg: jpegBlob, png: pngBlob });
              }, 'image/png');
            }, 'image/jpeg', 0.85);
          };

          photoImg.onerror = function () {
            // Even if photo fails, draw the poster without photo
            ctx.strokeStyle = COLORS.titleBar;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.ellipse(photoCenterX, photoCenterY, photoRx, photoRy, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Output both formats even for fallback
            canvas.toBlob(function (jpegBlob) {
              if (!jpegBlob) {
                reject(new Error('Canvas toBlob (JPEG) failed'));
                return;
              }
              canvas.toBlob(function (pngBlob) {
                if (!pngBlob) {
                  reject(new Error('Canvas toBlob (PNG) failed'));
                  return;
                }
                resolve({ jpeg: jpegBlob, png: pngBlob });
              }, 'image/png');
            }, 'image/jpeg', 0.85);
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

  // ── Download composite (PNG — higher quality) ────────────
  function downloadComposite(result) {
    // result is { jpeg, png } — use PNG for download
    var pngBlob = (result && result.png) ? result.png : result;
    var url = URL.createObjectURL(pngBlob);
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

  // ── Share composite (JPEG — smaller size for sharing) ────
  function shareComposite(result) {
    // result is { jpeg, png } — use JPEG for sharing (smaller file)
    var jpegBlob = (result && result.jpeg) ? result.jpeg : result;

    // If Web Share API is supported and can share files
    if (isWebShareSupported()) {
      var file = new File([jpegBlob], 'camshare-尋人啟事.jpg', { type: 'image/jpeg' });
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
            // Fallback to download (PNG)
            downloadComposite(result);
            return 'downloaded';
          });
      }
    }

    // Fallback: download (PNG)
    downloadComposite(result);
    return Promise.resolve('downloaded');
  }

  // ── Web Share API detection ─────────────────────────────
  function isWebShareSupported() {
    return !!(navigator.share && navigator.canShare);
  }

  // ── WebView detection ──────────────────────────────────
  function isWebView() {
    var ua = navigator.userAgent || navigator.vendor || '';
    if (/Line\//i.test(ua)) return true;
    if (/FBAN|FBAV|FBBV/i.test(ua)) return true;
    if (/Messenger/i.test(ua)) return true;
    if (/Instagram/i.test(ua)) return true;
    if (/MicroMessenger/i.test(ua)) return true;
    if (/wv/i.test(ua)) return true;
    if (/iPhone|iPad|iPod/.test(ua) && !/Safari/i.test(ua)) return true;
    return false;
  }

  // ── Create composite preview URL ───────────────────────
  function createPreviewURL(blob) {
    return URL.createObjectURL(blob);
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