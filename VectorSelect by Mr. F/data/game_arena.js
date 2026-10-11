// ==============================================================================
// VectorSelect — AAA Gamified Physics Mini-Games & Live Preview Engine
// 60fps Hi-DPI Canvas Rendering, Spring Physics, Procedural Avatars & Web Audio
// Games Supported:
//   1. Tug of War (Beach Duel: Catenary Rope Physics, Bouncy Click Barrels)
//   2. Mastery Peak (Alpine Summit Ascent: Particle Snow, Altitude Waypoints)
// ==============================================================================

(function(window) {
  'use strict';

  // ----------------------------------------------------------------------------
  // Web Audio Procedural Sound Synthesizer (Zero asset loading, 100% offline)
  // ----------------------------------------------------------------------------
  let audioCtx = null;
  let soundEnabled = true;

  function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  const SoundFX = {
    toggle(enabled) {
      soundEnabled = enabled !== undefined ? enabled : !soundEnabled;
      return soundEnabled;
    },
    isEnabled() {
      return soundEnabled;
    },
    click() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.045);
      } catch (e) {}
    },
    tug() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } catch (e) {}
    },
    correct() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + idx * 0.065;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.15, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.2);
        });
      } catch (e) {}
    },
    wrong() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
      } catch (e) {}
    },
    powerup() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      } catch (e) {}
    },
    victory() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const fanfare = [
          { f: 523.25, t: 0.0, d: 0.14 },
          { f: 659.25, t: 0.14, d: 0.14 },
          { f: 783.99, t: 0.28, d: 0.14 },
          { f: 1046.50, t: 0.44, d: 0.4 }
        ];
        fanfare.forEach(item => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + item.t;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(item.f, start);
          gain.gain.setValueAtTime(0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + item.d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + item.d + 0.02);
        });
      } catch (e) {}
    },
    laser() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.085);
      } catch (e) {}
    },
    hit() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.085);
      } catch (e) {}
    },
    explosion() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.32);
        gain.gain.setValueAtTime(0.32, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.33);
      } catch (e) {}
    },
    powerupCollect() {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = ctx.currentTime + idx * 0.045;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.18, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.13);
        });
      } catch (e) {}
    }
  };

  // ----------------------------------------------------------------------------
  // Hi-DPI Canvas Setup Helper
  // ----------------------------------------------------------------------------
  function setupHiDpi(canvas) {
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(280, Math.floor(rect.width || canvas.clientWidth || 600));
    const h = Math.max(160, Math.floor(rect.height || canvas.clientHeight || 280));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h, dpr };
  }

  // ----------------------------------------------------------------------------
  // Procedural Avatar Drawing (Cute Helmets, backpacks, expressive eyes)
  // ----------------------------------------------------------------------------
  function drawChibiAvatar(ctx, x, y, scale = 1, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const helmetColor = opts.helmetColor || '#38bdf8'; // Blue by default
    const bodyColor = opts.bodyColor || '#f97316'; // Orange hoodie
    const pantsColor = opts.pantsColor || '#1e3a8a';
    const angle = opts.tilt || 0;
    const pulling = opts.pulling || false;
    const expression = opts.expression || 'normal'; // 'normal', 'strain', 'happy'

    ctx.rotate(angle);

    // Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 42, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backpack
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(-22, 8, 11, 20, 4);
    ctx.fill();

    // Legs / Pants
    ctx.fillStyle = pantsColor;
    ctx.beginPath();
    ctx.roundRect(-10, 26, 8, 14, 3);
    ctx.roundRect(2, 26, 8, 14, 3);
    ctx.fill();

    // Shoes
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-12, 37, 10, 6, 2);
    ctx.roundRect(2, 37, 10, 6, 2);
    ctx.fill();

    // Body (Hoodie / Coat)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-15, 4, 30, 26, 8);
    ctx.fill();

    // Cute scarf / collar
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.roundRect(-12, 2, 24, 7, 3);
    ctx.fill();

    // Arms
    ctx.fillStyle = bodyColor;
    if (pulling) {
      // Arms reaching forward gripping rope
      ctx.beginPath();
      ctx.roundRect(opts.dir === -1 ? -24 : 6, 12, 18, 7, 3);
      ctx.fill();
      // Hands (white mittens)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(opts.dir === -1 ? -24 : 24, 15, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(-17, 10, 7, 14, 3);
      ctx.roundRect(10, 10, 7, 14, 3);
      ctx.fill();
      // Hands
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(-13.5, 24, 3.5, 0, Math.PI * 2);
      ctx.arc(13.5, 24, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head / Face (Round white helmet base)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -12, 19, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Dome
    ctx.fillStyle = helmetColor;
    ctx.beginPath();
    ctx.arc(0, -14, 19, Math.PI, Math.PI * 2);
    ctx.fill();

    // Helmet stripe / visor accent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-6, -20, 5, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Rim
    ctx.strokeStyle = helmetColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -12, 19, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#0f172a';
    if (expression === 'strain') {
      // Determined squint
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-10, -12); ctx.lineTo(-4, -10);
      ctx.moveTo(4, -10); ctx.lineTo(10, -12);
      ctx.stroke();
    } else if (expression === 'happy') {
      // Upward arches ^ ^
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-7, -10, 4, Math.PI, 0);
      ctx.arc(7, -10, 4, Math.PI, 0);
      ctx.stroke();
    } else {
      // Cute black dots with white highlight
      ctx.beginPath();
      ctx.arc(-7, -11, 3.2, 0, Math.PI * 2);
      ctx.arc(7, -11, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -12, 1.2, 0, Math.PI * 2);
      ctx.arc(8, -12, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute blush cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-11, -6, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(11, -6, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (expression === 'happy') {
      ctx.arc(0, -5, 4, 0, Math.PI);
    } else if (expression === 'strain') {
      ctx.ellipse(0, -5, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    } else {
      ctx.arc(0, -7, 2.8, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    ctx.restore();
  }

  // ----------------------------------------------------------------------------
  // Particle System (Sand dust, water splashes, sparkles, confetti)
  // ----------------------------------------------------------------------------
  class ParticleEmitter {
    constructor() {
      this.particles = [];
    }
    emit(x, y, count, type = 'dust') {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 3 + 1);
        let color = '#fef08a';
        let size = Math.random() * 4 + 2;
        let life = 1.0;
        let decay = Math.random() * 0.03 + 0.02;

        if (type === 'dust') {
          color = 'rgba(254, 240, 138, 0.7)';
        } else if (type === 'splash') {
          color = 'rgba(56, 189, 248, 0.85)';
        } else if (type === 'sparkle') {
          color = ['#f43f5e', '#ec4899', '#38bdf8', '#fbbf24', '#a855f7'][Math.floor(Math.random() * 5)];
          size = Math.random() * 5 + 3;
        }

        this.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (type === 'dust' ? 1.5 : 2),
          size,
          color,
          life,
          decay,
          type
        });
      }
    }
    updateAndDraw(ctx) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.type === 'sparkle') {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ----------------------------------------------------------------------------
  // Game 1: TUG OF WAR (Beach Arena with Catenary Rope & Click Barrels)
  // ----------------------------------------------------------------------------
  class TugOfWarArena {
    constructor(canvas, isPreview = false) {
      this.canvas = canvas;
      this.isPreview = isPreview;
      this.animId = null;
      this.time = 0;
      this.ropePosition = 0; // -100 (left wins) to +100 (right wins)
      this.targetRopePosition = 0;
      this.pullPowerLeft = 0;
      this.pullPowerRight = 0;
      this.barrelLeftBounce = 1;
      this.barrelRightBounce = 1;
      this.leftStreak = 0;
      this.rightStreak = 0;
      this.particles = new ParticleEmitter();

      this.onClick = this.onClick.bind(this);
      if (!this.isPreview) {
        this.canvas.addEventListener('click', this.onClick);
        this.canvas.addEventListener('touchstart', this.onClick, { passive: true });
      }
    }

    onClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      // Left Click Barrel bounds
      const leftBarrelX = w * 0.22;
      const leftBarrelY = h * 0.26;
      const distL = Math.hypot(x - leftBarrelX, y - leftBarrelY);

      // Right Click Barrel bounds
      const rightBarrelX = w * 0.78;
      const rightBarrelY = h * 0.26;
      const distR = Math.hypot(x - rightBarrelX, y - rightBarrelY);

      if (distL < 45 || x < w * 0.5) {
        this.pullLeft(1.5);
      } else {
        this.pullRight(1.5);
      }
    }

    pullLeft(amount = 2.0) {
      this.targetRopePosition = Math.max(-100, this.targetRopePosition - amount);
      this.barrelLeftBounce = 1.35;
      const rect = this.canvas.getBoundingClientRect();
      this.particles.emit(rect.width * 0.32, rect.height * 0.76, 8, 'dust');
      SoundFX.tug();
    }

    pullRight(amount = 2.0) {
      this.targetRopePosition = Math.min(100, this.targetRopePosition + amount);
      this.barrelRightBounce = 1.35;
      const rect = this.canvas.getBoundingClientRect();
      this.particles.emit(rect.width * 0.68, rect.height * 0.76, 8, 'dust');
      SoundFX.tug();
    }

    start() {
      if (this.animId) cancelAnimationFrame(this.animId);
      const loop = () => {
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      this.canvas.removeEventListener('click', this.onClick);
      this.canvas.removeEventListener('touchstart', this.onClick);
    }

    render() {
      const { ctx, w, h } = setupHiDpi(this.canvas);
      this.time += 0.025;

      // Smooth rope spring physics
      this.ropePosition += (this.targetRopePosition - this.ropePosition) * 0.12;

      // In preview mode: gentle auto-pulling simulation
      if (this.isPreview) {
        this.targetRopePosition = Math.sin(this.time * 1.5) * 22;
        if (Math.sin(this.time * 3) > 0.95) {
          this.barrelLeftBounce = 1.25;
        }
        if (Math.cos(this.time * 3) > 0.95) {
          this.barrelRightBounce = 1.25;
        }
      }

      this.barrelLeftBounce += (1 - this.barrelLeftBounce) * 0.14;
      this.barrelRightBounce += (1 - this.barrelRightBounce) * 0.14;

      // 1. Sky & Tropical Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      skyGrad.addColorStop(0, '#38bdf8'); // Sky Cyan
      skyGrad.addColorStop(0.6, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a'); // Warm beach sunset glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Fluffy Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const cloud1X = ((this.time * 12) % (w + 140)) - 70;
      this.drawCloud(ctx, cloud1X, h * 0.14, 0.7);
      const cloud2X = (((this.time * 8) + w * 0.5) % (w + 140)) - 70;
      this.drawCloud(ctx, cloud2X, h * 0.22, 0.5);

      // Distant Pirate Ship / Island Silhouette
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.5, w * 0.2, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Turquoise Ocean with Sine Waves
      const seaY = h * 0.52;
      const seaGrad = ctx.createLinearGradient(0, seaY, 0, h * 0.75);
      seaGrad.addColorStop(0, '#0ea5e9');
      seaGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = seaGrad;
      ctx.beginPath();
      ctx.moveTo(0, seaY);
      for (let x = 0; x <= w; x += 15) {
        const wave = Math.sin((x * 0.03) + this.time * 3) * 3;
        ctx.lineTo(x, seaY + wave);
      }
      ctx.lineTo(w, h * 0.72);
      ctx.lineTo(0, h * 0.72);
      ctx.closePath();
      ctx.fill();

      // White Wave Foam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 15) {
        const wave = Math.sin((x * 0.03) + this.time * 3) * 3;
        if (x === 0) ctx.moveTo(x, seaY + wave);
        else ctx.lineTo(x, seaY + wave);
      }
      ctx.stroke();

      // 3. Golden Sand Beach Dunes
      const sandGrad = ctx.createLinearGradient(0, h * 0.66, 0, h);
      sandGrad.addColorStop(0, '#fef08a');
      sandGrad.addColorStop(0.3, '#fde047');
      sandGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = sandGrad;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.66);
      ctx.bezierCurveTo(w * 0.3, h * 0.62, w * 0.7, h * 0.70, w, h * 0.66);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Center Line on Sand (Chalk & Center Flag Target)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.67);
      ctx.lineTo(w * 0.5, h * 0.95);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Wooden Click Barrels
      this.drawWoodenBarrel(ctx, w * 0.22, h * 0.28, this.barrelLeftBounce, 'Click!');
      this.drawWoodenBarrel(ctx, w * 0.78, h * 0.28, this.barrelRightBounce, 'Click!');

      // 5. Rope & Cute Physicist Avatars
      const ropeShiftX = (this.ropePosition / 100) * (w * 0.16);
      const groundY = h * 0.78;

      // Left Team (Player)
      const leftAvatarX = (w * 0.32) + ropeShiftX;
      const leftStraining = this.ropePosition > -10;
      drawChibiAvatar(ctx, leftAvatarX, groundY, Math.min(1.0, w / 550), {
        helmetColor: '#8b5cf6', // Purple Helmet
        bodyColor: '#f97316',
        pantsColor: '#1e3a8a',
        tilt: -0.18 + (Math.sin(this.time * 6) * 0.04),
        pulling: true,
        dir: 1,
        expression: leftStraining ? 'strain' : 'happy'
      });

      // Right Team (Opponent / Bot)
      const rightAvatarX = (w * 0.68) + ropeShiftX;
      const rightStraining = this.ropePosition < 10;
      drawChibiAvatar(ctx, rightAvatarX, groundY, Math.min(1.0, w / 550), {
        helmetColor: '#06b6d4', // Cyan Helmet
        bodyColor: '#10b981',
        pantsColor: '#0f172a',
        tilt: 0.18 - (Math.sin(this.time * 6) * 0.04),
        pulling: true,
        dir: -1,
        expression: rightStraining ? 'strain' : 'happy'
      });

      // Dynamic Catenary Rope with Red Ribbon in Center
      const ropeStartX = leftAvatarX + 18;
      const ropeEndX = rightAvatarX - 18;
      const ropeMidX = (ropeStartX + ropeEndX) / 2;
      const ropeSag = 12 + Math.sin(this.time * 8) * 3;
      const ropeMidY = groundY - 14 + ropeSag;

      ctx.save();
      // Outer rope shadow
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(ropeStartX, groundY - 14);
      ctx.quadraticCurveTo(ropeMidX, ropeMidY, ropeEndX, groundY - 14);
      ctx.stroke();

      // Rope texture / highlights
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center Red Ribbon Marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ropeMidX, ropeMidY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Hanging ribbon tails
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(ropeMidX, ropeMidY);
      ctx.lineTo(ropeMidX - 4 + Math.sin(this.time * 5) * 3, ropeMidY + 12);
      ctx.moveTo(ropeMidX, ropeMidY);
      ctx.lineTo(ropeMidX + 4 + Math.cos(this.time * 5) * 3, ropeMidY + 12);
      ctx.stroke();
      ctx.restore();

      // 6. Particles
      this.particles.updateAndDraw(ctx);

      // 7. Victory / Pull Indicator Pill
      this.drawTugPill(ctx, w, h);
    }

    drawCloud(ctx, x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.arc(16, -6, 22, 0, Math.PI * 2);
      ctx.arc(36, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawWoodenBarrel(ctx, x, y, bounce = 1, text = 'Click!') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(bounce, bounce);

      // Wooden barrel background
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();

      // Wood plank rings
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();

      // Text Badge
      ctx.font = '900 13px "Inter", "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(text, 0, 0);

      ctx.restore();
    }

    drawTugPill(ctx, w, h) {
      const pillW = Math.min(220, w * 0.45);
      const pillH = 22;
      const pillX = (w - pillW) / 2;
      const pillY = 12;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 11);
      ctx.fill();

      // Tug balance bar
      const fillPercent = ((this.ropePosition + 100) / 200);
      const fillW = (pillW - 8) * fillPercent;

      const barGrad = ctx.createLinearGradient(pillX + 4, 0, pillX + pillW - 4, 0);
      barGrad.addColorStop(0, '#8b5cf6'); // Purple (Team 1)
      barGrad.addColorStop(1, '#06b6d4'); // Cyan (Team 2)

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(pillX + 4, pillY + 4, fillW, pillH - 8, 7);
      ctx.fill();

      // Center marker
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(w * 0.5 - 1, pillY + 2, 2, pillH - 4);
      ctx.restore();
    }
  }

  // ----------------------------------------------------------------------------
  // Game 2: MASTERY PEAK (Mountain Ascent & Altitude Progression)
  // ----------------------------------------------------------------------------
  class MasteryPeakArena {
    constructor(canvas, isPreview = false) {
      this.canvas = canvas;
      this.isPreview = isPreview;
      this.animId = null;
      this.time = 0;
      this.progress = 0.35; // 0.0 to 1.0 (Summit)
      this.targetProgress = 0.35;
      this.snowParticles = [];
      for (let i = 0; i < 40; i++) {
        this.snowParticles.push({
          x: Math.random() * 600,
          y: Math.random() * 400,
          speed: Math.random() * 1.5 + 0.8,
          size: Math.random() * 2.5 + 1.2
        });
      }
    }

    start() {
      if (this.animId) cancelAnimationFrame(this.animId);
      const loop = () => {
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    setProgress(val) {
      this.targetProgress = Math.max(0, Math.min(1.0, val));
    }

    render() {
      const { ctx, w, h } = setupHiDpi(this.canvas);
      this.time += 0.02;

      this.progress += (this.targetProgress - this.progress) * 0.08;
      if (this.isPreview) {
        this.targetProgress = 0.4 + Math.sin(this.time * 0.8) * 0.25;
      }

      // 1. Alpine Sky Gradient (Teal/Emerald Mountain Vibe)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#0d9488');
      skyGrad.addColorStop(1, '#115e59');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Snow Mountain Silhouette
      const peakX = w * 0.5;
      const peakY = h * 0.18;

      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h);
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(w * 0.95, h);
      ctx.closePath();
      ctx.fill();

      // Snowy Summit Cap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(peakX, peakY);
      ctx.lineTo(peakX + (w * 0.12), peakY + (h * 0.22));
      ctx.lineTo(peakX + (w * 0.04), peakY + (h * 0.18));
      ctx.lineTo(peakX - (w * 0.02), peakY + (h * 0.24));
      ctx.lineTo(peakX - (w * 0.12), peakY + (h * 0.22));
      ctx.closePath();
      ctx.fill();

      // Red Summit Flag
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(peakX, peakY);
      ctx.lineTo(peakX, peakY - 24);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(peakX, peakY - 24);
      ctx.lineTo(peakX + 18 + Math.sin(this.time * 6) * 3, peakY - 17);
      ctx.lineTo(peakX, peakY - 10);
      ctx.closePath();
      ctx.fill();

      // 3. Winding Climbing Path
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);

      const pt0 = { x: w * 0.18, y: h * 0.88 };
      const pt1 = { x: w * 0.35, y: h * 0.68 };
      const pt2 = { x: w * 0.62, y: h * 0.48 };
      const pt3 = { x: peakX, y: peakY + 8 };

      ctx.beginPath();
      ctx.moveTo(pt0.x, pt0.y);
      ctx.lineTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.lineTo(pt3.x, pt3.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint flags / beacons
      [pt0, pt1, pt2].forEach((pt, idx) => {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Climber Avatar along path
      let climberX = pt0.x;
      let climberY = pt0.y;

      if (this.progress < 0.33) {
        const t = this.progress / 0.33;
        climberX = pt0.x + (pt1.x - pt0.x) * t;
        climberY = pt0.y + (pt1.y - pt0.y) * t;
      } else if (this.progress < 0.66) {
        const t = (this.progress - 0.33) / 0.33;
        climberX = pt1.x + (pt2.x - pt1.x) * t;
        climberY = pt1.y + (pt2.y - pt1.y) * t;
      } else {
        const t = (this.progress - 0.66) / 0.34;
        climberX = pt2.x + (pt3.x - pt2.x) * t;
        climberY = pt2.y + (pt3.y - pt2.y) * t;
      }

      drawChibiAvatar(ctx, climberX, climberY - 14, Math.min(0.85, w / 600), {
        helmetColor: '#0ea5e9',
        bodyColor: '#e11d48',
        tilt: Math.sin(this.time * 6) * 0.08,
        pulling: false,
        expression: 'happy'
      });

      // 5. Alpine Snow Particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      this.snowParticles.forEach(p => {
        p.y += p.speed;
        p.x += Math.sin(this.time + p.y * 0.05) * 0.5;
        if (p.y > h) {
          p.y = 0;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Altimeter HUD Banner
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(14, 12, 140, 24, 12);
      ctx.fill();

      ctx.fillStyle = '#5eead4';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`⛰️ ALT: ${Math.round(this.progress * 4200)}m`, 24, 28);
      ctx.restore();
    }
  }

  // ----------------------------------------------------------------------------
  // Game 3: WAYARENA — VECTOR MAZE BATTLE (Top-down PvP / Bot Battle & Powerups)
  // ----------------------------------------------------------------------------
  const MAZE_MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
    [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

  class MazeBattleArena {
    constructor(canvas, isPreview = false) {
      this.canvas = canvas;
      this.isPreview = isPreview;
      this.animId = null;
      this.time = 0;
      this.particles = new ParticleEmitter();
      this.lasers = [];
      this.killFeed = [];
      this.cols = MAZE_MAP[0].length;
      this.rows = MAZE_MAP.length;

      // Player Setup
      this.player = {
        x: 0, y: 0,
        vx: 0, vy: 0,
        angle: 0,
        radius: 12,
        speed: 2.5,
        health: 3,
        maxHealth: 3,
        shield: 1,
        kills: 0,
        ammo: 6,
        maxAmmo: 6,
        rechargeTimer: 0,
        powerup: null,
        powerupTimer: 0,
        respawnTimer: 0,
        helmetColor: '#8b5cf6',
        name: 'You'
      };

      // 3 AI Opponents
      this.bots = [
        { id: 1, name: 'NewtonBot', x: 0, y: 0, vx: 0, vy: 0, angle: Math.PI, radius: 12, speed: 1.8, health: 3, shield: 0, helmetColor: '#06b6d4', shootCooldown: 60, respawnTimer: 0 },
        { id: 2, name: 'GalileoBot', x: 0, y: 0, vx: 0, vy: 0, angle: Math.PI / 2, radius: 12, speed: 1.7, health: 3, shield: 0, helmetColor: '#f43f5e', shootCooldown: 80, respawnTimer: 0 },
        { id: 3, name: 'KeplerBot', x: 0, y: 0, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 12, speed: 1.9, health: 3, shield: 0, helmetColor: '#10b981', shootCooldown: 70, respawnTimer: 0 }
      ];

      // 4 Powerup Spawn Locations in the maze
      this.powerups = [
        { gridX: 7, gridY: 5, type: 'triple', name: 'Triple Laser 💥', color: '#ec4899', active: true, respawnTimer: 0 },
        { gridX: 3, gridY: 4, type: 'speed', name: 'Quantum Dash ⚡', color: '#eab308', active: true, respawnTimer: 0 },
        { gridX: 11, gridY: 4, type: 'shield', name: 'Kinetic Shield 🛡️', color: '#00f2fe', active: true, respawnTimer: 0 },
        { gridX: 7, gridY: 1, type: 'emp', name: 'Graviton EMP 💣', color: '#a855f7', active: true, respawnTimer: 0 }
      ];

      // Key states
      this.keys = {};
      this.touchMove = { active: false, x: 0, y: 0 };

      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);

      if (!this.isPreview) {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
      }
    }

    onKeyDown(e) {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.firePlayerLaser();
      }
    }

    onKeyUp(e) {
      this.keys[e.key.toLowerCase()] = false;
    }

    onPointerDown(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Virtual Shoot Button (Bottom Right)
      const fireBtnX = rect.width - 55;
      const fireBtnY = rect.height - 55;
      if (Math.hypot(x - fireBtnX, y - fireBtnY) < 40) {
        this.firePlayerLaser();
        return;
      }

      // Virtual D-Pad / Move click
      this.touchMove.active = true;
      this.touchMove.x = x;
      this.touchMove.y = y;

      // If clicked elsewhere, aim & fire towards that location
      const dx = x - (this.player.x);
      const dy = y - (this.player.y);
      this.player.angle = Math.atan2(dy, dx);
      this.firePlayerLaser();
    }

    onPointerMove(e) {
      if (!this.touchMove.active) return;
      const rect = this.canvas.getBoundingClientRect();
      this.touchMove.x = e.clientX - rect.left;
      this.touchMove.y = e.clientY - rect.top;
      const dx = this.touchMove.x - this.player.x;
      const dy = this.touchMove.y - this.player.y;
      this.player.angle = Math.atan2(dy, dx);
    }

    onPointerUp() {
      this.touchMove.active = false;
    }

    start() {
      if (this.animId) cancelAnimationFrame(this.animId);
      // Initialize starting positions
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width || 600);
      const h = Math.max(160, rect.height || 360);
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      this.player.x = cellW * 2.5;
      this.player.y = cellH * 2.5;

      this.bots[0].x = cellW * 12.5; this.bots[0].y = cellH * 8.5;
      this.bots[1].x = cellW * 12.5; this.bots[1].y = cellH * 2.5;
      this.bots[2].x = cellW * 2.5;  this.bots[2].y = cellH * 8.5;

      const loop = () => {
        this.update();
        this.render();
        this.animId = requestAnimationFrame(loop);
      };
      this.animId = requestAnimationFrame(loop);
    }

    stop() {
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      this.canvas.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
    }

    isWall(x, y, radius = 8) {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width || 600);
      const h = Math.max(160, rect.height || 360);
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      const checkPts = [
        { x: x - radius, y: y - radius },
        { x: x + radius, y: y - radius },
        { x: x - radius, y: y + radius },
        { x: x + radius, y: y + radius }
      ];

      for (const pt of checkPts) {
        const c = Math.floor(pt.x / cellW);
        const r = Math.floor(pt.y / cellH);
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return true;
        if (MAZE_MAP[r][c] === 1) return true;
      }
      return false;
    }

    firePlayerLaser() {
      if (this.player.respawnTimer > 0) return;
      if (this.player.ammo <= 0) {
        SoundFX.wrong();
        return;
      }
      this.player.ammo--;
      SoundFX.laser();

      const speed = 7.5;
      if (this.player.powerup === 'triple') {
        [-0.22, 0, 0.22].forEach(offset => {
          const a = this.player.angle + offset;
          this.lasers.push({
            x: this.player.x + Math.cos(a) * 14,
            y: this.player.y + Math.sin(a) * 14,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            owner: 'player',
            color: '#ec4899',
            life: 65,
            bounces: 1
          });
        });
      } else {
        this.lasers.push({
          x: this.player.x + Math.cos(this.player.angle) * 14,
          y: this.player.y + Math.sin(this.player.angle) * 14,
          vx: Math.cos(this.player.angle) * speed,
          vy: Math.sin(this.player.angle) * speed,
          owner: 'player',
          color: '#38bdf8',
          life: 65,
          bounces: 1
        });
      }
    }

    fireBotLaser(bot) {
      if (bot.respawnTimer > 0) return;
      const speed = 6.0;
      this.lasers.push({
        x: bot.x + Math.cos(bot.angle) * 14,
        y: bot.y + Math.sin(bot.angle) * 14,
        vx: Math.cos(bot.angle) * speed,
        vy: Math.sin(bot.angle) * speed,
        owner: bot.id,
        color: bot.helmetColor,
        life: 55,
        bounces: 1
      });
      if (!this.isPreview) SoundFX.laser();
    }

    addKillFeed(text) {
      this.killFeed.unshift({ text, timer: 180 });
      if (this.killFeed.length > 3) this.killFeed.pop();
    }

    update() {
      this.time += 0.03;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width || 600);
      const h = Math.max(160, rect.height || 360);
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      // 1. Player Movement & Controls
      if (this.player.respawnTimer > 0) {
        this.player.respawnTimer--;
      } else {
        let moveX = 0;
        let moveY = 0;

        if (this.isPreview) {
          // In Preview Mode: gentle autonomous roaming
          moveX = Math.cos(this.time * 2);
          moveY = Math.sin(this.time * 1.5);
          this.player.angle = Math.atan2(moveY, moveX);
          if (Math.sin(this.time * 4) > 0.96) this.firePlayerLaser();
        } else {
          if (this.keys['arrowleft'] || this.keys['a']) moveX -= 1;
          if (this.keys['arrowright'] || this.keys['d']) moveX += 1;
          if (this.keys['arrowup'] || this.keys['w']) moveY -= 1;
          if (this.keys['arrowdown'] || this.keys['s']) moveY += 1;

          if (this.touchMove.active) {
            const dx = this.touchMove.x - this.player.x;
            const dy = this.touchMove.y - this.player.y;
            if (Math.hypot(dx, dy) > 10) {
              moveX = dx;
              moveY = dy;
            }
          }

          if (moveX !== 0 || moveY !== 0) {
            this.player.angle = Math.atan2(moveY, moveX);
          }
        }

        const len = Math.hypot(moveX, moveY);
        if (len > 0) {
          const spd = this.player.speed * (this.player.powerup === 'speed' ? 1.7 : 1.0);
          const nextX = this.player.x + (moveX / len) * spd;
          const nextY = this.player.y + (moveY / len) * spd;

          if (!this.isWall(nextX, this.player.y, this.player.radius)) this.player.x = nextX;
          if (!this.isWall(this.player.x, nextY, this.player.radius)) this.player.y = nextY;
        }

        // Ammo Recharge
        this.player.rechargeTimer++;
        if (this.player.rechargeTimer > 35 && this.player.ammo < this.player.maxAmmo) {
          this.player.ammo++;
          this.player.rechargeTimer = 0;
        }

        // Powerup duration decay
        if (this.player.powerupTimer > 0) {
          this.player.powerupTimer--;
          if (this.player.powerupTimer <= 0) this.player.powerup = null;
        }
      }

      // 2. Bots Movement & AI Patrol
      this.bots.forEach(bot => {
        if (bot.respawnTimer > 0) {
          bot.respawnTimer--;
          return;
        }

        // Steer towards target or wander
        const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
        let targetX = this.player.x;
        let targetY = this.player.y;

        if (distToPlayer > 180 || this.isPreview) {
          targetX = bot.x + Math.cos(this.time * 2 + bot.id) * 40;
          targetY = bot.y + Math.sin(this.time * 1.8 + bot.id) * 40;
        }

        const bdx = targetX - bot.x;
        const bdy = targetY - bot.y;
        bot.angle = Math.atan2(bdy, bdx);

        const blen = Math.hypot(bdx, bdy);
        if (blen > 0) {
          const nextBX = bot.x + (bdx / blen) * bot.speed;
          const nextBY = bot.y + (bdy / blen) * bot.speed;
          if (!this.isWall(nextBX, bot.y, bot.radius)) bot.x = nextBX;
          if (!this.isWall(bot.x, nextBY, bot.radius)) bot.y = nextBY;
        }

        // Shoot at player or others
        bot.shootCooldown--;
        if (bot.shootCooldown <= 0 && distToPlayer < 240) {
          this.fireBotLaser(bot);
          bot.shootCooldown = Math.floor(Math.random() * 50 + 60);
        }
      });

      // 3. Powerups Pickup & Respawns
      this.powerups.forEach(pw => {
        if (!pw.active) {
          pw.respawnTimer--;
          if (pw.respawnTimer <= 0) pw.active = true;
          return;
        }

        const pwX = pw.gridX * cellW + cellW * 0.5;
        const pwY = pw.gridY * cellH + cellH * 0.5;

        // Player collision
        if (this.player.respawnTimer <= 0 && Math.hypot(this.player.x - pwX, this.player.y - pwY) < 22) {
          pw.active = false;
          pw.respawnTimer = 400;
          this.applyPowerup(this.player, pw.type);
          SoundFX.powerupCollect();
          this.particles.emit(pwX, pwY, 12, 'sparkle');
        }

        // Bot collision
        this.bots.forEach(bot => {
          if (pw.active && bot.respawnTimer <= 0 && Math.hypot(bot.x - pwX, bot.y - pwY) < 22) {
            pw.active = false;
            pw.respawnTimer = 400;
            if (pw.type === 'shield') bot.shield = 1;
            this.particles.emit(pwX, pwY, 8, 'sparkle');
          }
        });
      });

      // 4. Laser Simulation & Collisions
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.x += l.vx;
        l.y += l.vy;
        l.life--;

        if (l.life <= 0) {
          this.lasers.splice(i, 1);
          continue;
        }

        // Wall collision with bounce
        if (this.isWall(l.x, l.y, 4)) {
          if (l.bounces > 0) {
            l.bounces--;
            l.vx = -l.vx * 0.9;
            l.vy = -l.vy * 0.9;
            this.particles.emit(l.x, l.y, 4, 'dust');
          } else {
            this.particles.emit(l.x, l.y, 6, 'dust');
            this.lasers.splice(i, 1);
            continue;
          }
        }

        // Hit Player?
        if (l.owner !== 'player' && this.player.respawnTimer <= 0) {
          if (Math.hypot(this.player.x - l.x, this.player.y - l.y) < this.player.radius + 3) {
            this.lasers.splice(i, 1);
            this.hitEntity(this.player, 'player');
            continue;
          }
        }

        // Hit Bots?
        for (const bot of this.bots) {
          if (l.owner !== bot.id && bot.respawnTimer <= 0) {
            if (Math.hypot(bot.x - l.x, bot.y - l.y) < bot.radius + 3) {
              this.lasers.splice(i, 1);
              this.hitEntity(bot, 'bot', l.owner);
              break;
            }
          }
        }
      }

      // 5. Kill feed decay
      for (let i = this.killFeed.length - 1; i >= 0; i--) {
        this.killFeed[i].timer--;
        if (this.killFeed[i].timer <= 0) this.killFeed.splice(i, 1);
      }
    }

    applyPowerup(entity, type) {
      if (type === 'speed') {
        entity.powerup = 'speed';
        entity.powerupTimer = 320;
      } else if (type === 'shield') {
        entity.shield = Math.min(2, entity.shield + 1);
      } else if (type === 'triple') {
        entity.powerup = 'triple';
        entity.powerupTimer = 320;
      } else if (type === 'emp') {
        // Graviton Shockwave: damages all enemies in radius
        SoundFX.explosion();
        this.particles.emit(entity.x, entity.y, 25, 'sparkle');
        this.bots.forEach(bot => {
          if (Math.hypot(bot.x - entity.x, bot.y - entity.y) < 130) {
            this.hitEntity(bot, 'bot', 'player');
          }
        });
      }
    }

    hitEntity(entity, type, attackerId = null) {
      if (entity.shield > 0) {
        entity.shield--;
        SoundFX.hit();
        this.particles.emit(entity.x, entity.y, 10, 'sparkle');
        return;
      }

      entity.health--;
      SoundFX.hit();
      this.particles.emit(entity.x, entity.y, 12, 'sparkle');

      if (entity.health <= 0) {
        // KNOCKOUT / KILL!
        SoundFX.explosion();
        this.particles.emit(entity.x, entity.y, 30, 'sparkle');
        entity.respawnTimer = 180; // 3 seconds
        entity.health = entity.maxHealth || 3;

        const rect = this.canvas.getBoundingClientRect();
        const cellW = (rect.width || 600) / this.cols;
        const cellH = (rect.height || 360) / this.rows;

        if (type === 'player') {
          entity.x = cellW * 2.5;
          entity.y = cellH * 2.5;
          entity.shield = 1;
          this.addKillFeed(`💀 You were tagged! Respawning...`);
        } else {
          // Bot died
          entity.x = cellW * 12.5;
          entity.y = cellH * 8.5;
          if (attackerId === 'player') {
            this.player.kills++;
            this.addKillFeed(`💥 You blasted ${entity.name}! (+150 PTS)`);
            SoundFX.victory();
          } else {
            this.addKillFeed(`⚡ ${entity.name} was tagged!`);
          }
        }
      }
    }

    render() {
      const { ctx, w, h } = setupHiDpi(this.canvas);
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      // 1. Cyber Sci-Fi Maze Background
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, w, h);

      // Floor Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= this.cols; c++) {
        ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, h); ctx.stroke();
      }
      for (let r = 0; r <= this.rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(w, r * cellH); ctx.stroke();
      }

      // 2. Render Maze Walls with Neon Glow
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (MAZE_MAP[r][c] === 1) {
            const wx = c * cellW;
            const wy = r * cellH;

            // Dark Block Fill
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(wx + 1, wy + 1, cellW - 2, cellH - 2, 4);
            ctx.fill();

            // Neon Border
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Neon Inner Accent
            ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
            ctx.fillRect(wx + 3, wy + 3, cellW - 6, cellH - 6);
          }
        }
      }

      // 3. Render Floating Powerups
      this.powerups.forEach(pw => {
        if (!pw.active) return;
        const pwX = pw.gridX * cellW + cellW * 0.5;
        const pwY = pw.gridY * cellH + cellH * 0.5 + Math.sin(this.time * 5) * 3;

        ctx.save();
        // Glow Halo
        ctx.shadowColor = pw.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = pw.color;
        ctx.beginPath();
        ctx.arc(pwX, pwY, 10, 0, Math.PI * 2);
        ctx.fill();

        // White Center Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pwX, pwY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Orbit Ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(pwX, pwY, 14, 6, this.time * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // 4. Render Lasers
      this.lasers.forEach(l => {
        ctx.save();
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x - l.vx * 1.5, l.y - l.vy * 1.5);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Render Bots
      this.bots.forEach(bot => {
        if (bot.respawnTimer > 0) return;
        this.drawBattleAvatar(ctx, bot.x, bot.y, bot.angle, bot.helmetColor, bot.name, bot.health, bot.shield);
      });

      // 6. Render Player
      if (this.player.respawnTimer <= 0) {
        this.drawBattleAvatar(ctx, this.player.x, this.player.y, this.player.angle, this.player.helmetColor, this.player.name, this.player.health, this.player.shield, true);
      }

      // 7. Render Particles
      this.particles.updateAndDraw(ctx);

      // 8. Render HUD (Hearts, Ammo, Kills, Kill Feed)
      this.drawBattleHUD(ctx, w, h);

      // 9. Virtual Touch Controls (Non-preview mode)
      if (!this.isPreview) {
        this.drawVirtualControls(ctx, w, h);
      }
    }

    drawBattleAvatar(ctx, x, y, angle, helmetColor, name, health, shield, isPlayer = false) {
      ctx.save();
      ctx.translate(x, y);

      // Health Bar above head
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(-14, -22, 28, 4);
      ctx.fillStyle = health > 1 ? '#10b981' : '#ef4444';
      ctx.fillRect(-14, -22, (health / 3) * 28, 4);

      // Shield Bubble Ring
      if (shield > 0) {
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Body circle (Top-Down Astronaut)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Colored Helmet Arc
      ctx.fillStyle = helmetColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, angle - Math.PI * 0.7, angle + Math.PI * 0.7);
      ctx.fill();

      // Visor Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 4, Math.sin(angle) * 4, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Blaster Nozzle
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
      ctx.lineTo(Math.cos(angle) * 17, Math.sin(angle) * 17);
      ctx.stroke();

      // Username Tag
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = isPlayer ? '#38bdf8' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.fillText(name, 0, -25);

      ctx.restore();
    }

    drawBattleHUD(ctx, w, h) {
      ctx.save();
      // Player Health & Ammo Panel (Top Left)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(10, 10, 160, 32, 10);
      ctx.fill();

      let hearts = '';
      for (let i = 0; i < this.player.health; i++) hearts += '❤️';
      ctx.font = '12px system-ui';
      ctx.fillText(hearts || '💀', 18, 28);

      let ammoPills = '';
      for (let i = 0; i < this.player.ammo; i++) ammoPills += '⚡';
      ctx.font = '10px system-ui';
      ctx.fillText(ammoPills, 85, 28);

      // Kills Badge (Center Top)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(w * 0.5 - 55, 10, 110, 26, 8);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🏆 KILLS: ${this.player.kills}`, w * 0.5, 27);

      // Kill Feed Notifications (Top Right)
      ctx.textAlign = 'right';
      this.killFeed.forEach((item, idx) => {
        ctx.fillStyle = `rgba(15, 23, 42, ${Math.min(1, item.timer / 40)})`;
        ctx.beginPath();
        ctx.roundRect(w - 220, 10 + idx * 24, 210, 20, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(item.text, w - 16, 24 + idx * 24);
      });

      ctx.restore();
    }

    drawVirtualControls(ctx, w, h) {
      ctx.save();
      // Virtual Fire Button (Bottom Right)
      const fireX = w - 45;
      const fireY = h - 45;
      ctx.fillStyle = 'rgba(236, 72, 153, 0.65)';
      ctx.beginPath();
      ctx.arc(fireX, fireY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FIRE ⚡', fireX, fireY);

      // D-Pad Hint on Bottom Left
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.roundRect(14, h - 34, 130, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('⌨️ WASD/Touch Move', 20, h - 23);
      ctx.restore();
    }
  }

  // ----------------------------------------------------------------------------
  // Public Global API
  // ----------------------------------------------------------------------------
  window.GameArena = {
    SoundFX,

    createTugOfWarPreview(canvas) {
      const arena = new TugOfWarArena(canvas, true);
      arena.start();
      return arena;
    },

    createMasteryPeakPreview(canvas) {
      const arena = new MasteryPeakArena(canvas, true);
      arena.start();
      return arena;
    },

    createMazeBattlePreview(canvas) {
      const arena = new MazeBattleArena(canvas, true);
      arena.start();
      return arena;
    },

    createTugOfWarGame(canvas) {
      const arena = new TugOfWarArena(canvas, false);
      arena.start();
      return arena;
    },

    createMasteryPeakGame(canvas) {
      const arena = new MasteryPeakArena(canvas, false);
      arena.start();
      return arena;
    },

    createMazeBattleGame(canvas) {
      const arena = new MazeBattleArena(canvas, false);
      arena.start();
      return arena;
    }
  };

})(typeof window !== 'undefined' ? window : this);
