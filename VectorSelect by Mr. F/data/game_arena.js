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
  // Floating Combat & Reward Text Emitter (Juicy arcade damage and buff feedback)
  // ----------------------------------------------------------------------------
  class FloatingTextEmitter {
    constructor() {
      this.items = [];
    }
    emit(x, y, text, color = '#ffffff', size = 12) {
      this.items.push({
        x,
        y,
        text,
        color,
        size,
        life: 55,
        vy: -1.1
      });
    }
    updateAndDraw(ctx) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        item.y += item.vy;
        item.life--;

        if (item.life <= 0) {
          this.items.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, item.life / 20);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${item.size}px monospace, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);
        ctx.restore();
      }
    }
  }

  // ----------------------------------------------------------------------------
  // Game 1: TUG OF WAR (Beach Arena with Catenary Rope & Click Barrels)
  // ----------------------------------------------------------------------------
  class TugOfWarArena {
    constructor(canvas, isPreview = false, options = {}) {
      this.canvas = canvas;
      this.isPreview = isPreview;
      this.options = options || {};
      this.animId = null;
      this.time = 0;
      
      // Persistent rope position: -100 (player/left wins) to +100 (bot/right wins)
      this.ropePosition = (this.options.initialRopePosition !== undefined) ? this.options.initialRopePosition : 0;
      this.targetRopePosition = this.ropePosition;
      this.currentRound = this.options.currentRound || 1;
      this.totalRounds = this.options.totalRounds || 3;
      this.isFinalRound = Boolean(this.options.isFinalRound);
      this.powerMultiplier = this.options.powerMultiplier || 1.0;
      this.correctCount = this.options.correctCount || 0;

      this.barrelLeftBounce = 1;
      this.barrelRightBounce = 1;
      this.particles = new ParticleEmitter();

      // Opponent AI Special Power states
      this.specialPowerTimer = 0;
      this.specialPowerCooldown = 180 + Math.floor(Math.random() * 120); // triggers every 3-5s
      this.specialPowerName = "";
      this.specialPowerColor = "#ef4444";
      this.statusBannerText = "";
      this.statusBannerTimer = 0;

      this.onClick = this.onClick.bind(this);
      if (!this.isPreview) {
        this.canvas.addEventListener('click', this.onClick);
        this.canvas.addEventListener('touchstart', this.onClick, { passive: true });
      }
    }

    onClick(e) {
      // In student action phase, tapping anywhere on screen pulls left for the student's team!
      this.pullLeft(1.6);
    }

    pullLeft(amount = 1.8) {
      // Scale pull power based on student's earned multiplier & question sprint accuracy
      const mult = Math.max(1.0, this.powerMultiplier);
      const accBonus = 1.0 + (this.correctCount * 0.12);
      const force = amount * mult * accBonus;

      let nextPos = this.targetRopePosition - force;

      // Checkpoint cap: student CANNOT win the entire match in early rounds!
      if (!this.isFinalRound) {
        const roundFraction = Math.min(1.0, this.currentRound / Math.max(1, this.totalRounds));
        const maxProgressThisRound = -1 * Math.min(85, Math.round(roundFraction * 85));

        if (nextPos <= maxProgressThisRound) {
          nextPos = maxProgressThisRound;
          this.statusBannerText = `📍 ROUND ${this.currentRound} CHECKPOINT REACHED! Opponent Digs In!`;
          this.statusBannerTimer = 50;
        }
      } else {
        // Final round allows pulling past -90 to clinch grand victory!
        nextPos = Math.max(-100, nextPos);
      }

      this.targetRopePosition = nextPos;
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

    triggerOpponentSpecialPower() {
      const powers = [
        { name: "⚡ TITAN RAGE SURGE!", pull: 8.0, color: '#f97316' },
        { name: "🌪️ SANDSTORM COUNTER-PULL!", pull: 9.5, color: '#eab308' },
        { name: "⚓ MEGA ANCHOR STAMPEDE!", pull: 11.5, color: '#ef4444' }
      ];
      const p = powers[Math.floor(Math.random() * powers.length)];
      this.specialPowerName = p.name;
      this.specialPowerColor = p.color;
      this.specialPowerTimer = 70; // 1.2s visual surge
      this.barrelRightBounce = 1.45;

      // Pull rope right towards opponent!
      this.targetRopePosition = Math.min(65, this.targetRopePosition + p.pull);

      const rect = this.canvas.getBoundingClientRect();
      this.particles.emit(rect.width * 0.68, rect.height * 0.76, 16, 'dust');
      SoundFX.wrong();
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
        if (Math.sin(this.time * 3) > 0.95) this.barrelLeftBounce = 1.25;
        if (Math.cos(this.time * 3) > 0.95) this.barrelRightBounce = 1.25;
      } else {
        // Active gameplay opponent AI counter-pulls & special powers
        if (this.ropePosition < 0) {
          // Opponent exerts continuous resistance so rope doesn't sit idle
          this.targetRopePosition += 0.04;
        }

        // Special power cooldown countdown
        this.specialPowerCooldown--;
        if (this.specialPowerCooldown <= 0) {
          this.specialPowerCooldown = 180 + Math.floor(Math.random() * 140);
          this.triggerOpponentSpecialPower();
        }

        if (this.specialPowerTimer > 0) this.specialPowerTimer--;
        if (this.statusBannerTimer > 0) this.statusBannerTimer--;
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
      this.drawWoodenBarrel(ctx, w * 0.22, h * 0.28, this.barrelLeftBounce, 'PULL!');
      this.drawWoodenBarrel(ctx, w * 0.78, h * 0.28, this.barrelRightBounce, this.specialPowerTimer > 0 ? 'RAGE!' : 'BOT');

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
      
      // Opponent glowing aura during special power surge
      if (this.specialPowerTimer > 0) {
        ctx.save();
        ctx.strokeStyle = this.specialPowerColor || '#ef4444';
        ctx.lineWidth = 5;
        ctx.shadowColor = this.specialPowerColor || '#ef4444';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(rightAvatarX, groundY - 22, 38, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawChibiAvatar(ctx, rightAvatarX, groundY, Math.min(1.0, w / 550), {
        helmetColor: this.specialPowerTimer > 0 ? '#ef4444' : '#06b6d4',
        bodyColor: this.specialPowerTimer > 0 ? '#dc2626' : '#10b981',
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
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(ropeStartX, groundY - 14);
      ctx.quadraticCurveTo(ropeMidX, ropeMidY, ropeEndX, groundY - 14);
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Center Red Ribbon Marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ropeMidX, ropeMidY, 7, 0, Math.PI * 2);
      ctx.fill();

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

      // 7. Special Power & Status Banners
      if (this.specialPowerTimer > 0) {
        ctx.save();
        ctx.font = '900 14px "Inter", "Segoe UI", sans-serif';
        ctx.fillStyle = this.specialPowerColor || '#ef4444';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 6;
        ctx.fillText(`⚠️ OPPONENT SPECIAL POWER: ${this.specialPowerName} ⚠️`, w * 0.5, h * 0.17);
        ctx.restore();
      } else if (this.statusBannerTimer > 0) {
        ctx.save();
        ctx.font = '900 13px "Inter", "Segoe UI", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 6;
        ctx.fillText(this.statusBannerText, w * 0.5, h * 0.17);
        ctx.restore();
      }

      // 8. Victory / Pull Indicator Pill
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

    drawWoodenBarrel(ctx, x, y, bounce = 1, text = 'PULL!') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(bounce, bounce);

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();

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
      const pillW = Math.min(260, w * 0.55);
      const pillH = 22;
      const pillX = (w - pillW) / 2;
      const pillY = 10;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 11);
      ctx.fill();

      // Tug balance bar
      const fillPercent = Math.max(0, Math.min(1, (this.ropePosition + 100) / 200));
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

      // Target checkpoint marker for intermediate rounds
      if (!this.isFinalRound) {
        const roundFraction = Math.min(1.0, this.currentRound / Math.max(1, this.totalRounds));
        const maxProgressThisRound = Math.min(85, Math.round(roundFraction * 85));
        const checkPct = (100 - maxProgressThisRound) / 200;
        const checkX = pillX + 4 + (pillW - 8) * checkPct;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(checkX - 1.5, pillY + 1, 3, pillH - 2);
      }

      // Round subtitle info
      ctx.font = '800 11px "Inter", "Segoe UI", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      const roundLabel = this.isFinalRound 
        ? '🏆 FINAL ROUND — PULL TO CLINCH VICTORY!' 
        : `Round ${this.currentRound} of ${this.totalRounds} • Checkpoint Goal`;
      ctx.fillText(roundLabel, w * 0.5, pillY + pillH + 13);

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
    // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 0 Top Wall
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1], // 1 Alpha Outpost (NW) & Beta Outpost (NE)
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1], // 2
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 3 Double-wide connector
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 4
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1], // 5
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1], // 6 Tactical Pillars
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 7 Central Core Plaza
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 8 Central Core Arena
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 9 Central Core Plaza
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1], // 10 Tactical Pillars
    [1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1], // 11
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 12 Double-wide connector
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1], // 13
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1], // 14 Gamma Outpost (SW) & Delta Outpost (SE)
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1], // 15
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  // 16 Bottom Wall
  ];

  class MazeBattleArena {
    constructor(canvas, isPreview = false, loadout = null) {
      this.canvas = canvas;
      this.isPreview = isPreview;
      this.loadout = loadout;
      this.animId = null;
      this.time = 0;
      this.shake = 0;
      this.particles = new ParticleEmitter();
      this.floatingTexts = new FloatingTextEmitter();
      this.lasers = [];
      this.killFeed = [];
      this.cols = MAZE_MAP[0].length;
      this.rows = MAZE_MAP.length;

      // Player Setup (Spawns in Sector 0: Alpha Outpost NW)
      this.player = {
        x: 0, y: 0,
        vx: 0, vy: 0,
        angle: 0,
        radius: 10,
        speed: 2.7,
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
        invulnerableTimer: 180, // 3-second golden respawn shield bubble
        phaseRipple: 0,
        helmetColor: '#8b5cf6',
        coatColor: '#4f46e5',
        characterType: 'player',
        name: 'You',
        walkCycle: 0,
        isMoving: false,
        muzzleFlash: 0
      };

      // Player count evaluation: if player count > 5, DO NOT add any bots!
      const effectivePlayerCount = (this.loadout && this.loadout.playerCount !== undefined) ? this.loadout.playerCount : 1;
      const botPool = [
        { id: 1, name: 'NewtonBot', characterType: 'newton', x: 0, y: 0, vx: 0, vy: 0, angle: Math.PI, radius: 10, speed: 1.85, health: 3, maxHealth: 3, shield: 0, invulnerableTimer: 120, phaseRipple: 0, helmetColor: '#06b6d4', coatColor: '#dc2626', shootCooldown: 60, respawnTimer: 0, walkCycle: 0, isMoving: false, muzzleFlash: 0 },
        { id: 2, name: 'GalileoBot', characterType: 'galileo', x: 0, y: 0, vx: 0, vy: 0, angle: Math.PI / 2, radius: 10, speed: 1.75, health: 3, maxHealth: 3, shield: 0, invulnerableTimer: 120, phaseRipple: 0, helmetColor: '#f59e0b', coatColor: '#4f46e5', shootCooldown: 80, respawnTimer: 0, walkCycle: 0, isMoving: false, muzzleFlash: 0 },
        { id: 3, name: 'KeplerBot', characterType: 'kepler', x: 0, y: 0, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 10, speed: 1.95, health: 3, maxHealth: 3, shield: 0, invulnerableTimer: 120, phaseRipple: 0, helmetColor: '#10b981', coatColor: '#059669', shootCooldown: 70, respawnTimer: 0, walkCycle: 0, isMoving: false, muzzleFlash: 0 },
        { id: 4, name: 'CurieBot', characterType: 'curie', x: 0, y: 0, vx: 0, vy: 0, angle: 0, radius: 10, speed: 1.8, health: 3, maxHealth: 3, shield: 0, invulnerableTimer: 120, phaseRipple: 0, helmetColor: '#ec4899', coatColor: '#9333ea', shootCooldown: 75, respawnTimer: 0, walkCycle: 0, isMoving: false, muzzleFlash: 0 }
      ];

      if (effectivePlayerCount > 5) {
        this.bots = []; // Strictly zero bots if player number is above 5!
      } else {
        const neededBots = Math.max(0, 5 - effectivePlayerCount);
        this.bots = botPool.slice(0, neededBots);
      }

      // 5 Strategic Powerup Supply Crates in the 4 Outposts & Central Plaza
      this.powerups = [
        { gridX: 3, gridY: 2, type: 'shield', name: 'Kinetic Shield 🛡️', color: '#00f2fe', active: true, respawnTimer: 0 },
        { gridX: 21, gridY: 2, type: 'speed', name: 'Quantum Dash ⚡', color: '#eab308', active: true, respawnTimer: 0 },
        { gridX: 3, gridY: 14, type: 'triple', name: 'Triple Laser 💥', color: '#ec4899', active: true, respawnTimer: 0 },
        { gridX: 21, gridY: 14, type: 'emp', name: 'Graviton EMP 💣', color: '#a855f7', active: true, respawnTimer: 0 },
        { gridX: 12, gridY: 8, type: 'triple', name: 'Plasma Overcharge ⭐', color: '#38bdf8', active: true, respawnTimer: 0 }
      ];

      // Dynamic Quadrant Spawn Locator (Guarantees open corridor center with 0% wall overlap)
      this.getSpawnCoordinates = (sectorIndex) => {
        const rect = this.canvas.getBoundingClientRect();
        const w = Math.max(280, rect.width || 600);
        const h = Math.max(160, rect.height || 360);
        const cellW = w / this.cols;
        const cellH = h / this.rows;

        // 5 Safe Open Plaza Spawn Locations (guaranteed 0% wall overlap)
        const spawnGridTiles = [
          { col: 3, row: 2 },   // Sector 0 (Alpha Outpost NW)
          { col: 21, row: 2 },  // Sector 1 (Beta Outpost NE)
          { col: 3, row: 14 },  // Sector 2 (Gamma Outpost SW)
          { col: 21, row: 14 }, // Sector 3 (Delta Outpost SE)
          { col: 12, row: 8 }   // Sector 4 (Central Core Plaza)
        ];
        const t = spawnGridTiles[sectorIndex % spawnGridTiles.length];
        return {
          x: (t.col + 0.5) * cellW,
          y: (t.row + 0.5) * cellH
        };
      };

      // Key & Mouse states
      this.keys = {};
      this.touchMove = { active: false, x: 0, y: 0 };
      this.mousePos = { x: 0, y: 0, active: false };

      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);

      if (!this.isPreview) {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('pointerleave', this.onPointerLeave);
      }
    }

    onKeyDown(e) {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.code === 'Space' || e.code === 'KeyE') {
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
      this.mousePos.x = x;
      this.mousePos.y = y;
      this.mousePos.active = true;

      // Virtual Shoot Button (Bottom Right)
      const fireBtnX = rect.width - 55;
      const fireBtnY = rect.height - 55;
      if (Math.hypot(x - fireBtnX, y - fireBtnY) < 40) {
        this.firePlayerLaser();
        return;
      }

      if (e.pointerType === 'touch') {
        // Touch Drag Movement
        this.touchMove.active = true;
        this.touchMove.x = x;
        this.touchMove.y = y;
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
      } else {
        // Desktop Click-to-shoot towards cursor
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
        this.firePlayerLaser();
      }
    }

    onPointerMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mousePos.x = x;
      this.mousePos.y = y;
      this.mousePos.active = true;

      if (e.pointerType !== 'touch') {
        // Desktop: aim player's weapon towards cursor
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
      } else if (this.touchMove.active) {
        this.touchMove.x = x;
        this.touchMove.y = y;
        const dx = this.touchMove.x - this.player.x;
        const dy = this.touchMove.y - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
      }
    }

    onPointerUp(e) {
      if (e.pointerType === 'touch') {
        this.touchMove.active = false;
      }
    }

    onPointerLeave() {
      this.mousePos.active = false;
      this.touchMove.active = false;
    }

    start() {
      if (this.animId) cancelAnimationFrame(this.animId);

      // Safe Spawning: Player in NW Sector Alpha, Bots in other sectors
      const pSpawn = this.getSpawnCoordinates(0);
      this.player.x = pSpawn.x;
      this.player.y = pSpawn.y;
      this.player.invulnerableTimer = 180; // 3s respawn shield

      this.bots.forEach((bot, idx) => {
        const bSpawn = this.getSpawnCoordinates(idx + 1);
        bot.x = bSpawn.x;
        bot.y = bSpawn.y;
        bot.invulnerableTimer = 120;
      });

      // Apply Academic Performance Loadout (Shields, Ammo, Powerups earned from correct answers)
      if (this.loadout) {
        if (this.loadout.health !== undefined) {
          this.player.health = this.loadout.health;
          this.player.maxHealth = Math.max(this.player.maxHealth, this.loadout.health);
        }
        if (this.loadout.shield !== undefined) this.player.shield = this.loadout.shield;
        if (this.loadout.ammo !== undefined) {
          this.player.ammo = this.loadout.ammo;
          this.player.maxAmmo = Math.max(this.player.maxAmmo, this.loadout.ammo);
        }
        if (this.loadout.powerup) {
          this.player.powerup = this.loadout.powerup;
          this.player.powerupTimer = this.loadout.powerupTimer || 360;
        }
        if (this.loadout.bonusText) {
          setTimeout(() => {
            this.floatingTexts.emit(this.player.x, this.player.y - 25, this.loadout.bonusText, '#fbbf24', 13);
          }, 300);
        }
      }

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
      this.canvas.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    }

    // Exact Circle-to-AABB Wall Collision
    isWall(x, y, radius = 8) {
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width || 600);
      const h = Math.max(160, rect.height || 360);
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      // Arena boundary collision
      if (x - radius < cellW || x + radius > w - cellW || y - radius < cellH || y + radius > h - cellH) {
        return true;
      }

      const minC = Math.max(0, Math.floor((x - radius) / cellW));
      const maxC = Math.min(this.cols - 1, Math.floor((x + radius) / cellW));
      const minR = Math.max(0, Math.floor((y - radius) / cellH));
      const maxR = Math.min(this.rows - 1, Math.floor((y + radius) / cellH));

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (MAZE_MAP[r][c] === 1) {
            // Find closest point on wall tile AABB
            const nearestX = Math.max(c * cellW, Math.min(x, (c + 1) * cellW));
            const nearestY = Math.max(r * cellH, Math.min(y, (r + 1) * cellH));
            const distSq = (x - nearestX) * (x - nearestX) + (y - nearestY) * (y - nearestY);
            if (distSq < radius * radius - 0.05) return true;
          }
        }
      }
      return false;
    }

    // Anti-Stuck Ejection Mechanism (Guarantees entity is never trapped in a brick)
    unstickEntity(entity) {
      if (!this.isWall(entity.x, entity.y, entity.radius * 0.6)) return;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(280, rect.width || 600);
      const h = Math.max(160, rect.height || 360);
      const cellW = w / this.cols;
      const cellH = h / this.rows;

      const c = Math.floor(entity.x / cellW);
      const r = Math.floor(entity.y / cellH);

      // Search immediate 3x3 neighborhood for nearest open pathway
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 1 && nr < this.rows - 1 && nc >= 1 && nc < this.cols - 1 && MAZE_MAP[nr][nc] === 0) {
            entity.x = (nc + 0.5) * cellW;
            entity.y = (nr + 0.5) * cellH;
            return;
          }
        }
      }
    }

    firePlayerLaser() {
      if (this.player.respawnTimer > 0) return;
      if (this.player.ammo <= 0) {
        SoundFX.wrong();
        return;
      }
      this.player.ammo--;
      this.player.muzzleFlash = 4;
      SoundFX.laser();

      const speed = 7.5;
      if (this.player.powerup === 'triple') {
        [-0.22, 0, 0.22].forEach(offset => {
          const a = this.player.angle + offset;
          this.lasers.push({
            x: this.player.x + Math.cos(a) * 16,
            y: this.player.y + Math.sin(a) * 16,
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
          x: this.player.x + Math.cos(this.player.angle) * 16,
          y: this.player.y + Math.sin(this.player.angle) * 16,
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
      bot.muzzleFlash = 4;
      this.lasers.push({
        x: bot.x + Math.cos(bot.angle) * 16,
        y: bot.y + Math.sin(bot.angle) * 16,
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

      // Dynamic collision radius scaled to corridor cell size (prevents snagging)
      const dynamicRadius = Math.max(6, Math.min(cellW, cellH) * 0.35);
      this.player.radius = dynamicRadius;
      this.bots.forEach(b => b.radius = dynamicRadius);

      // Unstick safety checks
      this.unstickEntity(this.player);
      this.bots.forEach(b => this.unstickEntity(b));

      // 1. Player Movement & Controls
      if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;
      if (this.player.phaseRipple > 0) this.player.phaseRipple--;

      if (this.player.respawnTimer > 0) {
        this.player.respawnTimer--;
      } else {
        let moveX = 0;
        let moveY = 0;

        if (this.isPreview) {
          // Preview Mode: Gentle autonomous patrol
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

          // Desktop mouse aim
          if (!this.mousePos.active && (moveX !== 0 || moveY !== 0)) {
            this.player.angle = Math.atan2(moveY, moveX);
          }
        }

        const len = Math.hypot(moveX, moveY);
        if (len > 0) {
          this.player.isMoving = true;
          this.player.walkCycle = (this.player.walkCycle || 0) + 0.25;
          const spd = this.player.speed * (this.player.powerup === 'speed' ? 1.7 : 1.0);
          const nextX = this.player.x + (moveX / len) * spd;
          const nextY = this.player.y + (moveY / len) * spd;

          // Smooth Independent Axis Sliding
          if (!this.isWall(nextX, this.player.y, this.player.radius)) this.player.x = nextX;
          if (!this.isWall(this.player.x, nextY, this.player.radius)) this.player.y = nextY;
        } else {
          this.player.isMoving = false;
        }

        // Muzzle flash decay
        if (this.player.muzzleFlash > 0) this.player.muzzleFlash--;

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
        if (bot.invulnerableTimer > 0) bot.invulnerableTimer--;
        if (bot.phaseRipple > 0) bot.phaseRipple--;

        if (bot.respawnTimer > 0) {
          bot.respawnTimer--;
          return;
        }

        // Steer towards target or wander
        const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
        let targetX = this.player.x;
        let targetY = this.player.y;

        if (distToPlayer > 220 || this.isPreview) {
          targetX = bot.x + Math.cos(this.time * 2 + bot.id) * 50;
          targetY = bot.y + Math.sin(this.time * 1.8 + bot.id) * 50;
        }

        const bdx = targetX - bot.x;
        const bdy = targetY - bot.y;
        bot.angle = Math.atan2(bdy, bdx);

        const blen = Math.hypot(bdx, bdy);
        if (blen > 0) {
          bot.isMoving = true;
          bot.walkCycle = (bot.walkCycle || 0) + 0.22;
          const nextBX = bot.x + (bdx / blen) * bot.speed;
          const nextBY = bot.y + (bdy / blen) * bot.speed;
          if (!this.isWall(nextBX, bot.y, bot.radius)) bot.x = nextBX;
          if (!this.isWall(bot.x, nextBY, bot.radius)) bot.y = nextBY;
        } else {
          bot.isMoving = false;
        }

        if (bot.muzzleFlash > 0) bot.muzzleFlash--;

        // Shoot at player
        bot.shootCooldown--;
        if (bot.shootCooldown <= 0 && distToPlayer < 240 && this.player.respawnTimer <= 0) {
          this.fireBotLaser(bot);
          bot.shootCooldown = Math.floor(Math.random() * 50 + 60);
        }
      });

      // 3. Soft Phase-Ghosting Repulsion (Prevents hallway deadlocks for 10-20 students)
      const allEntities = [this.player, ...this.bots];
      for (let i = 0; i < allEntities.length; i++) {
        const e1 = allEntities[i];
        if (e1.respawnTimer > 0) continue;

        for (let j = i + 1; j < allEntities.length; j++) {
          const e2 = allEntities[j];
          if (e2.respawnTimer > 0) continue;

          let edx = e2.x - e1.x;
          let edy = e2.y - e1.y;
          let edist = Math.hypot(edx, edy);
          if (edist < 0.01) {
            edx = (Math.random() - 0.5) || 0.1;
            edy = (Math.random() - 0.5) || 0.1;
            edist = Math.hypot(edx, edy);
          }
          const minSep = e1.radius + e2.radius + 2;

          if (edist < minSep) {
            const overlap = (minSep - edist) * 0.18; // Soft spring push
            const nx = edx / edist;
            const ny = edy / edist;

            if (!this.isWall(e1.x - nx * overlap, e1.y, e1.radius)) e1.x -= nx * overlap;
            if (!this.isWall(e1.x, e1.y - ny * overlap, e1.radius)) e1.y -= ny * overlap;
            if (!this.isWall(e2.x + nx * overlap, e2.y, e2.radius)) e2.x += nx * overlap;
            if (!this.isWall(e2.x, e2.y + ny * overlap, e2.radius)) e2.y += ny * overlap;

            e1.phaseRipple = 6;
            e2.phaseRipple = 6;
          }
        }
      }

      // 4. Powerups Pickup & Respawns
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
          this.particles.emit(pwX, pwY, 14, 'sparkle');
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

      // 5. Laser Simulation & Collisions
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
          if (Math.hypot(this.player.x - l.x, this.player.y - l.y) < this.player.radius + 4) {
            this.lasers.splice(i, 1);
            this.hitEntity(this.player, 'player');
            continue;
          }
        }

        // Hit Bots?
        for (const bot of this.bots) {
          if (l.owner !== bot.id && bot.respawnTimer <= 0) {
            if (Math.hypot(bot.x - l.x, bot.y - l.y) < bot.radius + 4) {
              this.lasers.splice(i, 1);
              this.hitEntity(bot, 'bot', l.owner);
              break;
            }
          }
        }
      }

      // 6. Kill feed decay
      for (let i = this.killFeed.length - 1; i >= 0; i--) {
        this.killFeed[i].timer--;
        if (this.killFeed[i].timer <= 0) this.killFeed.splice(i, 1);
      }
    }

    applyPowerup(entity, type) {
      if (type === 'speed') {
        entity.powerup = 'speed';
        entity.powerupTimer = 320;
        this.floatingTexts.emit(entity.x, entity.y - 18, '⚡ SPEED BOOST!', '#eab308', 12);
      } else if (type === 'shield') {
        entity.shield = Math.min(2, entity.shield + 1);
        this.floatingTexts.emit(entity.x, entity.y - 18, '🛡️ KINETIC SHIELD!', '#00f2fe', 12);
      } else if (type === 'triple') {
        entity.powerup = 'triple';
        entity.powerupTimer = 320;
        this.floatingTexts.emit(entity.x, entity.y - 18, '💥 3-WAY BLASTER!', '#ec4899', 12);
      } else if (type === 'emp') {
        SoundFX.explosion();
        this.particles.emit(entity.x, entity.y, 25, 'sparkle');
        this.floatingTexts.emit(entity.x, entity.y - 18, '💣 GRAVITON EMP BLAST!', '#a855f7', 13);
        this.shake = 10;
        this.bots.forEach(bot => {
          if (Math.hypot(bot.x - entity.x, bot.y - entity.y) < 140) {
            this.hitEntity(bot, 'bot', 'player');
          }
        });
      }
    }

    hitEntity(entity, type, attackerId = null) {
      // 3-Second Golden Respawn Shield (Immunity to spawn camping)
      if (entity.invulnerableTimer > 0) {
        this.floatingTexts.emit(entity.x, entity.y - 16, '🛡️ IMMUNE!', '#fbbf24', 11);
        return;
      }

      if (entity.shield > 0) {
        entity.shield--;
        SoundFX.hit();
        this.particles.emit(entity.x, entity.y, 10, 'sparkle');
        this.floatingTexts.emit(entity.x, entity.y - 16, '🛡️ BLOCKED!', '#00f2fe', 11);
        return;
      }

      entity.health--;
      SoundFX.hit();
      this.particles.emit(entity.x, entity.y, 12, 'sparkle');
      this.floatingTexts.emit(entity.x, entity.y - 16, '-1 HP 💥', '#ef4444', 12);

      if (entity.health <= 0) {
        // KNOCKOUT / KILL!
        SoundFX.explosion();
        this.particles.emit(entity.x, entity.y, 30, 'sparkle');
        this.shake = 8;
        entity.respawnTimer = 180; // 3 seconds
        entity.health = entity.maxHealth || 3;

        if (type === 'player') {
          // Dynamic quadrant respawn
          const pSpawn = this.getSpawnCoordinates(Math.floor(Math.random() * 4));
          entity.x = pSpawn.x;
          entity.y = pSpawn.y;
          entity.shield = 1;
          entity.invulnerableTimer = 180; // 3s Golden Shield
          this.addKillFeed(`💀 You were tagged! Respawning...`);
          this.floatingTexts.emit(entity.x, entity.y - 20, '🔄 RESPAWNING...', '#f87171', 12);
        } else {
          // Bot died - Respawn in balanced quadrant
          const bSpawn = this.getSpawnCoordinates((entity.id + Math.floor(Math.random() * 3)) % 4);
          entity.x = bSpawn.x;
          entity.y = bSpawn.y;
          entity.invulnerableTimer = 120;

          if (attackerId === 'player') {
            this.player.kills++;
            this.addKillFeed(`💥 You blasted ${entity.name}! (+150 PTS)`);
            this.floatingTexts.emit(this.player.x, this.player.y - 20, '👑 ELIMINATED! +150 PTS', '#fbbf24', 13);
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

      ctx.save();
      // Screen Shake
      if (this.shake > 0) {
        ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        this.shake *= 0.85;
        if (this.shake < 0.5) this.shake = 0;
      }

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

      // 3. Render Floating Supply Crates / Powerups with Badges
      this.powerups.forEach(pw => {
        if (!pw.active) return;
        const pwX = pw.gridX * cellW + cellW * 0.5;
        const pwY = pw.gridY * cellH + cellH * 0.5 + Math.sin(this.time * 4) * 3;

        ctx.save();
        // Ground glow ring
        ctx.fillStyle = pw.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.ellipse(pwX, pwY + 12, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Floating Supply Crate Box
        ctx.shadowColor = pw.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = pw.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(pwX - 11, pwY - 11, 22, 22, 5);
        ctx.fill();
        ctx.stroke();

        // Inner Power Core
        ctx.fillStyle = pw.color;
        ctx.beginPath();
        ctx.arc(pwX, pwY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Rotating Orbital Plasma Ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(pwX, pwY, 15, 6, this.time * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Floating Banner Label above Crate
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 3;
        const label = pw.type === 'speed' ? '⚡ SPEED' :
                      pw.type === 'shield' ? '🛡️ SHIELD' :
                      pw.type === 'triple' ? '💥 3-WAY' : '💣 EMP';
        ctx.fillText(label, pwX, pwY - 16);
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
        this.drawBattleAvatar(ctx, bot, false);
      });

      // 6. Render Player
      if (this.player.respawnTimer <= 0) {
        this.drawBattleAvatar(ctx, this.player, true);

        // Player Laser Targeting Sights & Crosshair (Desktop mouse aim)
        if (!this.isPreview && this.mousePos.active) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(this.player.x + Math.cos(this.player.angle) * 16, this.player.y + Math.sin(this.player.angle) * 16);
          ctx.lineTo(this.mousePos.x, this.mousePos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Crosshair Reticle
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(this.mousePos.x, this.mousePos.y, 8, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(this.mousePos.x - 12, this.mousePos.y); ctx.lineTo(this.mousePos.x - 3, this.mousePos.y);
          ctx.moveTo(this.mousePos.x + 3, this.mousePos.y);  ctx.lineTo(this.mousePos.x + 12, this.mousePos.y);
          ctx.moveTo(this.mousePos.x, this.mousePos.y - 12); ctx.lineTo(this.mousePos.x, this.mousePos.y - 3);
          ctx.moveTo(this.mousePos.x, this.mousePos.y + 3);  ctx.lineTo(this.mousePos.x, this.mousePos.y + 12);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(this.mousePos.x, this.mousePos.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 7. Render Particles
      this.particles.updateAndDraw(ctx);

      // 8. Render Floating Combat & Status Text
      this.floatingTexts.updateAndDraw(ctx);

      // Restore camera shake
      ctx.restore();

      // 9. Render HUD (Hearts, Ammo, Kills, Kill Feed)
      this.drawBattleHUD(ctx, w, h);

      // 10. Virtual Touch Controls (Non-preview mode)
      if (!this.isPreview) {
        this.drawVirtualControls(ctx, w, h);
      }
    }

    drawBattleAvatar(ctx, entity, isPlayer = false) {
      const {
        x, y, angle, name, health, maxHealth = 3, shield,
        characterType, helmetColor, coatColor,
        walkCycle = 0, isMoving = false, muzzleFlash = 0,
        invulnerableTimer = 0, phaseRipple = 0
      } = entity;

      ctx.save();
      ctx.translate(x, y);

      // Phase Ripple Glow (when gliding past other students)
      if (phaseRipple > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, (entity.radius || 10) + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 1. Soft Drop Shadow on the floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 11, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Animated Running Legs / Boots
      const legOffset = isMoving ? Math.sin(walkCycle) * 4 : 0;
      // Left boot
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-8, 6 + legOffset, 6, 9, 3);
      ctx.fill();
      ctx.fillStyle = helmetColor;
      ctx.fillRect(-8, 12 + legOffset, 6, 3); // Sole/accent

      // Right boot
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(2, 6 - legOffset, 6, 9, 3);
      ctx.fill();
      ctx.fillStyle = helmetColor;
      ctx.fillRect(2, 12 - legOffset, 6, 3); // Sole/accent

      // 3. Torso / Armored Battle Suit
      const bodyBaseColor = coatColor || helmetColor;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-10, -4, 20, 14, 5);
      ctx.fill();

      // Armor Chestplate
      ctx.fillStyle = bodyBaseColor;
      ctx.beginPath();
      ctx.roundRect(-8, -2, 16, 9, 3);
      ctx.fill();

      // Glowing Chest Reactor Core (Pulse with time)
      ctx.fillStyle = isPlayer ? '#38bdf8' : helmetColor;
      ctx.beginPath();
      ctx.arc(0, 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 4. Arms & Vector Plasma Blaster Rifle (Rotated towards aiming angle)
      ctx.save();
      ctx.rotate(angle);

      // Blaster Rifle Body
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(6, 4, 15, 6, 2);
      ctx.fill();

      // Blaster Barrel & Neon Energy Conduit
      ctx.fillStyle = isPlayer ? '#38bdf8' : helmetColor;
      ctx.fillRect(10, 5, 8, 2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(18, 5, 7, 4);

      // Hands gripping the rifle
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(8, 4, 3, 0, Math.PI * 2);
      ctx.arc(15, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Muzzle Flash Particle Burst when firing
      if (muzzleFlash > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(26, 7, 5 + muzzleFlash, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isPlayer ? '#38bdf8' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(26, 7, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Cute Chibi Head & Distinct Face
      // Head Base
      ctx.fillStyle = '#fed7aa'; // Cute warm skin tone
      ctx.beginPath();
      ctx.arc(0, -9, 13, 0, Math.PI * 2);
      ctx.fill();

      // Cheerful Rosy Blush Cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-8, -6, 2.8, 1.6, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -6, 2.8, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Anime Eyes with white highlights
      const eyeLookX = Math.cos(angle) * 1.5;
      const eyeLookY = Math.sin(angle) * 1.0;

      // Eye Sclera / Base
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-5 + eyeLookX, -10 + eyeLookY, 3, 0, Math.PI * 2);
      ctx.arc(5 + eyeLookX, -10 + eyeLookY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Colored Iris
      ctx.fillStyle = isPlayer ? '#0284c7' : helmetColor;
      ctx.beginPath();
      ctx.arc(-5 + eyeLookX, -9.5 + eyeLookY, 2, 0, Math.PI * 2);
      ctx.arc(5 + eyeLookX, -9.5 + eyeLookY, 2, 0, Math.PI * 2);
      ctx.fill();

      // Sparkling White Eye Highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6 + eyeLookX, -11 + eyeLookY, 1.2, 0, Math.PI * 2);
      ctx.arc(4 + eyeLookX, -11 + eyeLookY, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Determined Angled Eyebrows
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, -14); ctx.lineTo(-2, -13);
      ctx.moveTo(8, -14);  ctx.lineTo(2, -13);
      ctx.stroke();

      // Determined Battle Smile / Mouth
      ctx.beginPath();
      ctx.arc(0, -5, 2.5, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // 6. Distinct Persona Hair / Hats / Visors
      if (characterType === 'player' || isPlayer) {
        // Player: Spiky Hero Anime Hair + Cyber Monocle Visor
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.moveTo(-13, -13);
        ctx.lineTo(-16, -21);
        ctx.lineTo(-8, -19);
        ctx.lineTo(-3, -24);
        ctx.lineTo(3, -20);
        ctx.lineTo(10, -23);
        ctx.lineTo(13, -15);
        ctx.lineTo(13, -9);
        ctx.lineTo(10, -14);
        ctx.lineTo(-10, -14);
        ctx.closePath();
        ctx.fill();

        // Cyan Neon Streak
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-4, -22); ctx.lineTo(1, -16); ctx.lineTo(-5, -16); ctx.closePath();
        ctx.fill();

        // Cyber Holographic Visor Monocle over Right Eye
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1.6;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.35)';
        ctx.beginPath();
        ctx.roundRect(2, -13, 8, 7, 2);
        ctx.fill();
        ctx.stroke();

      } else if (characterType === 'newton') {
        // Newton: Luxurious Powdered White Baroque Curls + Apple Pin
        ctx.fillStyle = '#f1f5f9';
        // Left curls
        ctx.beginPath(); ctx.arc(-13, -11, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-12, -6, 4.5, 0, Math.PI * 2); ctx.fill();
        // Right curls
        ctx.beginPath(); ctx.arc(13, -11, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, -6, 4.5, 0, Math.PI * 2); ctx.fill();
        // Top curls
        ctx.beginPath(); ctx.arc(-5, -20, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -20, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -21, 5, 0, Math.PI * 2); ctx.fill();

        // Golden Apple Emblem
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(0, -1, 3, 0, Math.PI * 2); ctx.fill();

      } else if (characterType === 'galileo') {
        // Galileo: Brown Wavy Hair + Distinguished Beard + Brass Goggles
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, -15, 12, Math.PI, Math.PI * 2);
        ctx.fill();
        // Beard
        ctx.beginPath();
        ctx.arc(0, -4, 6, 0, Math.PI);
        ctx.fill();

        // Brass Celestial Goggles on Forehead
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(217, 119, 6, 0.4)';
        ctx.beginPath();
        ctx.arc(-5, -16, 3.5, 0, Math.PI * 2);
        ctx.arc(5, -16, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

      } else if (characterType === 'kepler') {
        // Kepler: Emerald Astronaut Dome with Orbiting Ring
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, -9, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Orbiting Planetary Ring Antenna
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -19, 11, 4, Math.sin(this.time * 3) * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        // Orbiting planet dot
        const orbX = Math.cos(this.time * 4) * 11;
        const orbY = -19 + Math.sin(this.time * 4) * 4;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(orbX, orbY, 2, 0, Math.PI * 2); ctx.fill();

      } else if (characterType === 'curie') {
        // Curie: Violet Chic Bob Hair & Radium Tiara
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(0, -14, 12, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-12, -14, 4, 9);
        ctx.fillRect(8, -14, 4, 9);

        // Radium Glowing Atom Tiara
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, -19, 8, 3, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(0, -19, 2, 0, Math.PI * 2); ctx.fill();
      }

      // 7. Kinetic Shield Bubble (if active)
      if (shield > 0) {
        ctx.save();
        const shieldPulse = Math.sin(this.time * 6) * 1.5;
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, 21 + shieldPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mini shield orbit nodes
        const nodeAngle = this.time * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(nodeAngle) * (21 + shieldPulse), Math.sin(nodeAngle) * (21 + shieldPulse), 2.5, 0, Math.PI * 2);
        ctx.arc(Math.cos(nodeAngle + Math.PI) * (21 + shieldPulse), Math.sin(nodeAngle + Math.PI) * (21 + shieldPulse), 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 8. Golden Respawn Invulnerability Shield Bubble (3s)
      if (invulnerableTimer > 0) {
        ctx.save();
        const pulse = Math.sin(this.time * 8) * 2;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, 22 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Orbiting golden runes/stars
        const rAngle = this.time * 5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(rAngle) * 22, Math.sin(rAngle) * 22, 2.2, 0, Math.PI * 2);
        ctx.arc(Math.cos(rAngle + Math.PI) * 22, Math.sin(rAngle + Math.PI) * 22, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Sleek Multi-Segment Overhead Health Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-15, -28, 30, 5, 2.5);
      ctx.fill();

      const healthPct = Math.max(0, health / maxHealth);
      ctx.fillStyle = healthPct > 0.5 ? '#10b981' : healthPct > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-14, -27, 28 * healthPct, 3, 1.5);
      ctx.fill();

      // 10. Floating Name Badge
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = isPlayer ? '#38bdf8' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.fillText(name, 0, -32);

      // Active Powerup Badge (if any)
      if (entity.powerup) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = entity.powerup === 'speed' ? '#eab308' : entity.powerup === 'triple' ? '#ec4899' : '#a855f7';
        ctx.fillText(entity.powerup.toUpperCase(), 0, -42);
      }

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
      ctx.roundRect(w * 0.5 - 65, 10, 130, 26, 8);
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
        ctx.roundRect(w - 230, 10 + idx * 24, 220, 20, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(item.text, w - 16, 24 + idx * 24);
      });

      // Tactical Mini-Radar HUD (Displays live blips for all 10-20 players/bots)
      const radarW = 84;
      const radarH = 56;
      const radarX = w - radarW - 12;
      const radarY = h - radarH - 52;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(radarX, radarY, radarW, radarH, 6);
      ctx.fill();
      ctx.stroke();

      // Radar scanline sweep
      const sweepY = radarY + (Math.sin(this.time * 2.5) * 0.5 + 0.5) * radarH;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.moveTo(radarX, sweepY); ctx.lineTo(radarX + radarW, sweepY);
      ctx.stroke();

      // Center Core Outline
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.strokeRect(radarX + radarW * 0.35, radarY + radarH * 0.32, radarW * 0.3, radarH * 0.36);

      const scaleX = radarW / w;
      const scaleY = radarH / h;

      // Bot blips (Color-coded)
      this.bots.forEach(b => {
        if (b.respawnTimer > 0) return;
        ctx.fillStyle = b.helmetColor || '#ef4444';
        ctx.beginPath();
        ctx.arc(radarX + b.x * scaleX, radarY + b.y * scaleY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player blip (Glowing Pulsing Cyan)
      if (this.player.respawnTimer <= 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(radarX + this.player.x * scaleX, radarY + this.player.y * scaleY, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('📡 RADAR', radarX + 4, radarY + 9);

      // Bottom Objective Banner
      if (!this.isPreview) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(w * 0.5 - 160, h - 28, 320, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯 WASD: Move • Mouse: Aim & Click • Space: Fire', w * 0.5, h - 17);
      }

      ctx.restore();
    }

    drawVirtualControls(ctx, w, h) {
      ctx.save();
      // Virtual Fire Button (Bottom Right)
      const fireX = w - 45;
      const fireY = h - 45;
      ctx.fillStyle = 'rgba(236, 72, 153, 0.75)';
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

      // D-Pad / Touch Hint on Bottom Left
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.roundRect(14, h - 34, 130, 22, 6);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('⌨️ WASD / Touch', 20, h - 23);
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

    createTugOfWarGame(canvas, options = {}) {
      const arena = new TugOfWarArena(canvas, false, options);
      arena.start();
      return arena;
    },

    createMasteryPeakGame(canvas) {
      const arena = new MasteryPeakArena(canvas, false);
      arena.start();
      return arena;
    },

    createMazeBattleGame(canvas, loadout = null) {
      const arena = new MazeBattleArena(canvas, false, loadout);
      arena.start();
      return arena;
    }
  };

})(typeof window !== 'undefined' ? window : this);
