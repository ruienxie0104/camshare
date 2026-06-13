/* ===== CamShare — Phase 2: App Logic ===== */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  var state = {
    name: '',
    gender: null,    // '男' | '女' | '不指定' | null
    age: null,
    currentStep: 0,
    photoData: null,
    compositeData: null,
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

  var inputName = document.getElementById('input-name');
  var inputAge = document.getElementById('input-age');
  var nameError = document.getElementById('name-error');
  var genderBtns = document.querySelectorAll('.gender-btn');

  // ── Step Navigation ────────────────────────────────────
  function goToStep(n) {
    if (n < 0 || n > 4) return;

    var current = steps[state.currentStep];
    var target = steps[n];

    // Cleanup when leaving a step
    if (state.currentStep === 2 && n !== 2) {
      // Leaving camera step
      if (window.CamCamera) {
        window.CamCamera.stopCamera();
      }
    }

    // Fade out current
    current.classList.remove('active');
    current.classList.add('fade-out');

    setTimeout(function () {
      current.classList.remove('fade-out');
      current.style.display = 'none';

      // Fade in target
      target.style.display = 'block';
      target.classList.add('fade-in');

      requestAnimationFrame(function () {
        target.classList.remove('fade-in');
        target.classList.add('active');
      });

      state.currentStep = n;

      // Setup when entering a step
      if (n === 2) {
        // Entering camera step
        if (window.CamCamera) {
          window.CamCamera.initCamera();
        }
      }

      // Push history state
      history.pushState({ step: n }, '', '#step-' + n);
    }, 200);
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

    inputName.value = '';
    inputAge.value = '';
    nameError.classList.add('hidden');
    btnNextStep2.disabled = true;

    genderBtns.forEach(function (btn) {
      btn.classList.remove('selected');
    });
  }

  // ── XSS-safe text setter ───────────────────────────────
  function safeText(element, text) {
    element.textContent = text;
  }

  // ── Gender Button Group ────────────────────────────────
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
      } else {
        // If capture failed, re-show capture button
        btnCapture.style.display = 'flex';
      }
    }).catch(function () {
      btnCapture.style.display = 'flex';
    });
  });

  // Step 2 → Confirm photo
  btnConfirm.addEventListener('click', function () {
    if (state.photoData) {
      goToStep(3);
    }
  });

  // Step 2 → Retake photo
  btnRetake.addEventListener('click', function () {
    state.photoData = null;
    if (window.CamCamera) {
      window.CamCamera.resumeCamera();
    }
  });

  // Step 3 → Restart
  btnRestart.addEventListener('click', function () {
    resetState();
    goToStep(0);
  });

  // Step 3 → Share
  btnShare.addEventListener('click', function () {
    goToStep(4);
  });

  // Step 4 → Restart
  btnRestartFinal.addEventListener('click', function () {
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

    // Directly set without animation for back navigation
    steps[state.currentStep].classList.remove('active');
    steps[state.currentStep].style.display = 'none';

    steps[targetStep].style.display = 'block';
    steps[targetStep].classList.add('active');
    state.currentStep = targetStep;

    // Init camera if going back to step 2
    if (targetStep === 2 && window.CamCamera) {
      window.CamCamera.initCamera();
    }
  });

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

  // Set initial history state
  history.replaceState({ step: 0 }, '', '#step-0');

})();