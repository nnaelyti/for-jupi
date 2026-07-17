/* =====================================================================
   BIRTHDAY WEBSITE — JAVIER ERIC PRABOWO
   Vanilla JS, modular. Each scene has its own init function.
   ===================================================================== */

'use strict';

/* ---------------------------------------------------------------------
   CONFIG
   --------------------------------------------------------------------- */
const CONFIG = {
  recipientName: 'Javier Eric Prabowo',
  galleryPhotoCount: 8,
  loadingSteps: [
    'Mempersiapkan kejutan...',
    'Mengumpulkan foto...',
    'Memuat ucapan...',
    'Hampir selesai...'
  ],
  loadingDurationMs: 3200
};

/* ---------------------------------------------------------------------
   SCENE NAVIGATION
   --------------------------------------------------------------------- */
const SceneManager = (() => {
  const order = [
    'scene-opening',
    'scene-loading',
    'scene-verification',
    'scene-birthday',
    'scene-envelope',
    'scene-gallery',
    'scene-cake',
    'scene-closing'
  ];

  function goTo(sceneId) {
    order.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('is-active', id === sceneId);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    if (sceneId === 'scene-birthday') Typing.play();
    if (sceneId === 'scene-closing') Fireworks.start();
    if (sceneId !== 'scene-closing') Fireworks.stop();
  }

  function first() {
    return order[0];
  }

  return { goTo, first, order };
})();

/* ---------------------------------------------------------------------
   BACKGROUND — floating particles on canvas
   --------------------------------------------------------------------- */
const Particles = (() => {
  let canvas, ctx, particles, rafId, width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.min(60, Math.floor((width * height) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.5 + 0.6,
      speedY: Math.random() * 0.4 + 0.1,
      drift: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.5 + 0.2
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    particles.forEach((p) => {
      p.y -= p.speedY;
      p.x += p.drift;
      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(tick);
  }

  function init() {
    canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    createParticles();
    tick();
    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }

  return { init };
})();

/* ---------------------------------------------------------------------
   STARS LAYER — appears from the envelope scene onward for depth
   --------------------------------------------------------------------- */
const StarsLayer = (() => {
  function init() {
    const layer = document.getElementById('starsLayer');
    if (!layer) return;
    const count = 40;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = (Math.random() * 3) + 's';
      layer.appendChild(star);
    }
  }
  function show() {
    const layer = document.getElementById('starsLayer');
    if (layer) layer.classList.add('is-visible');
  }
  return { init, show };
})();

/* ---------------------------------------------------------------------
   SCENE 1 — OPENING
   --------------------------------------------------------------------- */
const Opening = (() => {
  function init() {
    const btn = document.getElementById('btnStart');
    btn.addEventListener('click', () => {
      AudioPlayer.revealAndPlay();
      SceneManager.goTo('scene-loading');
      Loading.play();
    }, { once: false });
  }
  return { init };
})();

/* ---------------------------------------------------------------------
   SCENE 2 — LOADING
   --------------------------------------------------------------------- */
const Loading = (() => {
  const circumference = 2 * Math.PI * 44;
  let timeoutHandles = [];

  function clearTimers() {
    timeoutHandles.forEach(clearTimeout);
    timeoutHandles = [];
  }

  function play() {
    clearTimers();
    const textEl = document.getElementById('loadingText');
    const barFill = document.getElementById('loadingBarFill');
    const ringFg = document.getElementById('loadingRingFg');
    const percentEl = document.getElementById('loadingPercent');

    ringFg.style.strokeDasharray = String(circumference);
    ringFg.style.strokeDashoffset = String(circumference);

    const totalSteps = CONFIG.loadingSteps.length;
    const stepDuration = CONFIG.loadingDurationMs / totalSteps;

    CONFIG.loadingSteps.forEach((message, index) => {
      const handle = setTimeout(() => {
        textEl.style.opacity = 0;
        setTimeout(() => {
          textEl.textContent = message;
          textEl.style.opacity = 1;
        }, 150);
      }, index * stepDuration);
      timeoutHandles.push(handle);
    });

    const startTime = performance.now();
    function animateProgress(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / CONFIG.loadingDurationMs);
      const percent = Math.round(progress * 100);
      barFill.style.width = percent + '%';
      percentEl.textContent = percent + '%';
      ringFg.style.strokeDashoffset = String(circumference * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        const handle = setTimeout(() => {
          SceneManager.goTo('scene-verification');
        }, 400);
        timeoutHandles.push(handle);
      }
    }
    requestAnimationFrame(animateProgress);
  }

  return { play };
})();

/* ---------------------------------------------------------------------
   SCENE 3 — VERIFICATION
   --------------------------------------------------------------------- */
const Verification = (() => {
  const funnyWrongMessages = [
    'Hmm, sepertinya bukan ya... coba lagi!',
    'Wah, salah jawaban! Ayo tebak sekali lagi.',
    'Bukan itu jawabannya, coba pikir lagi ya!'
  ];

  function init() {
    const card = document.getElementById('verificationCard');
    const options = document.querySelectorAll('.option-btn');
    const feedback = document.getElementById('verificationFeedback');

    options.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';

        if (isCorrect) {
          btn.classList.add('is-correct');
          feedback.textContent = 'Benar! Ayo lanjutkan...';
          options.forEach((b) => (b.disabled = true));
          setTimeout(() => {
            StarsLayer.show();
            SceneManager.goTo('scene-birthday');
          }, 700);
        } else {
          btn.classList.add('is-wrong');
          card.classList.remove('is-shaking');
          void card.offsetWidth; // restart animation
          card.classList.add('is-shaking');
          const msg = funnyWrongMessages[Math.floor(Math.random() * funnyWrongMessages.length)];
          feedback.textContent = msg;
          setTimeout(() => btn.classList.remove('is-wrong'), 500);
        }
      });
    });
  }

  return { init };
})();

