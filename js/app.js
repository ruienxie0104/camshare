/* ===== CamShare — Phase 1: App Logic ===== */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  const state = {
    name: '',
    gender: null,    // '男' | '女' | '不指定' | null
    age: null,
    currentStep: 0,
    photoData: null,
    compositeData: null,
  };

  // ── DOM Cache ──────────────────────────────────────────
  const steps = [];
  for (let i = 0; i <= 4; i++) {
    steps.push(document.getElementById('step-' + i));
  }

  const btnStart = document.getElementById('btn-start');
  const btnNextStep2 = document.getElementById('btn-next-step2');
  const btnCapture = document.getElementById('btn-capture');
  const btnShare = document.getElementById('btn-share');
  const btnRestart = document.getElementById('btn-restart');
  const btnRestartFinal = document.getElementById('btn-restart-final');

  const inputName = document.getElementById('input-name');
  const inputAge = document.getElementById('input-age');
  const nameError = document.getElementById('name-error');
  const genderBtns = document.querySelectorAll('.gender-btn');

  // ── Step Navigation ────────────────────────────────────
  function goToStep(n) {
    if (n < 0 || n > 4) return;

    const current = steps[state.currentStep];
    const target = steps[n];

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

      // Push history state
      history.pushState({ step: n }, '', '#step-' + n);
    }, 200);
  }

  // ── Validation ──────────────────────────────────────────
  function validateStep1() {
    const name = inputName.value.trim();
    const isValid = name.length > 0;

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

  // Step 2 → Continue (placeholder for camera)
  btnCapture.addEventListener('click', function () {
    // Phase 2 will add camera logic here
    goToStep(3);
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

    // Directly set without animation for back navigation
    steps[state.currentStep].classList.remove('active');
    steps[state.currentStep].style.display = 'none';

    steps[targetStep].style.display = 'block';
    steps[targetStep].classList.add('active');
    state.currentStep = targetStep;
  });

  // ── Initialize ─────────────────────────────────────────
  // Ensure only step-0 is visible on load
  steps.forEach(function (step, i) {
    if (i === 0) {
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