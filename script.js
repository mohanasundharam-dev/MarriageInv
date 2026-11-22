'use strict';

/* ══════════════════════════════════════════════
   Wedding Site — Arun & Janani — script.js
══════════════════════════════════════════════ */

/* ── 1. AUDIO ENGINE ────────────────────────────────
   Handles all browser audio error cases:
   - NotAllowedError  → mobile blocks autoplay; show tap-banner
   - NotSupportedError→ format unsupported; hide music UI silently
   - AbortError       → load interrupted; retry once after 1s
   - Any other error  → hide music UI, fail gracefully
─────────────────────────────────────────────────── */

var AudioEngine = (function () {
  var audio      = document.getElementById('bgAudio');
  var retried    = false;        // AbortError retry flag
  var canPlay    = true;         // set false if format unsupported

  /* ── volume fade-in ── */
  function fadeIn() {
    if (!audio) return;
    audio.volume = 0;
    var target = 0.65;
    var iv = setInterval(function () {
      if (audio.volume < target - 0.02) audio.volume += 0.02;
      else { audio.volume = target; clearInterval(iv); }
    }, 90);
  }

  /* ── show / hide the "tap to play" banner ── */
  function showTapBanner() {
    var banner = document.getElementById('tapBanner');
    if (banner) banner.classList.add('visible');
  }
  function hideTapBanner() {
    var banner = document.getElementById('tapBanner');
    if (banner) banner.classList.remove('visible');
  }

  /* ── classify & handle the DOMException ── */
  function handleError(err) {
    var name = (err && err.name) ? err.name : 'UnknownError';

    if (name === 'NotAllowedError') {
      // Mobile / browser blocked autoplay — need a user gesture
      updateMusicBtn(false);
      showTapBanner();

    } else if (name === 'NotSupportedError') {
      // Format not supported on this device — hide music UI entirely
      canPlay = false;
      updateMusicBtn(false);
      var btn = document.getElementById('musicBtn');
      if (btn) btn.style.display = 'none';

    } else if (name === 'AbortError') {
      // Load was interrupted (common on slow connections / iOS)
      // Retry once after 1 second
      if (!retried) {
        retried = true;
        setTimeout(function () { tryPlay(); }, 1000);
      } else {
        // Second failure — treat like NotAllowedError
        updateMusicBtn(false);
        showTapBanner();
      }

    } else {
      // NotFoundError or any other — fail silently
      updateMusicBtn(false);
    }
  }

  /* ── attempt playback ── */
  function tryPlay() {
    if (!audio || !canPlay) return;

    // Ensure audio is loaded enough to play
    if (audio.readyState === 0) {
      audio.load();
    }

    var p = audio.play();
    if (p !== undefined) {
      p.then(function () {
        fadeIn();
        updateMusicBtn(true);
        hideTapBanner();
      }).catch(function (err) {
        handleError(err);
      });
    }
  }

  /* ── public API ── */
  return {
    tryPlay: tryPlay,
    toggle: function () {
      if (!audio || !canPlay) return;
      if (audio.paused) {
        var p = audio.play();
        if (p !== undefined) {
          p.then(function () {
            updateMusicBtn(true);
            hideTapBanner();
            if (audio.volume === 0) fadeIn();
          }).catch(function (err) {
            handleError(err);
          });
        }
      } else {
        audio.pause();
        updateMusicBtn(false);
      }
    }
  };
})();


/* ── 1b. LOADER DISMISS ─────────────────────────── */
(function () {
  var loader    = document.getElementById('loader');
  var MIN_MS    = 2600;
  var startTime = Date.now();

  function dismissLoader() {
    var elapsed = Date.now() - startTime;
    var wait    = Math.max(0, MIN_MS - elapsed);

    setTimeout(function () {
      loader.classList.add('hiding');
      setTimeout(function () {
        loader.style.display = 'none';
        document.body.classList.add('loaded');
        // Attempt autoplay after reveal
        AudioEngine.tryPlay();
      }, 1200);
    }, wait);
  }

  if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', dismissLoader);
})();


/* ── 2. MUSIC TOGGLE BUTTON + TAP BANNER ─────────── */
function updateMusicBtn(playing) {
  var iconPlay  = document.getElementById('iconPlay');
  var iconPause = document.getElementById('iconPause');
  if (!iconPlay || !iconPause) return;
  if (playing) {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  } else {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }
}

(function () {
  var btn = document.getElementById('musicBtn');
  if (btn) btn.addEventListener('click', function () { AudioEngine.toggle(); });

  // Tap banner button (shown when autoplay is blocked)
  var bannerBtn = document.getElementById('tapBannerBtn');
  if (bannerBtn) bannerBtn.addEventListener('click', function () { AudioEngine.toggle(); });
})();


/* ── 3. NAV SCROLL SHRINK ───────────────────────── */
(function () {
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else                     nav.classList.remove('scrolled');
  }, { passive: true });
})();


/* ── 4. COUNTDOWN TIMER ─────────────────────────── */
(function () {
  var target = new Date('2026-12-14T06:45:00+05:30').getTime();
  var elD = document.getElementById('cd-days');
  var elH = document.getElementById('cd-hours');
  var elM = document.getElementById('cd-mins');
  var elS = document.getElementById('cd-secs');
  var prevS = -1;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      document.getElementById('cdWrap').innerHTML =
        '<div class="cd-block" style="min-width:260px"><span class="cd-num" style="font-size:1.5rem">The day is here!</span></div>';
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000)  / 60000);
    var s = Math.floor((diff % 60000)    / 1000);

    if (s !== prevS) {
      bump(elS);
      if (s === 59) bump(elM);
      if (s === 59 && m === 59) bump(elH);
      prevS = s;
    }
    elD.textContent = pad(d);
    elH.textContent = pad(h);
    elM.textContent = pad(m);
    elS.textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();


/* ── 5. SCROLL REVEAL ───────────────────────────── */
(function () {
  var items = document.querySelectorAll('.reveal');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(function () { el.classList.add('visible'); }, delay);
      obs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { obs.observe(el); });
})();


/* ── 6. HERO PARALLAX ───────────────────────────── */
(function () {
  var heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;
  window.addEventListener('scroll', function () {
    heroBg.style.transform = 'scale(1.1) translateY(' + (window.scrollY * 0.18) + 'px)';
  }, { passive: true });
})();


/* ── 7. SMOOTH SCROLL ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
  link.addEventListener('click', function (e) {
    var id = link.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});


/* ── 8. LIGHTBOX ────────────────────────────────── */
function openLightbox(src) {
  var lb = document.getElementById('lightbox');
  document.getElementById('lbImg').src = src;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  var lb = document.getElementById('lightbox');
  if (e && e.type === 'click') {
    if (e.target !== lb && !e.target.closest('#lbClose')) return;
  }
  lb.classList.remove('active');
  document.getElementById('lbImg').src = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    var lb = document.getElementById('lightbox');
    if (lb.classList.contains('active')) {
      lb.classList.remove('active');
      document.getElementById('lbImg').src = '';
      document.body.style.overflow = '';
    }
  }
});

window.openLightbox  = openLightbox;
window.closeLightbox = closeLightbox;