/* ---------------------------------------------------------------------
   SCENE 4 — BIRTHDAY TITLE (typing effect)
   --------------------------------------------------------------------- */
const Typing = (() => {
  let hasPlayed = false;

  function play() {
    if (hasPlayed) return;
    hasPlayed = true;

    const target = document.getElementById('typedName');
    const cursor = document.getElementById('typeCursor');
    const text = CONFIG.recipientName;
    let i = 0;

    function typeChar() {
      if (i < text.length) {
        target.textContent += text.charAt(i);
        i++;
        setTimeout(typeChar, 65);
      } else {
        cursor.classList.add('is-done');
      }
    }
    setTimeout(typeChar, 900);
  }

  return { play };
})();

const BirthdayScene = (() => {
    function init() {
        document
            .getElementById("btnToEnvelope")
            .addEventListener("click", () => {
                SceneManager.goTo("scene-envelope");
            });
    }

    return { init };
})();

/* ---------------------------------------------------------------------
   SCENE 5/6 — ENVELOPE & LETTER
   --------------------------------------------------------------------- */
const Envelope = (() => {
  function init() {
    const envelope = document.getElementById('envelope');
    const hint = document.getElementById('envelopeHint');
    const nextBtn = document.getElementById('btnToGallery');

    function open() {
      if (envelope.classList.contains('is-open')) return;
      envelope.classList.add('is-open');
      hint.style.opacity = '0';
      setTimeout(() => {
        nextBtn.classList.remove('is-hidden');
      }, 900);
    }

    envelope.addEventListener('click', open);
    envelope.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    nextBtn.addEventListener('click', () => SceneManager.goTo('scene-gallery'));
  }
  return { init };
})();

/* ---------------------------------------------------------------------
   SCENE 7 — GALLERY (slider + polaroid + lightbox)
   --------------------------------------------------------------------- */
