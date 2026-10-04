// ==============================================================================
// VectorSelect - Collegiate AP Physics Laboratory Simulation Apparatuses
// High-Precision 60fps HTML5 Canvas Instrumentation & Analytical Sensors
// Modules:
// 1. Precision Ballistics & Projectile Kinematics (Dual-Axis Vector Photogate)
// 2. Dynamic Friction & Work-Energy Dissipation (Air Track & Kinetic Sensor)
// 3. Centripetal Acceleration & Vertical Loop (Strain Gauge & Apex Vector Field)
// 4. Damped & Driven Harmonic Oscillator (Digital Real-Time Oscilloscope)
// 5. Static & Rotational Equilibrium Beam (Knife-Edge Fulcrum & Dynamometer)
// ==============================================================================

(function() {
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function setupHiDpiCanvas(canvas, logicalHeight = 240) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let parentW = 0;
    if (canvas) {
      if (canvas.parentElement && canvas.parentElement.clientWidth > 50) {
        parentW = canvas.parentElement.clientWidth;
      } else {
        let p = canvas.parentElement;
        while (p) {
          if (p.clientWidth > 50) {
            parentW = p.clientWidth;
            break;
          }
          p = p.parentElement;
        }
      }
    }
    if (!parentW || parentW <= 50) {
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 800;
      parentW = Math.min(1000, Math.max(340, screenW - 64));
    }
    const w = Math.max(300, parentW);
    const h = logicalHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, w, h };
  }

  function drawGrid(ctx, w, h, step = 30) {
    ctx.strokeStyle = "rgba(56, 189, 248, 0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  function drawVector(ctx, fromX, fromY, toX, toY, color = "#38bdf8", label = "", headLen = 8) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(label, toX + 4, toY - 4);
    }
  }

  window.RecoverySims = {
    activeSim: null,
    animFrameId: null,
    _activeObserver: null,

    stop: function() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (this._activeObserver) {
        this._activeObserver.disconnect();
        this._activeObserver = null;
      }
      this.activeSim = null;
    },

    attachResizeObserver: function(canvas, onResize) {
      if (typeof ResizeObserver !== 'undefined' && canvas && canvas.parentElement) {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 50) {
              onResize();
            }
          }
        });
        ro.observe(canvas.parentElement);
        if (this._activeObserver) {
          this._activeObserver.disconnect();
        }
        this._activeObserver = ro;
      }
    },

    // --------------------------------------------------------------------------
    // MODULE 1: PRECISION BALLISTICS & PROJECTILE KINEMATICS LABORATORY
    // --------------------------------------------------------------------------
    mountBallisticsLab: function(containerEl, labData = {}) {
      this.stop();
      const angle = labData.angle || 53;
      const v0 = labData.v0 || 25.0;
      const photogateX = labData.photogateX || 30.0;
      const g = labData.g || 9.8;
      const isCalculus = !!labData.isCalculus;

      let currentAngle = angle;
      let currentV0 = v0;
      let isSimulating = false;
      let proj = null;
      let trajectoryPoints = [];
      let transitRecord = null;

      containerEl.innerHTML = `
        <div class="rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-2xl">
          <!-- Laboratory Instrument Header -->
          <div class="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span class="font-bold text-slate-200">LAB STATION 1: BALLISTICS &amp; VECTOR DECOMPOSITION</span>
            </div>
            <div class="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>g = ${g.toFixed(1)} m/s²</span>
              <span class="text-cyan-400">PHOTOGATE 1 AT X = ${photogateX.toFixed(1)}m</span>
            </div>
          </div>

          <!-- Canvas Oscilloscope Viewport -->
          <div class="relative bg-slate-950">
            <canvas id="ballistics-canvas" class="w-full block" height="240"></canvas>
            
            <!-- Real-Time Sensor Telemetry Overlay -->
            <div id="ballistics-telem" class="absolute top-2.5 left-3 font-mono text-[11px] text-cyan-300 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg space-y-0.5 pointer-events-none">
              <div>LAUNCH: θ = ${currentAngle}° | v₀ = ${currentV0.toFixed(1)} m/s</div>
              <div class="text-slate-400">v₀x = ${(currentV0 * Math.cos(currentAngle * Math.PI / 180)).toFixed(1)} m/s | v₀y = ${(currentV0 * Math.sin(currentAngle * Math.PI / 180)).toFixed(1)} m/s</div>
              <div id="ballistics-transit-status" class="text-amber-400 font-bold">PHOTOGATE: STANDBY</div>
            </div>
          </div>

          <!-- Laboratory Instrument Control Panel -->
          <div class="p-3.5 bg-slate-900/80 border-t border-slate-800 text-xs font-sans space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                  <span>Muzzle Elevation (θ)</span>
                  <span id="ballistics-angle-label" class="font-mono text-cyan-300 font-bold">${currentAngle}°</span>
                </div>
                <input type="range" id="ballistics-angle-slider" min="20" max="75" step="1" value="${currentAngle}" class="w-full accent-cyan-400 cursor-pointer">
              </div>
              <div>
                <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                  <span>Muzzle Speed (v₀)</span>
                  <span id="ballistics-speed-label" class="font-mono text-cyan-300 font-bold">${currentV0.toFixed(1)} m/s</span>
                </div>
                <input type="range" id="ballistics-speed-slider" min="15" max="38" step="0.5" value="${currentV0}" class="w-full accent-cyan-400 cursor-pointer">
              </div>
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button id="btn-run-ballistics" class="pressable flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
                <span>▶</span> Release Test Projectile &amp; Record Telemetry
              </button>
              <button id="btn-reset-ballistics" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
                ↺ Reset
              </button>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("ballistics-canvas");
      const angleSlider = document.getElementById("ballistics-angle-slider");
      const speedSlider = document.getElementById("ballistics-speed-slider");
      const angleLabel = document.getElementById("ballistics-angle-label");
      const speedLabel = document.getElementById("ballistics-speed-label");
      const transitStatus = document.getElementById("ballistics-transit-status");
      const telemEl = document.getElementById("ballistics-telem");
      const runBtn = document.getElementById("btn-run-ballistics");
      const resetBtn = document.getElementById("btn-reset-ballistics");

      let hiDpi = setupHiDpiCanvas(canvas, 240);

      function worldToScreen(wx, wy) {
        const padX = 40;
        const padY = 30;
        const maxRange = 65; // meters
        const maxHeight = 30; // meters
        const sx = padX + (wx / maxRange) * (hiDpi.w - padX * 2);
        const sy = (hiDpi.h - padY) - (wy / maxHeight) * (hiDpi.h - padY * 2);
        return { sx, sy };
      }

      function updateHUD() {
        const rad = (currentAngle * Math.PI) / 180;
        const vox = currentV0 * Math.cos(rad);
        const voy = currentV0 * Math.sin(rad);
        angleLabel.textContent = `${currentAngle}°`;
        speedLabel.textContent = `${currentV0.toFixed(1)} m/s`;
        
        let transitText = "PHOTOGATE: STANDBY";
        if (transitRecord) {
          transitText = `TRIGGERED: t = ${transitRecord.t.toFixed(2)}s | y = ${transitRecord.y.toFixed(2)}m | vy = ${transitRecord.vy.toFixed(1)} m/s`;
        }

        telemEl.innerHTML = `
          <div>LAUNCH: θ = ${currentAngle}° | v₀ = ${currentV0.toFixed(1)} m/s</div>
          <div class="text-slate-400">v₀x = ${vox.toFixed(1)} m/s | v₀y = ${voy.toFixed(1)} m/s</div>
          <div class="text-cyan-400 font-bold">${transitText}</div>
        `;
      }

      function drawScene() {
        const { ctx, w, h } = hiDpi;
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, 25);

        // Ground Line
        const gY = worldToScreen(0, 0).sy;
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, gY);
        ctx.lineTo(w, gY);
        ctx.stroke();

        // Distance markings along ground
        ctx.fillStyle = "#64748b";
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        for (let m = 0; m <= 60; m += 10) {
          const pt = worldToScreen(m, 0);
          ctx.beginPath();
          ctx.moveTo(pt.sx, gY);
          ctx.lineTo(pt.sx, gY + 4);
          ctx.stroke();
          ctx.fillText(`${m}m`, pt.sx, gY + 14);
        }

        // Photogate Sensor Line
        const pgScreen = worldToScreen(photogateX, 0);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pgScreen.sx, 20);
        ctx.lineTo(pgScreen.sx, gY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Photogate housing
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(pgScreen.sx - 4, gY - 6, 8, 6);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText(`SENSOR 1 (${photogateX}m)`, pgScreen.sx, 16);

        // Launcher barrel
        const origin = worldToScreen(0, 0);
        const rad = (currentAngle * Math.PI) / 180;
        const barrelLen = 32;
        const bx = origin.sx + barrelLen * Math.cos(rad);
        const by = origin.sy - barrelLen * Math.sin(rad);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(origin.sx, origin.sy);
        ctx.lineTo(bx, by);
        ctx.stroke();

        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(origin.sx, origin.sy, 8, 0, Math.PI * 2);
        ctx.fill();

        // Recorded Trajectory Arc
        if (trajectoryPoints.length > 1) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const first = worldToScreen(trajectoryPoints[0].x, trajectoryPoints[0].y);
          ctx.moveTo(first.sx, first.sy);
          for (let i = 1; i < trajectoryPoints.length; i++) {
            const p = worldToScreen(trajectoryPoints[i].x, trajectoryPoints[i].y);
            ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
        }

        // Active Projectile & Vectors
        if (proj) {
          const pt = worldToScreen(proj.x, proj.y);
          ctx.fillStyle = "#f59e0b";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Render instantaneous velocity vector
          drawVector(ctx, pt.sx, pt.sy, pt.sx + proj.vx * 1.5, pt.sy - proj.vy * 1.5, "#38bdf8", "v⃗");
        }
      }

      function handleResize() {
        hiDpi = setupHiDpiCanvas(canvas, 240);
        drawScene();
      }
      window.addEventListener("resize", handleResize);
      RecoverySims.attachResizeObserver(canvas, handleResize);
      drawScene();
      setTimeout(handleResize, 60);

      angleSlider.oninput = (e) => {
        if (isSimulating) return;
        currentAngle = parseFloat(e.target.value);
        updateHUD();
        drawScene();
      };

      speedSlider.oninput = (e) => {
        if (isSimulating) return;
        currentV0 = parseFloat(e.target.value);
        updateHUD();
        drawScene();
      };

      runBtn.onclick = () => {
        if (isSimulating) return;
        isSimulating = true;
        trajectoryPoints = [];
        transitRecord = null;

        const rad = (currentAngle * Math.PI) / 180;
        proj = {
          x: 0,
          y: 0,
          vx: currentV0 * Math.cos(rad),
          vy: currentV0 * Math.sin(rad),
          t: 0
        };

        const dt = 0.02; // 20ms precision step
        let triggered = false;

        function step() {
          proj.t += dt;
          proj.vy -= g * dt;
          proj.x += proj.vx * dt;
          proj.y += proj.vy * dt;

          trajectoryPoints.push({ x: proj.x, y: proj.y });

          // Detect Photogate Sensor 1 transit
          if (!triggered && proj.x >= photogateX) {
            triggered = true;
            transitRecord = {
              t: proj.t,
              y: Math.max(0, proj.y),
              vy: proj.vy
            };
            updateHUD();
          }

          drawScene();

          if (proj.y > 0 && proj.x < 65) {
            RecoverySims.animFrameId = requestAnimationFrame(step);
          } else {
            isSimulating = false;
            proj.y = 0;
            drawScene();
            updateHUD();
          }
        }

        RecoverySims.animFrameId = requestAnimationFrame(step);
      };

      resetBtn.onclick = () => {
        RecoverySims.stop();
        isSimulating = false;
        proj = null;
        trajectoryPoints = [];
        transitRecord = null;
        updateHUD();
        drawScene();
      };
    },

    // --------------------------------------------------------------------------
    // MODULE 2: DYNAMIC FRICTION & WORK-ENERGY DISSIPATION TRACK
    // --------------------------------------------------------------------------
    mountFrictionLab: function(containerEl, labData = {}) {
      this.stop();
      const m = labData.m || 2.0;
      const vA = labData.vA || 12.0;
      const L = labData.L || 8.0;
      const mu = labData.mu || 0.35;
      const g = labData.g || 9.8;

      let currentMu = mu;
      let isSimulating = false;
      let cart = null;
      let photogateBRecord = null;

      containerEl.innerHTML = `
        <div class="rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-2xl">
          <div class="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="font-bold text-slate-200">LAB STATION 2: WORK-ENERGY AIR TRACK APPARATUS</span>
            </div>
            <div class="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Cart m = ${m.toFixed(1)} kg</span>
              <span>Test Strip L = ${L.toFixed(1)}m</span>
              <span class="text-emerald-400">Initial v_A = ${vA.toFixed(1)} m/s</span>
            </div>
          </div>

          <div class="relative bg-slate-950">
            <canvas id="friction-canvas" class="w-full block" height="230"></canvas>
            <div id="friction-telem" class="absolute top-2.5 left-3 font-mono text-[11px] text-emerald-300 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg space-y-0.5 pointer-events-none">
              <div>INITIAL KINETIC ENERGY: K_A = ${(0.5 * m * vA * vA).toFixed(1)} J</div>
              <div class="text-slate-400">FRICTION FORCE: f_k = μ_k mg = ${(currentMu * m * g).toFixed(1)} N</div>
              <div id="friction-gate-status" class="text-amber-400 font-bold">PHOTOGATE B: STANDBY</div>
            </div>
          </div>

          <div class="p-3.5 bg-slate-900/80 border-t border-slate-800 text-xs font-sans space-y-3">
            <div>
              <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Calibrate Surface Coefficient of Friction (μ_k)</span>
                <span id="friction-mu-label" class="font-mono text-emerald-300 font-bold">${currentMu.toFixed(2)}</span>
              </div>
              <input type="range" id="friction-mu-slider" min="0.10" max="0.75" step="0.01" value="${currentMu}" class="w-full accent-emerald-400 cursor-pointer">
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button id="btn-run-friction" class="pressable flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
                <span>▶</span> Release Air Cart Across Friction Zone
              </button>
              <button id="btn-reset-friction" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
                ↺ Reset
              </button>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("friction-canvas");
      const slider = document.getElementById("friction-mu-slider");
      const muLabel = document.getElementById("friction-mu-label");
      const telemEl = document.getElementById("friction-telem");
      const runBtn = document.getElementById("btn-run-friction");
      const resetBtn = document.getElementById("btn-reset-friction");

      let hiDpi = setupHiDpiCanvas(canvas, 230);

      function updateHUD() {
        muLabel.textContent = currentMu.toFixed(2);
        const fk = currentMu * m * g;
        const workDissipated = fk * L;
        let gateBText = "PHOTOGATE B: STANDBY";
        if (photogateBRecord) {
          gateBText = `GATE B TRIGGER: v_B = ${photogateBRecord.v.toFixed(2)} m/s | W_nc = -${workDissipated.toFixed(1)} J`;
        }

        telemEl.innerHTML = `
          <div>INITIAL KINETIC ENERGY: K_A = ${(0.5 * m * vA * vA).toFixed(1)} J</div>
          <div class="text-slate-400">FRICTION FORCE: f_k = μ_k mg = ${fk.toFixed(1)} N | W_f = ${(fk * L).toFixed(1)} J</div>
          <div class="text-emerald-400 font-bold">${gateBText}</div>
        `;
      }

      function drawScene(cartX = 0) {
        const { ctx, w, h } = hiDpi;
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, 25);

        const trackY = h - 50;
        const padX = 40;
        const trackW = w - padX * 2;

        // Frictionless Track Base
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(padX, trackY, trackW, 16);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.strokeRect(padX, trackY, trackW, 16);

        // Rough Track Section (From X = 3m to X = 3m + L)
        const totalMeters = 16.0;
        const startRoughPx = padX + (3.0 / totalMeters) * trackW;
        const roughLenPx = (L / totalMeters) * trackW;

        ctx.fillStyle = "rgba(234, 88, 12, 0.25)";
        ctx.fillRect(startRoughPx, trackY, roughLenPx, 16);
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(startRoughPx, trackY, roughLenPx, 16);
        ctx.setLineDash([]);

        ctx.fillStyle = "#f97316";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`ROUGH ZONE (L = ${L}m, μ_k = ${currentMu.toFixed(2)})`, startRoughPx + roughLenPx / 2, trackY - 32);

        // Photogate A (at start of rough zone)
        ctx.strokeStyle = "#38bdf8";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(startRoughPx, trackY - 26);
        ctx.lineTo(startRoughPx, trackY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText("GATE A", startRoughPx, trackY - 32);

        // Photogate B (at end of rough zone)
        const endRoughPx = startRoughPx + roughLenPx;
        ctx.strokeStyle = "#10b981";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(endRoughPx, trackY - 26);
        ctx.lineTo(endRoughPx, trackY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#10b981";
        ctx.fillText("GATE B", endRoughPx, trackY - 32);

        // Cart
        const cartPx = padX + (cartX / totalMeters) * trackW;
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(cartPx - 18, trackY - 22, 36, 20);
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2;
        ctx.strokeRect(cartPx - 18, trackY - 22, 36, 20);

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(cartPx - 10, trackY - 2, 4, 0, Math.PI * 2);
        ctx.arc(cartPx + 10, trackY - 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.fillText(`${m}kg`, cartPx, trackY - 8);

        // Force vectors when inside rough zone
        if (cartX >= 3.0 && cartX <= 3.0 + L) {
          drawVector(ctx, cartPx, trackY - 12, cartPx - 32, trackY - 12, "#ef4444", "f_k");
          drawVector(ctx, cartPx, trackY - 12, cartPx, trackY - 42, "#10b981", "F_N");
        }
      }

      function handleResize() {
        hiDpi = setupHiDpiCanvas(canvas, 230);
        drawScene(cart ? cart.x : 0);
      }
      window.addEventListener("resize", handleResize);
      RecoverySims.attachResizeObserver(canvas, handleResize);
      drawScene(0);
      setTimeout(handleResize, 60);

      slider.oninput = (e) => {
        if (isSimulating) return;
        currentMu = parseFloat(e.target.value);
        updateHUD();
        drawScene(0);
      };

      runBtn.onclick = () => {
        if (isSimulating) return;
        isSimulating = true;
        photogateBRecord = null;

        cart = {
          x: 0,
          v: vA
        };

        const dt = 0.02;
        const totalMeters = 16.0;

        function step() {
          // If in rough zone: a = -mu * g
          let a = 0;
          if (cart.x >= 3.0 && cart.x <= 3.0 + L) {
            a = -currentMu * g;
          }

          cart.v += a * dt;
          if (cart.v < 0) cart.v = 0;
          cart.x += cart.v * dt;

          if (!photogateBRecord && cart.x >= 3.0 + L) {
            photogateBRecord = { v: cart.v };
            updateHUD();
          }

          drawScene(cart.x);

          if (cart.v > 0.05 && cart.x < totalMeters - 1) {
            RecoverySims.animFrameId = requestAnimationFrame(step);
          } else {
            isSimulating = false;
            drawScene(cart.x);
            updateHUD();
          }
        }
        RecoverySims.animFrameId = requestAnimationFrame(step);
      };

      resetBtn.onclick = () => {
        RecoverySims.stop();
        isSimulating = false;
        cart = null;
        photogateBRecord = null;
        updateHUD();
        drawScene(0);
      };
    },

    // --------------------------------------------------------------------------
    // MODULE 3: CENTRIPETAL ACCELERATION & VERTICAL LOOP-THE-LOOP
    // --------------------------------------------------------------------------
    mountCentripetalLab: function(containerEl, labData = {}) {
      this.stop();
      const m = labData.m || 1.5;
      const H = labData.H || 45.0;
      const R = labData.R || 15.0;
      const g = labData.g || 9.8;

      let currentH = H;
      let isSimulating = false;
      let apexRecord = null;

      containerEl.innerHTML = `
        <div class="rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-2xl">
          <div class="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span class="font-bold text-slate-200">LAB STATION 3: CENTRIPETAL DYNAMICS &amp; NORMAL FORCE GAUGE</span>
            </div>
            <div class="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Assembly m = ${m.toFixed(1)} kg</span>
              <span>Loop Radius R = ${R.toFixed(1)}m</span>
              <span class="text-purple-400">Release H = ${currentH.toFixed(1)}m</span>
            </div>
          </div>

          <div class="relative bg-slate-950">
            <canvas id="centripetal-canvas" class="w-full block" height="240"></canvas>
            <div id="centripetal-telem" class="absolute top-2.5 left-3 font-mono text-[11px] text-purple-300 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg space-y-0.5 pointer-events-none">
              <div>CRITICAL VELOCITY: v_crit = √(gR) = ${(Math.sqrt(g * R)).toFixed(1)} m/s</div>
              <div class="text-slate-400">THEORETICAL MIN HEIGHT: H_crit = 2.5R = ${(2.5 * R).toFixed(1)} m</div>
              <div id="centripetal-apex-status" class="text-amber-400 font-bold">APEX STRAIN GAUGE: STANDBY</div>
            </div>
          </div>

          <div class="p-3.5 bg-slate-900/80 border-t border-slate-800 text-xs font-sans space-y-3">
            <div>
              <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Incline Release Height (H)</span>
                <span id="centripetal-h-label" class="font-mono text-purple-300 font-bold">${currentH.toFixed(1)} m</span>
              </div>
              <input type="range" id="centripetal-h-slider" min="25" max="65" step="0.5" value="${currentH}" class="w-full accent-purple-400 cursor-pointer">
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button id="btn-run-centripetal" class="pressable flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
                <span>▶</span> Release Assembly &amp; Measure Apex Load
              </button>
              <button id="btn-reset-centripetal" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
                ↺ Reset
              </button>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("centripetal-canvas");
      const slider = document.getElementById("centripetal-h-slider");
      const hLabel = document.getElementById("centripetal-h-label");
      const telemEl = document.getElementById("centripetal-telem");
      const runBtn = document.getElementById("btn-run-centripetal");
      const resetBtn = document.getElementById("btn-reset-centripetal");

      let hiDpi = setupHiDpiCanvas(canvas, 240);

      function updateHUD() {
        hLabel.textContent = `${currentH.toFixed(1)} m`;
        const vCrit = Math.sqrt(g * R);
        let apexStatus = "APEX STRAIN GAUGE: STANDBY";
        if (apexRecord) {
          if (apexRecord.fell) {
            apexStatus = `APEX COLLAPSE: v_apex < ${vCrit.toFixed(1)} m/s (Normal force dropped to 0)`;
          } else {
            apexStatus = `APEX TELEMETRY: v = ${apexRecord.v.toFixed(1)} m/s | F_N = ${apexRecord.fn.toFixed(1)} N (Normal Load)`;
          }
        }

        telemEl.innerHTML = `
          <div>CRITICAL VELOCITY: v_crit = √(gR) = ${vCrit.toFixed(1)} m/s</div>
          <div class="text-slate-400">RELEASE HEIGHT: H = ${currentH.toFixed(1)} m (Threshold: ${(2.5 * R).toFixed(1)} m)</div>
          <div class="text-purple-400 font-bold">${apexStatus}</div>
        `;
      }

      function drawScene(progress = 0) {
        const { ctx, w, h } = hiDpi;
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, 25);

        const groundY = h - 25;
        const loopR_px = 65;
        const loopCenterX = w * 0.62;
        const loopCenterY = groundY - loopR_px;

        // Ground Track
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();

        // Release Incline
        const rampStartX = 40;
        const rampTopY = groundY - (currentH / 65) * 160;
        const rampEndX = loopCenterX - loopR_px;

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rampStartX, rampTopY);
        ctx.quadraticCurveTo(rampStartX + 40, groundY, rampEndX, groundY);
        ctx.stroke();

        // Release height indicator
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(rampStartX - 10, rampTopY);
        ctx.lineTo(rampStartX + 40, rampTopY);
        ctx.moveTo(rampStartX - 5, rampTopY);
        ctx.lineTo(rampStartX - 5, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText(`H = ${currentH}m`, rampStartX + 8, rampTopY - 6);

        // Circular Loop
        ctx.beginPath();
        ctx.arc(loopCenterX, loopCenterY, loopR_px, 0, Math.PI * 2);
        ctx.stroke();

        // Digital Apex Strain Sensor
        const apexY = loopCenterY - loopR_px;
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(loopCenterX - 14, apexY - 6, 28, 6);
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("APEX SENSOR", loopCenterX, apexY - 10);

        // Moving Cart
        let cartX = rampStartX;
        let cartY = rampTopY;

        if (progress > 0) {
          if (progress < 0.35) {
            const t = progress / 0.35;
            cartX = rampStartX + t * (rampEndX - rampStartX);
            cartY = rampTopY + t * t * (groundY - rampTopY);
          } else if (progress < 0.85) {
            const loopT = (progress - 0.35) / 0.50;
            const loopAngle = Math.PI / 2 - loopT * 2 * Math.PI;
            cartX = loopCenterX + loopR_px * Math.cos(loopAngle);
            cartY = loopCenterY + loopR_px * Math.sin(loopAngle);
          } else {
            const exitT = (progress - 0.85) / 0.15;
            cartX = loopCenterX + loopR_px + exitT * (w - loopCenterX - loopR_px);
            cartY = groundY - 6;
          }
        }

        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(cartX, cartY - 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Force Vectors at Apex if reached
        if (progress >= 0.58 && progress <= 0.62) {
          const vSq = Math.max(0, 2 * g * (currentH - 2 * R));
          const fn = m * (vSq / R - g);
          drawVector(ctx, loopCenterX, apexY + 6, loopCenterX, apexY + 28, "#ef4444", "F_g");
          if (fn > 0) {
            drawVector(ctx, loopCenterX, apexY + 6, loopCenterX, apexY + 28 + Math.min(35, fn * 0.8), "#38bdf8", "F_N");
          }
        }
      }

      function handleResize() {
        hiDpi = setupHiDpiCanvas(canvas, 240);
        drawScene(0);
      }
      window.addEventListener("resize", handleResize);
      RecoverySims.attachResizeObserver(canvas, handleResize);
      drawScene(0);
      setTimeout(handleResize, 60);

      slider.oninput = (e) => {
        if (isSimulating) return;
        currentH = parseFloat(e.target.value);
        updateHUD();
        drawScene(0);
      };

      runBtn.onclick = () => {
        if (isSimulating) return;
        isSimulating = true;
        apexRecord = null;

        let cartProgress = 0;
        const minH = 2.5 * R;

        function step() {
          cartProgress += 0.012;
          drawScene(cartProgress);

          // Check Apex at progress 0.60
          if (!apexRecord && cartProgress >= 0.60) {
            const vSq = Math.max(0, 2 * g * (currentH - 2 * R));
            const vApex = Math.sqrt(vSq);
            const fn = m * (vSq / R - g);

            if (currentH < minH) {
              apexRecord = { fell: true };
              isSimulating = false;
              updateHUD();
              return;
            } else {
              apexRecord = { v: vApex, fn: fn, fell: false };
              updateHUD();
            }
          }

          if (cartProgress < 1.0) {
            RecoverySims.animFrameId = requestAnimationFrame(step);
          } else {
            isSimulating = false;
            drawScene(1.0);
            updateHUD();
          }
        }
        RecoverySims.animFrameId = requestAnimationFrame(step);
      };

      resetBtn.onclick = () => {
        RecoverySims.stop();
        isSimulating = false;
        apexRecord = null;
        updateHUD();
        drawScene(0);
      };
    },

    // --------------------------------------------------------------------------
    // MODULE 4: DAMPED & DRIVEN HARMONIC OSCILLATOR SPECTROMETER
    // --------------------------------------------------------------------------
    mountHarmonicLab: function(containerEl, labData = {}) {
      this.stop();
      const m = labData.m || 2.5;
      const k = labData.k || 160.0;
      const x0 = labData.x0 || 0.20;

      let currentK = k;
      let currentX0 = x0;
      let isSimulating = false;
      let simTime = 0;
      let waveHistory = [];

      containerEl.innerHTML = `
        <div class="rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-2xl">
          <div class="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span class="font-bold text-slate-200">LAB STATION 4: DAMPED HARMONIC OSCILLATOR OSCILLOSCOPE</span>
            </div>
            <div class="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Mass m = ${m.toFixed(1)} kg</span>
              <span>Spring k = ${currentK.toFixed(1)} N/m</span>
              <span class="text-cyan-400">x₀ = ${currentX0.toFixed(2)} m</span>
            </div>
          </div>

          <div class="relative bg-slate-950">
            <canvas id="harmonic-canvas" class="w-full block" height="230"></canvas>
            <div id="harmonic-telem" class="absolute top-2.5 left-3 font-mono text-[11px] text-cyan-300 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg space-y-0.5 pointer-events-none">
              <div>ANGULAR FREQUENCY: ω₀ = √(k/m) = ${(Math.sqrt(currentK / m)).toFixed(2)} rad/s</div>
              <div class="text-slate-400">PERIOD: T = 2π/ω₀ = ${(2 * Math.PI / Math.sqrt(currentK / m)).toFixed(2)} s</div>
              <div id="harmonic-energy-status" class="text-amber-400 font-bold">TOTAL MECHANICAL ENERGY: E = ${(0.5 * currentK * currentX0 * currentX0).toFixed(2)} J</div>
            </div>
          </div>

          <div class="p-3.5 bg-slate-900/80 border-t border-slate-800 text-xs font-sans space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                  <span>Spring Constant (k)</span>
                  <span id="harmonic-k-label" class="font-mono text-cyan-300 font-bold">${currentK.toFixed(1)} N/m</span>
                </div>
                <input type="range" id="harmonic-k-slider" min="50" max="280" step="5" value="${currentK}" class="w-full accent-cyan-400 cursor-pointer">
              </div>
              <div>
                <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                  <span>Initial Amplitude (x₀)</span>
                  <span id="harmonic-x0-label" class="font-mono text-cyan-300 font-bold">${currentX0.toFixed(2)} m</span>
                </div>
                <input type="range" id="harmonic-x0-slider" min="0.05" max="0.35" step="0.01" value="${currentX0}" class="w-full accent-cyan-400 cursor-pointer">
              </div>
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button id="btn-run-harmonic" class="pressable flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
                <span>▶</span> Engage Oscillator &amp; Capture Waveform
              </button>
              <button id="btn-reset-harmonic" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
                ↺ Reset
              </button>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("harmonic-canvas");
      const kSlider = document.getElementById("harmonic-k-slider");
      const x0Slider = document.getElementById("harmonic-x0-slider");
      const kLabel = document.getElementById("harmonic-k-label");
      const x0Label = document.getElementById("harmonic-x0-label");
      const telemEl = document.getElementById("harmonic-telem");
      const runBtn = document.getElementById("btn-run-harmonic");
      const resetBtn = document.getElementById("btn-reset-harmonic");

      let hiDpi = setupHiDpiCanvas(canvas, 230);

      function updateHUD() {
        const omega = Math.sqrt(currentK / m);
        const T = (2 * Math.PI) / omega;
        const E = 0.5 * currentK * currentX0 * currentX0;
        const vMax = omega * currentX0;

        kLabel.textContent = `${currentK.toFixed(1)} N/m`;
        x0Label.textContent = `${currentX0.toFixed(2)} m`;

        telemEl.innerHTML = `
          <div>ANGULAR FREQUENCY: ω₀ = ${omega.toFixed(2)} rad/s | T = ${T.toFixed(2)} s | f = ${(1/T).toFixed(2)} Hz</div>
          <div class="text-slate-400">MAX VELOCITY: v_max = ω₀x₀ = ${vMax.toFixed(2)} m/s</div>
          <div class="text-cyan-400 font-bold">TOTAL MECHANICAL ENERGY: E = ${E.toFixed(2)} J</div>
        `;
      }

      function drawScene(dispMeters = 0) {
        const { ctx, w, h } = hiDpi;
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, 25);

        const cy = h * 0.42;
        const cx = w * 0.35;

        // Oscilloscope Waveform Partition on Right
        const scopeX = w * 0.65;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.beginPath();
        ctx.moveTo(scopeX, 10);
        ctx.lineTo(scopeX, h - 10);
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.fillText("CH-1 DISPLACEMENT TRACE x(t)", scopeX + 8, 20);

        // Center equilibrium line
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(cx, cy - 35);
        ctx.lineTo(cx, cy + 35);
        ctx.moveTo(scopeX, cy);
        ctx.lineTo(w - 10, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wall anchor on left
        ctx.fillStyle = "#334155";
        ctx.fillRect(30, cy - 35, 12, 70);

        // Spring Calculation
        const pxPerMeter = 160;
        const dispPx = dispMeters * pxPerMeter;
        const massX = cx + dispPx;

        // Draw spring coils from x=42 to massX - 18
        const startX = 42;
        const endX = massX - 18;
        const coils = 12;
        const step = (endX - startX) / coils;

        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, cy);
        for (let i = 0; i < coils; i++) {
          const x1 = startX + (i + 0.25) * step;
          const y1 = cy - 10;
          const x2 = startX + (i + 0.75) * step;
          const y2 = cy + 10;
          ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.lineTo(endX, cy);
        ctx.stroke();

        // Mass block
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(massX - 18, cy - 18, 36, 36);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(massX - 18, cy - 18, 36, 36);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${m}kg`, massX, cy + 4);

        // Waveform on oscilloscope screen
        if (waveHistory.length > 1) {
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          const scopeW = (w - 10) - scopeX;
          for (let i = 0; i < waveHistory.length; i++) {
            const wx = scopeX + (i / 150) * scopeW;
            const wy = cy - waveHistory[i] * pxPerMeter * 0.7;
            if (i === 0) ctx.moveTo(wx, wy);
            else ctx.lineTo(wx, wy);
          }
          ctx.stroke();
        }
      }

      function handleResize() {
        hiDpi = setupHiDpiCanvas(canvas, 230);
        drawScene(currentX0);
      }
      window.addEventListener("resize", handleResize);
      RecoverySims.attachResizeObserver(canvas, handleResize);
      drawScene(currentX0);
      setTimeout(handleResize, 60);

      kSlider.oninput = (e) => {
        if (isSimulating) return;
        currentK = parseFloat(e.target.value);
        updateHUD();
        drawScene(currentX0);
      };

      x0Slider.oninput = (e) => {
        if (isSimulating) return;
        currentX0 = parseFloat(e.target.value);
        updateHUD();
        drawScene(currentX0);
      };

      runBtn.onclick = () => {
        if (isSimulating) return;
        isSimulating = true;
        simTime = 0;
        waveHistory = [];

        const omega = Math.sqrt(currentK / m);
        const dt = 0.02;

        function step() {
          simTime += dt;
          const currentDisp = currentX0 * Math.cos(omega * simTime);
          waveHistory.push(currentDisp);
          if (waveHistory.length > 150) waveHistory.shift();

          drawScene(currentDisp);

          if (simTime < 5.0) {
            RecoverySims.animFrameId = requestAnimationFrame(step);
          } else {
            isSimulating = false;
            drawScene(0);
          }
        }
        RecoverySims.animFrameId = requestAnimationFrame(step);
      };

      resetBtn.onclick = () => {
        RecoverySims.stop();
        isSimulating = false;
        simTime = 0;
        waveHistory = [];
        updateHUD();
        drawScene(currentX0);
      };
    },

    // --------------------------------------------------------------------------
    // MODULE 5: STATIC EQUILIBRIUM & DISTRIBUTED TORQUE BEAM
    // --------------------------------------------------------------------------
    mountTorqueLab: function(containerEl, labData = {}) {
      this.stop();
      const L = labData.L || 6.0;
      const Mbeam = labData.Mbeam || 8.0;
      const xFulcrum = labData.xFulcrum || 2.0;
      const m1 = labData.m1 || 12.0;
      const m2 = labData.m2 || 4.0;
      const g = labData.g || 9.8;

      let currentM2Pos = 4.0; // distance from fulcrum on right
      let isSimulating = false;
      let equilibriumStatus = null;

      containerEl.innerHTML = `
        <div class="rounded-2xl border border-slate-800 bg-slate-950/95 overflow-hidden shadow-2xl">
          <div class="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span class="font-bold text-slate-200">LAB STATION 5: RIGID BODY ROTATIONAL EQUILIBRIUM</span>
            </div>
            <div class="flex items-center gap-3 text-slate-400 text-[11px]">
              <span>Beam: L = ${L.toFixed(1)}m, M = ${Mbeam.toFixed(1)}kg</span>
              <span>Load: m₁ = ${m1.toFixed(1)}kg</span>
              <span class="text-amber-400">Counterweight: m₂ = ${m2.toFixed(1)}kg</span>
            </div>
          </div>

          <div class="relative bg-slate-950">
            <canvas id="torque-canvas" class="w-full block" height="230"></canvas>
            <div id="torque-telem" class="absolute top-2.5 left-3 font-mono text-[11px] text-amber-300 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg space-y-0.5 pointer-events-none">
              <div>LEFT TORQUE: τ_CCW = ${(m1 * g * xFulcrum).toFixed(1)} N·m</div>
              <div class="text-slate-400">BEAM GRAVITY TORQUE: τ_beam = ${(Mbeam * g * (L / 2 - xFulcrum)).toFixed(1)} N·m</div>
              <div id="torque-equilibrium-state" class="text-amber-400 font-bold">PIVOT SENSOR: STANDBY</div>
            </div>
          </div>

          <div class="p-3.5 bg-slate-900/80 border-t border-slate-800 text-xs font-sans space-y-3">
            <div>
              <div class="flex justify-between text-slate-300 mb-1 font-semibold">
                <span>Position of Counterweight m₂ from Fulcrum (d₂)</span>
                <span id="torque-pos-label" class="font-mono text-amber-300 font-bold">${currentM2Pos.toFixed(2)} m</span>
              </div>
              <input type="range" id="torque-pos-slider" min="1.0" max="${(L - xFulcrum).toFixed(1)}" step="0.05" value="${currentM2Pos}" class="w-full accent-amber-400 cursor-pointer">
            </div>

            <div class="flex items-center gap-3 pt-1">
              <button id="btn-run-torque" class="pressable flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition">
                <span>▶</span> Release Pivot Clamps &amp; Verify Torque Balance
              </button>
              <button id="btn-reset-torque" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
                ↺ Level Beam
              </button>
            </div>
          </div>
        </div>
      `;

      const canvas = document.getElementById("torque-canvas");
      const slider = document.getElementById("torque-pos-slider");
      const posLabel = document.getElementById("torque-pos-label");
      const telemEl = document.getElementById("torque-telem");
      const runBtn = document.getElementById("btn-run-torque");
      const resetBtn = document.getElementById("btn-reset-torque");

      let hiDpi = setupHiDpiCanvas(canvas, 230);

      function updateHUD(netTorque = 0) {
        posLabel.textContent = `${currentM2Pos.toFixed(2)} m`;
        const tauLeft = m1 * g * xFulcrum;
        const tauBeam = Mbeam * g * (L / 2 - xFulcrum);
        const tauRight = m2 * g * currentM2Pos;
        const net = tauLeft - (tauBeam + tauRight);

        let statusText = "PIVOT SENSOR: STANDBY";
        if (equilibriumStatus) {
          statusText = equilibriumStatus;
        }

        telemEl.innerHTML = `
          <div>LEFT TORQUE: τ_CCW = ${tauLeft.toFixed(1)} N·m | BEAM TORQUE: ${tauBeam.toFixed(1)} N·m</div>
          <div class="text-slate-400">COUNTERWEIGHT TORQUE: τ_CW = ${tauRight.toFixed(1)} N·m | NET τ = ${net.toFixed(2)} N·m</div>
          <div class="text-amber-400 font-bold">${statusText}</div>
        `;
      }

      function drawScene(tiltDeg = 0) {
        const { ctx, w, h } = hiDpi;
        ctx.clearRect(0, 0, w, h);
        drawGrid(ctx, w, h, 25);

        const cx = w * 0.45;
        const cy = h * 0.58;

        // Fulcrum Knife-Edge Base
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 18, cy + 32);
        ctx.lineTo(cx + 18, cy + 32);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0284c7";
        ctx.fillRect(cx - 30, cy + 32, 60, 8);

        // Beam Rotation
        const beamLenPx = Math.min(420, w - 80);
        const pxPerMeter = beamLenPx / L;
        const leftArmPx = xFulcrum * pxPerMeter;
        const rightArmPx = (L - xFulcrum) * pxPerMeter;

        const rad = (tiltDeg * Math.PI) / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rad);

        // Heavy Beam Body
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(-leftArmPx, -7, beamLenPx, 14);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-leftArmPx, -7, beamLenPx, 14);

        // Center of Mass of Beam
        const cmOffsetMeters = L / 2 - xFulcrum;
        const cmPx = cmOffsetMeters * pxPerMeter;
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(cmPx, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        drawVector(ctx, cmPx, 7, cmPx, 30, "#f59e0b", `M_b g (${(Mbeam * g).toFixed(0)}N)`);

        // Load 1 on Left End
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-leftArmPx - 14, -28, 28, 21);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${m1}kg`, -leftArmPx, -14);
        drawVector(ctx, -leftArmPx, 7, -leftArmPx, 35, "#ef4444", `F₁`);

        // Counterweight 2 on Right Arm
        const m2Px = currentM2Pos * pxPerMeter;
        ctx.fillStyle = "#10b981";
        ctx.fillRect(m2Px - 12, -26, 24, 19);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${m2}kg`, m2Px, -13);
        drawVector(ctx, m2Px, 7, m2Px, 32, "#10b981", `F₂`);

        ctx.restore();
      }

      function handleResize() {
        hiDpi = setupHiDpiCanvas(canvas, 230);
        drawScene(0);
      }
      window.addEventListener("resize", handleResize);
      RecoverySims.attachResizeObserver(canvas, handleResize);
      drawScene(0);
      setTimeout(handleResize, 60);

      slider.oninput = (e) => {
        if (isSimulating) return;
        currentM2Pos = parseFloat(e.target.value);
        updateHUD();
        drawScene(0);
      };

      runBtn.onclick = () => {
        if (isSimulating) return;
        isSimulating = true;

        const tauLeft = m1 * g * xFulcrum;
        const tauBeam = Mbeam * g * (L / 2 - xFulcrum);
        const tauRight = m2 * g * currentM2Pos;
        const netTorque = tauLeft - (tauBeam + tauRight);

        // Theoretical balance position: (tauLeft - tauBeam) / (m2 * g)
        const idealD2 = (tauLeft - tauBeam) / (m2 * g);
        const targetTilt = Math.max(-16, Math.min(16, -netTorque * 0.25));

        let currentTilt = 0;
        function animateTilt() {
          currentTilt += (targetTilt - currentTilt) * 0.08;
          drawScene(currentTilt);

          if (Math.abs(targetTilt - currentTilt) > 0.2) {
            RecoverySims.animFrameId = requestAnimationFrame(animateTilt);
          } else {
            isSimulating = false;
            drawScene(targetTilt);

            if (Math.abs(currentM2Pos - idealD2) <= 0.20) {
              equilibriumStatus = `ROTATIONAL EQUILIBRIUM VERIFIED: Στ = 0 (d₂ = ${idealD2.toFixed(2)}m)`;
            } else {
              equilibriumStatus = `UNBALANCED: Net Torque = ${netTorque.toFixed(1)} N·m (Needed d₂ = ${idealD2.toFixed(2)}m)`;
            }
            updateHUD(netTorque);
          }
        }
        RecoverySims.animFrameId = requestAnimationFrame(animateTilt);
      };

      resetBtn.onclick = () => {
        RecoverySims.stop();
        isSimulating = false;
        equilibriumStatus = null;
        updateHUD();
        drawScene(0);
      };
    },

    // Backwards compatibility wrappers
    mountCannonSim: function(el, isCalc, onWin, onLose) {
      this.mountBallisticsLab(el, { angle: 53, v0: 25.0, photogateX: 30.0, isCalculus: isCalc });
    },
    mountDriftSim: function(el, isCalc, onWin, onLose) {
      this.mountFrictionLab(el, { m: 2.0, vA: 12.0, L: 8.0, mu: 0.35, isCalculus: isCalc });
    },
    mountCoasterSim: function(el, isCalc, onWin, onLose) {
      this.mountCentripetalLab(el, { m: 1.5, H: 45.0, R: 15.0, isCalculus: isCalc });
    },
    mountHarmonicSim: function(el, isCalc, onWin, onLose) {
      this.mountHarmonicLab(el, { m: 2.5, k: 160.0, x0: 0.20, isCalculus: isCalc });
    },
    mountTorqueSim: function(el, isCalc, onWin, onLose) {
      this.mountTorqueLab(el, { L: 6.0, Mbeam: 8.0, xFulcrum: 2.0, m1: 12.0, m2: 4.0, isCalculus: isCalc });
    }
  };
})();
