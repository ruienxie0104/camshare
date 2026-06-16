/* ===== CamShare — Phase 4: App Logic ===== */

(function () {
  'use strict';

  // ── Analytics ──────────────────────────────────────────
  function track(event, data) {
    var payload = {
      event: event,
      timestamp: Date.now(),
    };
    if (data) {
      Object.keys(data).forEach(function (key) {
        payload[key] = data[key];
      });
    }
    console.log('[CamShare]', JSON.stringify(payload));
    // TODO: Replace with GA or other analytics provider
  }

  // ── State ──────────────────────────────────────────────
  var state = {
    name: '',
    gender: null,    // '男' | '女' | '不指定' | null
    age: null,
    currentStep: 0,
    photoData: null,
    compositeData: null,
    compositeBlob: null,
  };

  // ── DOM Cache ──────────────────────────────────────────
  var steps = [];
  for (var i = 0; i <= 4; i++) {
    steps.push(document.getElementById('step-' + i));
  }

  var btnStart = document.getElementById('btn-start');
  var btnNextStep2 = document.getElementById('btn-next-step2');
  var btnCapture = document.getElementById('btn-capture');
  var btnConfirm = document.getElementById('btn-confirm');
  var btnRetake = document.getElementById('btn-retake');
  var btnShare = document.getElementById('btn-share');
  var btnRestart = document.getElementById('btn-restart');
  var btnRestartFinal = document.getElementById('btn-restart-final');
  var btnWebShare = document.getElementById('btn-web-share');
  var btnDownload = document.getElementById('btn-download');

  var inputName = document.getElementById('input-name');
  var inputAge = document.getElementById('input-age');
  var nameError = document.getElementById('name-error');
  var genderBtns = document.querySelectorAll('.gender-btn-new'); // updated class selector

  // Composite elements
  var compositeLoading = document.getElementById('composite-loading');
  var compositeImg = document.getElementById('composite-img');
  var shareImg = document.getElementById('share-img');
  var shareHint = document.getElementById('share-hint');

  // ── Landscape Lock ─────────────────────────────────────
  var landscapeOverlay = document.getElementById('landscape-overlay');

  function checkOrientation() {
    if (!landscapeOverlay) return;
    var isMobile = window.innerWidth <= 768;
    var isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile && isLandscape) {
      landscapeOverlay.classList.add('visible');
    } else {
      landscapeOverlay.classList.remove('visible');
    }
  }

  // Listen for orientation changes
  if (landscapeOverlay) {
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    if (screen.orientation) {
      screen.orientation.addEventListener('change', checkOrientation);
    }
  }

  // ── Step Indicator Updating ────────────────────────────
  function updateStepIndicator(stepIndex) {
    // Map stepIndex (0-4) to progress dot index (0-3)
    var activeDot = 0;
    if (stepIndex === 0) activeDot = 0;
    else if (stepIndex === 1) activeDot = 1;
    else if (stepIndex === 2) activeDot = 2;
    else if (stepIndex === 3 || stepIndex === 4) activeDot = 3;

    for (var d = 0; d <= 3; d++) {
      var dotEl = document.getElementById('step-dot-' + d);
      if (!dotEl) continue;

      if (d < activeDot) {
        dotEl.classList.remove('active');
        dotEl.classList.add('completed');
      } else if (d === activeDot) {
        dotEl.classList.add('active');
        dotEl.classList.remove('completed');
      } else {
        dotEl.classList.remove('active', 'completed');
      }
    }

    // Update lines (0 to 2)
    for (var l = 0; l <= 2; l++) {
      var lineFill = document.getElementById('step-line-' + l);
      if (!lineFill) continue;

      if (l < activeDot) {
        lineFill.style.width = '100%';
      } else {
        lineFill.style.width = '0%';
      }
    }
  }

  // ── 3D Card Tilt Effect ───────────────────────────────
  function init3DTilt() {
    var cards = document.querySelectorAll('.poster-3d-card');
    
    cards.forEach(function(card) {
      var sheen = card.querySelector('.poster-3d-sheen');
      
      function handleMove(e) {
        var rect = card.getBoundingClientRect();
        var x, y;
        
        if (e.touches && e.touches.length > 0) {
          x = e.touches[0].clientX - rect.left;
          y = e.touches[0].clientY - rect.top;
        } else {
          x = e.clientX - rect.left;
          y = e.clientY - rect.top;
        }
        
        // Normalize coordinates to range [-1, 1]
        var px = (x / rect.width) * 2 - 1;
        var py = (y / rect.height) * 2 - 1;
        
        // Max tilt angle (degrees)
        var maxTilt = 12;
        var tiltX = -py * maxTilt;
        var tiltY = px * maxTilt;
        
        card.style.transform = 'rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) scale(1.03)';
        
        // Dynamic Sheen effect position
        if (sheen) {
          var sheenX = (1 - px) * 50;
          var sheenY = (1 - py) * 50;
          sheen.style.backgroundPosition = sheenX + '% ' + sheenY + '%';
        }
      }
      
      function handleLeave() {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        if (sheen) {
          sheen.style.backgroundPosition = '0% 0%';
        }
      }
      
      // Desktop mouse events
      card.addEventListener('mousemove', handleMove);
      card.addEventListener('mouseleave', handleLeave);
      
      // Mobile touch events
      card.addEventListener('touchmove', function(e) {
        if (e.cancelable) e.preventDefault();
        handleMove(e);
      }, { passive: false });
      
      card.addEventListener('touchend', handleLeave);
    });
  }

  // ── Step Navigation (with slide animations) ─────────────
  var isAnimating = false;

  function goToStep(n) {
    if (n < 0 || n > 4) return;
    if (isAnimating) return;

    var currentIdx = state.currentStep;
    var targetIdx = n;
    var isForward = targetIdx > currentIdx;

    var current = steps[currentIdx];
    var target = steps[targetIdx];

    // Track step enter
    track('step_enter', { step: targetIdx, from: currentIdx });

    // Update Step Indicator UI
    updateStepIndicator(targetIdx);

    // Cleanup when leaving a step
    if (currentIdx === 2 && targetIdx !== 2) {
      if (window.CamCamera) {
        window.CamCamera.stopCamera();
      }
    }

    // Start animation
    isAnimating = true;

    // Slide out current
    current.classList.remove('active', 'slide-in-right', 'slide-in-left');
    current.classList.add(isForward ? 'slide-out-left' : 'slide-out-right');

    var animDuration = 250; // match slide-out duration

    setTimeout(function () {
      current.classList.remove('slide-out-left', 'slide-out-right');
      current.style.display = 'none';

      // Slide in target
      target.style.display = 'block';
      target.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-right', 'slide-in-left');
      target.classList.add(isForward ? 'slide-in-right' : 'slide-in-left');

      requestAnimationFrame(function () {
        target.classList.add('active');
      });

      var slideInDuration = 320;
      setTimeout(function () {
        target.classList.remove('slide-in-right', 'slide-in-left');
        isAnimating = false;
      }, slideInDuration);

      state.currentStep = targetIdx;

      // Setup when entering a step
      if (targetIdx === 2) {
        if (window.CamCamera) {
          window.CamCamera.initCamera();
        }
      }

      if (targetIdx === 3) {
        generateAndShowComposite();
      }

      if (targetIdx === 4) {
        setupShareStep();
      }

      // Push history state
      history.pushState({ step: targetIdx }, '', '#step-' + targetIdx);
    }, animDuration);
  }

  // ── Generate composite (with photo developing simulation) ──
  function generateAndShowComposite() {
    if (!window.CamComposite) return;
    if (!state.photoData) return;

    var compositeImgWrap = document.getElementById('composite-img-wrap');

    // Reset UI state for development animation
    if (compositeLoading) {
      compositeLoading.style.display = 'flex';
      var loadingText = compositeLoading.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = '0%';
      var progressFill = document.getElementById('developing-progress-fill');
      if (progressFill) progressFill.style.width = '0%';
    }
    if (compositeImgWrap) {
      compositeImgWrap.style.display = 'none';
    }
    if (compositeImg) {
      compositeImg.classList.remove('developed');
      compositeImg.style.display = 'none';
    }
    btnShare.disabled = true;

    window.CamComposite.generateComposite(state.photoData, {
      name: state.name,
      gender: state.gender || '',
      age: state.age,
    })
    .then(function (result) {
      // result = { jpeg: Blob, png: Blob }
      state.compositeBlob = result;  // Store both blobs

      // Create preview URL from JPEG (smaller for display)
      var url = URL.createObjectURL(result.jpeg);
      state.compositeData = url;

      if (compositeImg) {
        compositeImg.src = url;
      }

      // Start simulated developing progress (3.2 seconds total)
      var progress = 0;
      var progressFill = document.getElementById('developing-progress-fill');
      var loadingText = compositeLoading ? compositeLoading.querySelector('.loading-text') : null;
      
      // Reveal the container so layout completes, but image remains blurred
      if (compositeImgWrap) {
        compositeImgWrap.style.display = 'block';
      }
      if (compositeImg) {
        compositeImg.style.display = 'block';
      }

      var interval = setInterval(function() {
        progress += 2.5; // step increment
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Reveal fully developed image by removing blur
          if (compositeImg) {
            compositeImg.classList.add('developed');
          }
          
          // Hide loading overlay after development transition completes
          setTimeout(function() {
            if (compositeLoading) compositeLoading.style.display = 'none';
            btnShare.disabled = false;
            track('composite_complete');
          }, 600);
        }

        if (progressFill) {
          progressFill.style.width = progress + '%';
        }
        if (loadingText) {
          loadingText.textContent = Math.floor(progress) + '%';
        }
      }, 80); // 100 / 2.5 * 80ms = 3200ms
    })
    .catch(function (err) {
      console.error('Composite generation failed:', err);

      // Show error in composite area
      if (compositeLoading) {
        compositeLoading.innerHTML = '<p class="text-red-400 text-sm">生成失敗，請重試</p>';
      }
    });
  }

  // ── Setup share step ────────────────────────────────────
  function setupShareStep() {
    if (!state.compositeBlob) return;

    // Show composite image in share step (use JPEG for display — smaller)
    if (shareImg) {
      shareImg.src = URL.createObjectURL(state.compositeBlob.jpeg);
    }

    // Determine share method
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    var isWebViewBrowser = window.CamComposite && window.CamComposite.isWebView();
    var canWebShare = window.CamComposite && window.CamComposite.isWebShareSupported();

    // Show/hide web share button
    if (btnWebShare) {
      if (canWebShare && !isIOS && !isWebViewBrowser) {
        btnWebShare.style.display = 'block';
      } else {
        btnWebShare.style.display = 'none';
      }
    }

    // Show iOS/WebView hint
    if (shareHint) {
      if (isIOS || isWebViewBrowser) {
        shareHint.style.display = 'block';
      } else {
        shareHint.style.display = 'none';
      }
    }
  }

  // ── Validation ──────────────────────────────────────────
  function validateStep1() {
    var name = inputName.value.trim();
    var isValid = name.length > 0;

    btnNextStep2.disabled = !isValid;

    if (!isValid && inputName.value.length > 0) {
      nameError.classList.remove('hidden');
    } else {
      nameError.classList.add('hidden');
    }

    return isValid;
  }

  // ── Reset ───────────────────────────────────────────────
  function resetState() {
    state.name = '';
    state.gender = null;
    state.age = null;
    state.photoData = null;
    state.compositeData = null;
    state.compositeBlob = null;

    inputName.value = '';
    inputAge.value = '';
    nameError.classList.add('hidden');
    btnNextStep2.disabled = true;

    genderBtns.forEach(function (btn) {
      btn.classList.remove('selected');
    });

    // Reset composite UI
    if (compositeImg) {
      if (compositeImg.src) URL.revokeObjectURL(compositeImg.src);
      compositeImg.src = '';
      compositeImg.classList.remove('developed');
      compositeImg.style.display = 'none';
    }
    var compositeImgWrap = document.getElementById('composite-img-wrap');
    if (compositeImgWrap) {
      compositeImgWrap.style.display = 'none';
    }
    if (shareImg) {
      shareImg.src = '';
    }
    if (compositeLoading) {
      compositeLoading.style.display = 'flex';
      var loadingText = compositeLoading.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = '0%';
      var progressFill = document.getElementById('developing-progress-fill');
      if (progressFill) progressFill.style.width = '0%';
    }
    if (btnShare) btnShare.disabled = true;
  }

  // ── XSS-safe text setter ───────────────────────────────
  function safeText(element, text) {
    element.textContent = text;
  }

  // ── Gender Button Group ─────────────────────────────────
  function selectGender(gender) {
    state.gender = gender;

    genderBtns.forEach(function (btn) {
      if (btn.getAttribute('data-gender') === gender) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  // ── Event Bindings ─────────────────────────────────────

  // Step 0 → Start
  btnStart.addEventListener('click', function () {
    goToStep(1);
  });

  // Step 1 → Name input validation
  inputName.addEventListener('input', function () {
    state.name = inputName.value.trim();
    validateStep1();
  });

  // Step 1 → Gender buttons
  genderBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectGender(btn.getAttribute('data-gender'));
    });
  });

  // Step 1 → Age input
  inputAge.addEventListener('input', function () {
    var val = parseInt(inputAge.value, 10);
    state.age = isNaN(val) ? null : Math.min(Math.max(val, 1), 120);
  });

  // Step 1 → Next
  btnNextStep2.addEventListener('click', function () {
    if (!validateStep1()) return;
    track('form_complete', { name: state.name, gender: state.gender, age: state.age });
    goToStep(2);
  });

  // Step 2 → Capture photo
  btnCapture.addEventListener('click', function () {
    if (!window.CamCamera) return;

    btnCapture.style.display = 'none';

    window.CamCamera.capturePhoto().then(function (blob) {
      if (blob) {
        state.photoData = blob;
        window.CamCamera.showPreview(blob);
        track('photo_captured');
      } else {
        btnCapture.style.display = 'flex';
      }
    }).catch(function () {
      btnCapture.style.display = 'flex';
    });
  });

  // Step 2 → Confirm photo
  btnConfirm.addEventListener('click', function () {
    if (state.photoData) {
      track('photo_confirmed');
      goToStep(3);
    }
  });

  // Step 2 → Retake photo
  btnRetake.addEventListener('click', function () {
    state.photoData = null;
    track('photo_retaken');
    if (window.CamCamera) {
      window.CamCamera.resumeCamera();
    }
  });

  // Step 3 → Restart
  btnRestart.addEventListener('click', function () {
    track('restart', { from: 3 });
    resetState();
    goToStep(0);
  });

  // Step 3 → Share (go to step 4)
  btnShare.addEventListener('click', function () {
    goToStep(4);
  });

  // Step 4 → Web Share
  if (btnWebShare) {
    btnWebShare.addEventListener('click', function () {
      if (state.compositeBlob && window.CamComposite) {
        track('share_attempt', { method: 'webshare' });
        window.CamComposite.shareComposite(state.compositeBlob)
          .then(function (shareResult) {
            if (shareResult === 'shared') {
              track('share_success', { method: 'webshare' });
            } else {
              track('share_fallback', { method: 'download' });
            }
          })
          .catch(function () {
            track('share_fallback', { method: 'download' });
          });
      }
    });
  }

  // Step 4 → Download
  if (btnDownload) {
    btnDownload.addEventListener('click', function () {
      if (state.compositeBlob && window.CamComposite) {
        track('share_attempt', { method: 'download' });
        window.CamComposite.downloadComposite(state.compositeBlob);
        track('share_success', { method: 'download' });
      }
    });
  }

  // Step 4 → Restart
  btnRestartFinal.addEventListener('click', function () {
    track('restart', { from: 4 });
    resetState();
    goToStep(0);
  });

  // ── Browser Back Button ────────────────────────────────
  window.addEventListener('popstate', function (e) {
    var targetStep = 0;
    if (e.state && typeof e.state.step === 'number') {
      targetStep = Math.max(0, Math.min(4, e.state.step));
    }

    // Cleanup current step
    if (state.currentStep === 2 && targetStep !== 2) {
      if (window.CamCamera) {
        window.CamCamera.stopCamera();
      }
    }

    // Directly set without slide animation for back navigation
    steps[state.currentStep].classList.remove('active', 'slide-in-right', 'slide-in-left', 'developed');
    steps[state.currentStep].style.display = 'none';

    steps[targetStep].style.display = 'block';
    steps[targetStep].classList.add('active');
    state.currentStep = targetStep;

    // Update Step Indicator on back navigation
    updateStepIndicator(targetStep);

    // Init camera if going back to step 2
    if (targetStep === 2 && window.CamCamera) {
      window.CamCamera.initCamera();
    }

    // Re-generate composite if going back to step 3
    if (targetStep === 3 && state.photoData) {
      generateAndShowComposite();
    }
  });

  // ── Pulse animation for capture button ──────────────────
  // The camera module shows/hides btnCapture; we add pulse when visible
  var captureObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        var target = mutation.target;
        if (target === btnCapture) {
          if (btnCapture.style.display !== 'none' && btnCapture.style.display !== '') {
            btnCapture.classList.add('pulse');
          } else {
            btnCapture.classList.remove('pulse');
          }
        }
      }
    });
  });

  if (btnCapture) {
    captureObserver.observe(btnCapture, { attributes: true });
  }

  // ── Initialize ─────────────────────────────────────────
  // Ensure only step-0 is visible on load
  steps.forEach(function (step, idx) {
    if (idx === 0) {
      step.style.display = 'block';
      step.classList.add('active');
    } else {
      step.style.display = 'none';
      step.classList.remove('active');
    }
  });

  // Init step indicator on load
  updateStepIndicator(0);

  // Init 3D card tilt listeners
  init3DTilt();

  // Set initial history state
  history.replaceState({ step: 0 }, '', '#step-0');

  // Track initial step
  track('step_enter', { step: 0 });

  // Fade in page logic removed since CSS now handles fallback layout securely.

})();