const Gallery = (() => {
  let currentIndex = 0;
  let itemsPerView = 1;
  let totalItems = CONFIG.galleryPhotoCount;

  function getItemsPerView() {
    const w = window.innerWidth;
    if (w >= 980) return 3;
    if (w >= 640) return 2;
    return 1;
  }

  function buildSlides() {
    const track = document.getElementById('galleryTrack');
    const dotsWrap = document.getElementById('galleryDots');
    track.innerHTML = '';
    dotsWrap.innerHTML = '';

    for (let i = 1; i <= totalItems; i++) {
      const li = document.createElement('li');
      li.className = 'gallery-item';

      const figure = document.createElement('figure');
      figure.className = 'polaroid';
      figure.style.setProperty('--tilt', (i % 2 === 0 ? 2 : -2) + 'deg');
      figure.dataset.src = `assets/images/foto${i}.jpg`;

      const photo = document.createElement('div');
      photo.className = 'polaroid__photo';
      photo.style.background = `url('assets/images/foto${i}.jpg') center/cover no-repeat, linear-gradient(135deg, var(--secondary), var(--primary))`;

      const caption = document.createElement('figcaption') ? null : null; // placeholder guard (unused)
      const figcap = document.createElement('figcaption');
      figcap.className = 'polaroid__caption';
      figcap.textContent = `Foto #${i}`;

      figure.appendChild(photo);
      figure.appendChild(figcap);
      figure.addEventListener('click', () => Lightbox.open(figure.dataset.src));

      li.appendChild(figure);
      track.appendChild(li);

      const dot = document.createElement('button');
      dot.className = 'gallery-dot';
      dot.setAttribute('aria-label', `Ke foto ${i}`);
      dot.addEventListener('click', () => goTo(i - 1));
      dotsWrap.appendChild(dot);
    }
  }

  function update() {
    const track = document.getElementById('galleryTrack');
    const dots = document.querySelectorAll('.gallery-dot');
    const maxIndex = Math.max(0, totalItems - itemsPerView);
    currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

    const itemWidthPercent = 100 / itemsPerView;
    track.style.transform = `translateX(-${currentIndex * itemWidthPercent}%)`;

    dots.forEach((d, idx) => d.classList.toggle('is-active', idx === currentIndex));
  }

  function goTo(index) {
    currentIndex = index;
    update();
  }

  function next() {
    currentIndex++;
    update();
  }

  function prev() {
    currentIndex--;
    update();
  }

  function init() {
    itemsPerView = getItemsPerView();
    buildSlides();
    update();

    document.getElementById('galleryNext').addEventListener('click', next);
    document.getElementById('galleryPrev').addEventListener('click', prev);
    document.getElementById('btnToCake').addEventListener('click', () => SceneManager.goTo('scene-cake'));

    window.addEventListener('resize', () => {
      const newItemsPerView = getItemsPerView();
      if (newItemsPerView !== itemsPerView) {
        itemsPerView = newItemsPerView;
        update();
      }
    });
  }

  return { init };
})();

/* ---------------------------------------------------------------------
   LIGHTBOX
   --------------------------------------------------------------------- */
const Lightbox = (() => {
  function open(src) {
    const box = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    box.classList.add('is-open');
  }
  function close() {
    document.getElementById('lightbox').classList.remove('is-open');
  }
  function init() {
    document.getElementById('lightboxClose').addEventListener('click', close);
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }
  return { init, open, close };
})();

/* ---------------------------------------------------------------------
   SCENE 8 — CAKE & CANDLE
   --------------------------------------------------------------------- */
const Cake = (() => {
  function blowOut() {
    const candle = document.getElementById('candle');
    const wishText = document.getElementById('wishText');
    const nextBtn = document.getElementById('btnToClosing');

    if (candle.classList.contains('is-blown')) return;
    candle.classList.add('is-blown');
    wishText.classList.add('is-visible');

    // little smoke puffs
    for (let i = 0; i < 3; i++) {
      const puff = document.createElement('div');
      puff.className = 'smoke';
      puff.style.left = (i - 1) * 3 + 'px';
      puff.style.animationDelay = i * 0.15 + 's';
      candle.appendChild(puff);
      requestAnimationFrame(() => puff.classList.add('is-blown'));
      puff.style.animation = 'smokeRise 1.6s ease-out forwards';
      puff.style.animationDelay = i * 0.15 + 's';
    }

    setTimeout(() => nextBtn.classList.remove('is-hidden'), 900);
  }

  function init() {
    const candle = document.getElementById('candle');
    candle.addEventListener('click', blowOut);
    candle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        blowOut();
      }
    });
    document.getElementById('btnToClosing').addEventListener('click', () => SceneManager.goTo('scene-closing'));
  }

  return { init };
})();

/* ---------------------------------------------------------------------
   SCENE 9 — FIREWORKS / CONFETTI / METEORS
   --------------------------------------------------------------------- */
