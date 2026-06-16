/* ===== CamShare — Phase 2: Camera Module ===== */

(function () {
  'use strict';

  var videoEl = null;
  var canvasEl = null;
  var stream = null;
  var currentTrack = null;

  // ── DOM references (set during init) ───────────────────
  var cameraContainer = null;
  var cameraVideo = null;
  var posterOverlay = null;
  var faceGuide = null;
  var photoPreview = null;
  var btnCapture = null;
  var btnConfirm = null;
  var btnRetake = null;
  var cameraError = null;
  var cameraLoading = null;

  // ── Check HTTPS ────────────────────────────────────────
  function isSecureContext() {
    return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  // ── Show error ──────────────────────────────────────────
  function showError(type) {
    cameraVideo.style.display = 'none';
    posterOverlay.style.display = 'none';
    faceGuide.style.display = 'none';
    btnCapture.style.display = 'none';
    cameraLoading.style.display = 'none';

    cameraError.style.display = 'block';

    var titleEl = cameraError.querySelector('.error-title');
    var bodyEl = cameraError.querySelector('.error-body');

    if (type === 'no-https') {
      titleEl.textContent = '需要安全連線';
      bodyEl.textContent = '相機功能需要 HTTPS 才能使用。請改用 HTTPS 連線，或掃描活動 QR Code 進入。';
    } else if (type === 'not-supported') {
      titleEl.textContent = '瀏覽器不支援';
      bodyEl.textContent = '您的瀏覽器不支援相機功能。請使用最新版的 Chrome、Safari 或 Edge。';
    } else if (type === 'permission-denied') {
      titleEl.textContent = '需要相機權限';
      bodyEl.textContent = '請在瀏覽器設定中允許相機權限，然後重新整理頁面。iOS 請到「設定 → Safari → 相機」開啟權限；Android 請到「設定 → 應用程式 → 瀏覽器 → 權限」開啟相機。';
    } else {
      titleEl.textContent = '相機無法開啟';
      bodyEl.textContent = '發生未預期的錯誤，請重新整理頁面再試一次。如果問題持續，請使用其他瀏覽器。';
    }
  }

  // ── Show camera view ────────────────────────────────────
  function showCameraView() {
    cameraError.style.display = 'none';
    cameraLoading.style.display = 'none';
    cameraVideo.style.display = 'block';
    posterOverlay.style.display = 'block';
    faceGuide.style.display = 'flex';
    btnCapture.style.display = 'flex';

    // Show capture button wrapper, hide preview wrapper
    var captureBtnWrap = document.getElementById('capture-btn-wrap');
    if (captureBtnWrap) captureBtnWrap.style.display = 'flex';
    var previewBtnWrap = document.getElementById('preview-btn-wrap');
    if (previewBtnWrap) previewBtnWrap.style.display = 'none';
  }

  // ── Init camera ─────────────────────────────────────────
  function initCamera() {
    // Cache DOM elements
    cameraVideo = document.getElementById('camera-video');
    posterOverlay = document.getElementById('poster-overlay');
    faceGuide = document.getElementById('face-guide');
    photoPreview = document.getElementById('photo-preview');
    btnCapture = document.getElementById('btn-capture');
    btnConfirm = document.getElementById('btn-confirm');
    btnRetake = document.getElementById('btn-retake');
    cameraError = document.getElementById('camera-error');
    cameraLoading = document.getElementById('camera-loading');
    cameraContainer = document.getElementById('camera-container');

    if (!cameraVideo) return;

    // Check HTTPS first
    if (!isSecureContext()) {
      showError('no-https');
      return;
    }

    // Check getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('not-supported');
      return;
    }

    // Show loading
    cameraLoading.style.display = 'flex';
    cameraError.style.display = 'none';
    cameraVideo.style.display = 'none';
    posterOverlay.style.display = 'none';
    faceGuide.style.display = 'none';
    btnCapture.style.display = 'none';

    // Reset previous preview state if returning from restart
    if (photoPreview) {
      photoPreview.style.display = 'none';
      if (photoPreview.src) {
        URL.revokeObjectURL(photoPreview.src);
        photoPreview.src = '';
      }
    }
    if (btnConfirm) btnConfirm.style.display = 'none';
    if (btnRetake) btnRetake.style.display = 'none';
    var previewBtnWrap = document.getElementById('preview-btn-wrap');
    if (previewBtnWrap) previewBtnWrap.style.display = 'none';

    var constraints = {
      video: {
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 960 }
      },
      audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function (mediaStream) {
        stream = mediaStream;
        currentTrack = mediaStream.getVideoTracks()[0];

        // Set video source
        cameraVideo.srcObject = mediaStream;

        // iOS requirements
        cameraVideo.setAttribute('playsinline', '');
        cameraVideo.setAttribute('muted', '');
        cameraVideo.muted = true;

        cameraVideo.play()
          .then(function () {
            showCameraView();
          })
          .catch(function (playErr) {
            console.error('Video play failed:', playErr);
            showError('play-error');
          });
      })
      .catch(function (err) {
        console.error('getUserMedia error:', err);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          showError('permission-denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          showError('not-supported');
        } else {
          showError('unknown');
        }
      });
  }

  // ── Capture photo ──────────────────────────────────────
  function capturePhoto() {
    if (!cameraVideo || !stream) return null;

    // Create offscreen canvas matching video dimensions
    var vw = cameraVideo.videoWidth;
    var vh = cameraVideo.videoHeight;

    if (vw === 0 || vh === 0) return null;

    canvasEl = document.createElement('canvas');
    canvasEl.width = vw;
    canvasEl.height = vh;

    var ctx = canvasEl.getContext('2d');

    // Mirror the image horizontally (front camera is mirrored)
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraVideo, 0, 0, vw, vh);

    // Pause the video
    cameraVideo.pause();

    // Get blob
    return new Promise(function (resolve) {
      canvasEl.toBlob(function (blob) {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }

  // ── Show preview ────────────────────────────────────────
  function showPreview(blob) {
    if (!blob) return;

    var url = URL.createObjectURL(blob);

    // Set preview image
    var previewImg = photoPreview.querySelector('img');
    if (previewImg) {
      previewImg.src = url;
    }

    // Hide camera view, show preview
    cameraVideo.style.display = 'none';
    posterOverlay.style.display = 'none';
    faceGuide.style.display = 'none';
    btnCapture.style.display = 'none';

    // Hide capture button wrapper
    var captureBtnWrap = document.getElementById('capture-btn-wrap');
    if (captureBtnWrap) captureBtnWrap.style.display = 'none';

    photoPreview.style.display = 'block';
    btnConfirm.style.display = 'flex';
    btnRetake.style.display = 'flex';

    // Show the preview button wrapper
    var previewBtnWrap = document.getElementById('preview-btn-wrap');
    if (previewBtnWrap) previewBtnWrap.style.display = 'flex';
  }

  // ── Resume camera (retake) ──────────────────────────────
  function resumeCamera() {
    if (!cameraVideo || !stream) return;

    // Hide preview
    photoPreview.style.display = 'none';
    btnConfirm.style.display = 'none';
    btnRetake.style.display = 'none';

    // Hide the preview button wrapper
    var previewBtnWrap = document.getElementById('preview-btn-wrap');
    if (previewBtnWrap) previewBtnWrap.style.display = 'none';

    // Revoke old object URL
    var previewImg = photoPreview.querySelector('img');
    if (previewImg && previewImg.src) {
      URL.revokeObjectURL(previewImg.src);
      previewImg.src = '';
    }

    // Resume video
    cameraVideo.play()
      .then(function () {
        showCameraView();
      })
      .catch(function () {
        // If play fails, try re-init
        initCamera();
      });
  }

  // ── Stop camera ─────────────────────────────────────────
  function stopCamera() {
    if (currentTrack) {
      currentTrack.stop();
      currentTrack = null;
    }
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
      stream = null;
    }

    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }

    // Clean up preview URL if exists
    if (photoPreview) {
      var previewImg = photoPreview.querySelector('img');
      if (previewImg && previewImg.src) {
        URL.revokeObjectURL(previewImg.src);
      }
    }

    // Clean up canvas
    canvasEl = null;
  }

  // ── Expose API ──────────────────────────────────────────
  window.CamCamera = {
    initCamera: initCamera,
    capturePhoto: capturePhoto,
    showPreview: showPreview,
    resumeCamera: resumeCamera,
    stopCamera: stopCamera,
  };

})();