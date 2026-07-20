/* ═══════════════════════════════════════════════════════════════
   PRO FINISH COATINGS — main.js
   No dependencies. Everything degrades gracefully without it:
   the FAQ still opens, the form still submits, the images still show.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── before / after: drag the cut line ───────────────────── */
  var ba = document.getElementById('ba');
  if (ba) {
    var range  = document.getElementById('baRange');
    var before = document.getElementById('baBefore');
    var line   = document.getElementById('baLine');
    var stage  = ba.querySelector('.ba__stage');

    function paint(pct) {
      var p = Math.max(0, Math.min(100, pct));
      before.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
      line.style.left = p + '%';
    }

    range.addEventListener('input', function () { paint(parseFloat(range.value)); });

    // dragging directly on the image feels more natural than the slider
    var dragging = false;

    function fromEvent(ev) {
      var box = stage.getBoundingClientRect();
      var pct = ((ev.clientX - box.left) / box.width) * 100;
      range.value = pct;
      paint(pct);
    }

    stage.addEventListener('pointerdown', function (ev) {
      dragging = true;
      stage.setPointerCapture(ev.pointerId);
      fromEvent(ev);
    });
    stage.addEventListener('pointermove', function (ev) {
      if (dragging) fromEvent(ev);
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      stage.addEventListener(t, function () { dragging = false; });
    });

    paint(50);
  }

  /* ── estimate form ───────────────────────────────────────── */
  var form = document.getElementById('estimateForm');
  if (!form) return;

  var status    = document.getElementById('formStatus');
  var submitBtn = document.getElementById('submitBtn');
  var loadedAt  = document.getElementById('formLoadedAt');
  if (loadedAt) loadedAt.value = String(Date.now());

  // A name needs at least one letter — "12" and "--" are not names. But a
  // one-letter first name is real, so length alone is the wrong test.
  var hasLetter = /\p{L}/u;

  var RULES = {
    first_name: { msg: 'Tell us your first name.',        test: function (v) { return hasLetter.test(v.trim()); } },
    last_name:  { msg: 'Tell us your last name.',         test: function (v) { return hasLetter.test(v.trim()); } },
    email:      { msg: 'That email does not look right.', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
    phone:      { msg: 'A 10-digit US number, please.',   test: function (v) { var d = v.replace(/\D/g, '');
                                                                               return d.length === 10 || (d.length === 11 && d[0] === '1'); } },
    zip:        { msg: 'Five-digit ZIP code, please.',    test: function (v) { return /^\d{5}$/.test(v.trim()); } },
    service:    { msg: 'Pick what needs painting.',       test: function (v) { return v !== ''; } }
  };

  function fieldOf(el) { return el.closest('.field'); }

  function check(el) {
    var rule = RULES[el.name];
    if (!rule) return true;
    var box = fieldOf(el);
    var ok  = rule.test(el.value);
    if (box) {
      box.classList.toggle('is-bad', !ok);
      var err = box.querySelector('[data-err]');
      if (err) {
        err.textContent = ok ? '' : rule.msg;
        // announce the specific problem, not just "something is wrong"
        if (!err.id) err.id = el.name + '-err';
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (ok) el.removeAttribute('aria-describedby');
        else    el.setAttribute('aria-describedby', err.id);
      }
    }
    return ok;
  }

  // validate on blur, forgive on retype
  Object.keys(RULES).forEach(function (name) {
    var el = form.elements[name];
    if (!el) return;
    el.addEventListener('blur', function () { check(el); });
    el.addEventListener('input', function () {
      var box = fieldOf(el);
      if (box && box.classList.contains('is-bad')) check(el);
    });
  });

  function say(text, kind) {
    status.textContent = text;
    status.className = 'form__status is-on ' + (kind ? 'is-' + kind : '');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var firstBad = null;
    Object.keys(RULES).forEach(function (name) {
      var el = form.elements[name];
      if (el && !check(el) && !firstBad) firstBad = el;
    });

    if (firstBad) {
      say('Check the highlighted fields and send it again.', 'bad');
      firstBad.focus();
      return;
    }

    /* Spam handling.
       Only the honeypot hard-blocks: it is off-screen and tabindex="-1",
       so a person cannot fill it, but a bot reliably does.

       Elapsed time is NOT a block. Browser autofill completes all six
       fields in one tap, so a fast submit is far more likely to be a
       returning customer than a bot. It travels as a flag for the
       receiving end to weigh — a real lead is never thrown away here. */
    var botted  = form.elements.company_website.value !== '';
    var elapsed = Date.now() - Number(loadedAt.value);

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    delete data.company_website;
    delete data.form_loaded_at;
    data.submitted_at   = new Date().toISOString();
    data.source         = 'profinishcoatings.com/#estimate';
    data.fill_seconds   = Math.round(elapsed / 100) / 10;
    data.suspected_bot  = elapsed < 1500;

    submitBtn.disabled = true;
    say('Sending…');

    sendLead(data, botted)
      .then(function () {
        form.reset();
        say('Got it. We will text and email you within one business hour to set up the walkthrough.', 'ok');
        submitBtn.disabled = false;
      })
      .catch(function () {
        // never dead-end a lead: hand them the phone number that is
        // actually on the page, so this survives the placeholder swap
        var tel = document.querySelector('.hdr__tel');
        var num = tel ? tel.textContent.replace(/^\s*Call\s*/, '').trim() : 'us';
        say('That did not go through. Call ' + num + ' and we will take it down over the phone.', 'bad');
        submitBtn.disabled = false;
      });
  });

  /* ═════════════════════════════════════════════════════════════
     ▓▓▓  THE ONLY INTEGRATION POINT  ▓▓▓

     Right now this resolves without sending anywhere — the form is
     fully built and validated, but no lead leaves the browser yet.

     To go live, set ENDPOINT below to one of:
       • a Make.com / Zapier webhook URL
       • a Formspree endpoint  (https://formspree.io/f/xxxxxxx)
       • your own /api/lead route

     Nothing else in this file or the HTML needs to change.
     ═════════════════════════════════════════════════════════════ */
  var ENDPOINT = ''; // ← paste the webhook URL here

  var TIMEOUT_MS = 12000;

  function sendLead(data, botted) {
    if (botted) {
      // honeypot was filled: pretend it worked, drop the payload
      return new Promise(function (res) { setTimeout(res, 600); });
    }

    if (!ENDPOINT) {
      // not wired up yet — log it so nothing is lost during review
      console.info('[Pro Finish] Lead captured (no endpoint configured):', data);
      return new Promise(function (res) { setTimeout(res, 700); });
    }

    // a webhook that accepts and never closes must not strand the form
    // on "Sending…" with the button disabled forever
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('Bad response: ' + r.status);
      return r;
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }
})();