const Fireworks = (() => {
  let canvas, ctx, rafId, particles, width, height, running = false;
  let spawnInterval;

  const colors = ['#87CEFA', '#BFEFFF', '#4EA5E0', '#FFFFFF', '#2E6FA3'];

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  function spawnBurst() {
    const x = Math.random() * width * 0.8 + width * 0.1;
    const y = Math.random() * height * 0.5 + height * 0.1;
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 2.4 + 1.2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.015 + 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2.4 + 1.4,
        type: 'burst'
      });
    }
  }

  function spawnMeteor() {
    particles.push({
      x: Math.random() * width,
      y: -20,
      vx: -1.5 - Math.random(),
      vy: 2.4 + Math.random(),
      life: 1,
      decay: 0.006,
      color: '#ffffff',
      size: 2,
      type: 'meteor'
    });
  }

  function spawnConfetti() {
    particles.push({
      x: Math.random() * width,
      y: -10,
      vx: (Math.random() - 0.5) * 1.2,
      vy: Math.random() * 1.4 + 0.8,
      life: 1,
      decay: 0.004,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 3,
      rotation: Math.random() * 360,
      type: 'confetti'
    });
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'burst') p.vy += 0.02; // gravity
      p.life -= p.decay;

      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;

      if (p.type === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation + p.y) * Math.PI / 180);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'meteor' ? 12 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    particles = particles.filter((p) => p.life > 0 && p.y < height + 40);
    ctx.globalAlpha = 1;

    if (running) rafId = requestAnimationFrame(tick);
  }

  function start() {
    canvas = document.getElementById('fireworksCanvas');
    if (!canvas || running) return;
    ctx = canvas.getContext('2d');
    resize();
    particles = [];
    running = true;
    tick();

    spawnInterval = setInterval(() => {
      spawnBurst();
      if (Math.random() > 0.5) spawnMeteor();
      for (let i = 0; i < 4; i++) spawnConfetti();
    }, 700);

    // Immediate first burst so it doesn't feel delayed
    spawnBurst();
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (spawnInterval) clearInterval(spawnInterval);
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = [];
  }

  window.addEventListener('resize', () => {
    if (canvas && running) resize();
  });

  return { start, stop };
})();

/* ---------------------------------------------------------------------
   AUDIO PLAYER
   --------------------------------------------------------------------- */
const AudioPlayer = (() => {
  let audio, toggleBtn, playIcon, pauseIcon, volumeSlider, playerWrap, isPlaying = false;

  function updateIcons() {
    playIcon.classList.toggle('is-hidden', isPlaying);
    pauseIcon.classList.toggle('is-hidden', !isPlaying);
  }

  function toggle() {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play().catch(() => { /* autoplay restrictions: user gesture already given */ });
      isPlaying = true;
    }
    updateIcons();
  }

  function revealAndPlay() {
    playerWrap.classList.remove('is-hidden');
    audio.volume = parseFloat(volumeSlider.value);
    audio.play().then(() => {
      isPlaying = true;
      updateIcons();
    }).catch(() => {
      // If autoplay is blocked, keep controls visible so user can tap play.
      isPlaying = false;
      updateIcons();
    });
  }

  function init() {
    audio = document.getElementById('bgMusic');
    toggleBtn = document.getElementById('audioToggle');
    playIcon = toggleBtn.querySelector('.icon-play');
    pauseIcon = toggleBtn.querySelector('.icon-pause');
    volumeSlider = document.getElementById('audioVolume');
    playerWrap = document.getElementById('audioPlayer');

    toggleBtn.addEventListener('click', toggle);
    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
    });
  }

  return { init, revealAndPlay };
})();

/* ---------------------------------------------------------------------
   CLOSING — replay
   --------------------------------------------------------------------- */
const Closing = () => {
  document.getElementById('btnReplay').addEventListener('click', () => {
    window.location.reload();
  });
};

/* ---------------------------------------------------------------------
   BOOTSTRAP
   --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Particles.init();
  StarsLayer.init();

  Opening.init();
  Verification.init();
  BirthdayScene.init();
  Envelope.init();
  Gallery.init();
  Lightbox.init();
  Cake.init();
  AudioPlayer.init();
  Closing();

  SceneManager.goTo(SceneManager.first());
});