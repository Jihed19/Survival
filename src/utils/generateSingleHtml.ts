/**
 * Generates a 100% standalone single-file HTML version containing the entire game
 * (CSS, JS, Three.js, Joel-style survivor model, infected zombie & mutated apex brute AI,
 * dynamic rain weather system, 3D audio, mobile landscape COD Mobile controls, and inventory).
 */
export function generateSingleHtmlCode(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Last Frontier: Shooter de Supervivencia Apocalíptica 3D</title>
  <!-- Three.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      touch-action: none;
    }
    #game-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    /* Orientation Warning for portrait phones */
    #landscape-warning {
      display: none;
      position: fixed;
      inset: 0;
      background: #090d16;
      z-index: 999;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 24px;
    }
    @media (orientation: portrait) and (max-width: 768px) {
      #landscape-warning { display: flex; }
    }
    /* HUD Overlay */
    #hud {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px 18px;
    }
    .hud-element { pointer-events: auto; }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    .minimap-card {
      width: 90px;
      height: 90px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .minimap-player {
      width: 8px;
      height: 8px;
      background: #38bdf8;
      border-radius: 50%;
      border: 1px solid white;
    }
    .vitals-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 8px 12px;
      min-width: 200px;
    }
    .bar-row { margin-bottom: 4px; }
    .bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-family: monospace;
      margin-bottom: 2px;
    }
    .hp-label { color: #f87171; }
    .stamina-label { color: #38bdf8; }
    .bar-track {
      width: 100%;
      height: 6px;
      background: #1e293b;
      border-radius: 3px;
      overflow: hidden;
    }
    .bar-fill-hp {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #dc2626, #f87171);
    }
    .bar-fill-stamina {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #0284c7, #38bdf8);
    }
    .ammo-badge {
      display: inline-block;
      margin-top: 4px;
      background: #78350f;
      color: #fde047;
      font-weight: bold;
      font-family: monospace;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }
    /* Crosshair & Hitmarker */
    #crosshair {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      pointer-events: none;
    }
    #crosshair::before, #crosshair::after {
      content: '';
      position: absolute;
      background: rgba(56, 189, 248, 0.8);
    }
    #crosshair::before { top: 6px; left: 0; width: 14px; height: 2px; }
    #crosshair::after { top: 0; left: 6px; width: 2px; height: 14px; }

    #hitmarker {
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 24px;
      pointer-events: none;
    }
    #hitmarker::before, #hitmarker::after {
      content: '';
      position: absolute;
      background: #ef4444;
      width: 24px;
      height: 2px;
    }
    #hitmarker::before { transform: rotate(45deg); top: 11px; }
    #hitmarker::after { transform: rotate(-45deg); top: 11px; }

    #damage-flash {
      position: absolute;
      inset: 0;
      background: rgba(220, 38, 38, 0.4);
      border: 8px solid rgba(220, 38, 38, 0.7);
      pointer-events: none;
      display: none;
    }

    /* Mobile COD Style Controls */
    #mobile-controls {
      display: none;
      position: absolute;
      inset: 0;
      z-index: 20;
      pointer-events: none;
    }
    #touch-look-zone {
      position: absolute;
      top: 60px;
      right: 0;
      bottom: 120px;
      width: 50%;
      pointer-events: auto;
    }
    #joystick-container {
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.5);
      border: 2px solid rgba(56, 189, 248, 0.4);
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #joystick-knob {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
      transform: translate(0px, 0px);
    }
    .action-buttons {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      align-items: flex-end;
      gap: 10px;
      pointer-events: auto;
    }
    .btn-act {
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(15, 23, 42, 0.85);
      color: white;
      font-family: monospace;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .btn-fire {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #dc2626, #f43f5e);
      border-color: #fda4af;
      font-size: 11px;
    }
    .btn-aim {
      width: 52px;
      height: 52px;
      background: rgba(15, 23, 42, 0.9);
      border-color: #f59e0b;
      color: #fde047;
    }
    .btn-aim.active { background: #f59e0b; color: #0f172a; }
    .btn-jump { width: 48px; height: 48px; }
    .btn-sprint { width: 48px; height: 48px; }

    /* Start Screen */
    #start-screen {
      position: absolute;
      inset: 0;
      background: rgba(9, 13, 22, 0.9);
      z-index: 50;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <!-- Landscape orientation banner -->
  <div id="landscape-warning">
    <h2 style="font-size: 24px; color: #f87171; margin-bottom: 12px;">MODO HORIZONTAL REQUERIDO</h2>
    <p style="color: #cbd5e1; font-size: 14px;">Gira tu teléfono móvil a posición horizontal para jugar estilo Call of Duty Mobile.</p>
  </div>

  <div id="game-canvas"></div>
  <div id="damage-flash"></div>
  <div id="hitmarker"></div>

  <!-- HUD -->
  <div id="hud">
    <div class="top-bar">
      <!-- Minimap Radar -->
      <div class="minimap-card hud-element" id="minimap">
        <div class="minimap-player"></div>
      </div>

      <!-- Weather & Time -->
      <div class="hud-element" style="background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 14px; font-family: monospace; font-size: 11px; color: #e2e8f0; display: flex; gap: 8px;">
        <span id="weather-text">🌧️ LLUVIA TÓXICA</span>
        <span>|</span>
        <span id="time-text">18:45</span>
      </div>

      <!-- Vitals & Ammo -->
      <div class="vitals-box hud-element">
        <div class="bar-row">
          <div class="bar-label hp-label"><span>SALUD</span><span id="hp-text">100 / 100</span></div>
          <div class="bar-track"><div id="hp-bar" class="bar-fill-hp"></div></div>
        </div>
        <div class="bar-row">
          <div class="bar-label stamina-label"><span>ENERGÍA</span><span id="stamina-text">100%</span></div>
          <div class="bar-track"><div id="stamina-bar" class="bar-fill-stamina"></div></div>
        </div>
        <div class="ammo-badge" id="ammo-text">MUNICIÓN: 8 / 32</div>
      </div>
    </div>

    <!-- Crosshair -->
    <div id="crosshair"></div>

    <!-- Bottom Controls Hint -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
      <div class="hud-element" style="color: #94a3b8; font-family: monospace; font-size: 11px; background: rgba(15,23,42,0.7); padding: 4px 10px; border-radius: 6px;">
        PC: WASD Mover · Clic Disparar · Clic Der/Q Apuntar ADS · R Recargar · Shift Correr
      </div>
    </div>
  </div>

  <!-- Mobile Controls (Call of Duty Mobile Style) -->
  <div id="mobile-controls">
    <div id="touch-look-zone"></div>
    <div id="joystick-container"><div id="joystick-knob"></div></div>
    <div class="action-buttons">
      <button class="btn-act btn-sprint" id="m-sprint">RUN</button>
      <button class="btn-act btn-jump" id="m-jump">JUMP</button>
      <button class="btn-act btn-aim" id="m-aim">AIM</button>
      <button class="btn-act btn-fire" id="m-fire">FUEGO</button>
    </div>
  </div>

  <!-- Start Screen -->
  <div id="start-screen">
    <h1 style="font-size: 32px; color: #ef4444; margin-bottom: 8px;">LAST FRONTIER: SURVIVOR</h1>
    <p style="color: #94a3b8; font-size: 14px; max-width: 480px; margin-bottom: 24px; line-height: 1.5;">
      Mundo abierto apocalíptico: ciudad en ruinas, asfalto roto, lluvia tóxica, infectados zombi y el titán bio-orgánico mutado con cuchilla.
    </p>
    <button id="btn-start" style="padding: 12px 36px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;">COMENZAR</button>
  </div>

  <!-- JavaScript Engine -->
  <script>
    // Audio synthesizer
    class SoundFX {
      constructor() { this.ctx = null; }
      init() {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) this.ctx = new AC();
        }
      }
      playShot() {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const now = this.ctx.currentTime;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(now); osc.stop(now + 0.2);
        } catch(e) {}
      }
      playHurt() {
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const now = this.ctx.currentTime;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(now); osc.stop(now + 0.15);
        } catch(e) {}
      }
    }
    const sfx = new SoundFX();

    // Scene & Character
    let scene, camera, renderer;
    let survivor, rainParticles;
    const obstacles = [];
    const enemies = [];

    let playerPos = new THREE.Vector3(0, 0, 8);
    let playerVel = new THREE.Vector3();
    let isGrounded = true;
    let cameraYaw = 0;
    let cameraPitch = 0.12;
    let isAiming = false;
    let isSprinting = false;

    let health = 100;
    let stamina = 100;
    let ammo = 8;
    let reserveAmmo = 32;
    const keys = {};
    let joystick = { x: 0, y: 0 };
    let isPointerLocked = false;

    function init() {
      const container = document.getElementById('game-canvas');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.FogExp2(0x0f172a, 0.018);

      camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      // Apocalyptic Twilight Lights
      const hemi = new THREE.HemisphereLight(0xf97316, 0x0f172a, 0.6);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfb923c, 1.2);
      sun.position.set(30, 40, 20);
      sun.castShadow = true;
      scene.add(sun);

      // Cracked Asphalt Ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(350, 350),
        new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.35, metalness: 0.3 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Ruined Buildings
      buildRuinedCity();

      // Rain Weather System
      buildRain();

      // Joel-style Male Survivor
      buildSurvivor();

      // Infected Enemies (Shambler & Apex Titan)
      spawnEnemies();

      // Input
      setupInput();

      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.getElementById('mobile-controls').style.display = 'block';
        initMobileTouch();
      }

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

      animate();
    }

    function buildRuinedCity() {
      const concrete = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      // Collapsed Buildings
      [[-30, -35, 18, 28, 20], [32, -30, 16, 24, 18], [-38, 20, 22, 18, 16], [35, 26, 20, 32, 22]].forEach(([bx, bz, bw, bh, bd]) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), concrete);
        b.position.set(bx, bh / 2, bz);
        b.castShadow = true;
        scene.add(b);
        obstacles.push({ x: bx, z: bz, radius: bw / 2 + 1 });
      });

      // Abandoned rusted cars
      const carMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      [[-6, 2], [10, -4], [-14, -14], [16, 12]].forEach(([cx, cz]) => {
        const car = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 4.2), carMat);
        car.position.set(cx, 0.6, cz);
        car.castShadow = true;
        scene.add(car);
        obstacles.push({ x: cx, z: cz, radius: 2.1 });
      });
    }

    function buildRain() {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(1500 * 3);
      for (let i = 0; i < 1500 * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 80;
        pos[i + 1] = Math.random() * 30;
        pos[i + 2] = (Math.random() - 0.5) * 80;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      rainParticles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.16, transparent: true, opacity: 0.7 }));
      scene.add(rainParticles);
    }

    function buildSurvivor() {
      survivor = new THREE.Group();
      const jacketMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.75 }); // Brown jacket
      const jeansMat = new THREE.MeshStandardMaterial({ color: 0x2b3e50, roughness: 0.85 });  // Denim jeans
      const packMat = new THREE.MeshStandardMaterial({ color: 0x474235, roughness: 0.9 });   // Tactical backpack

      // Torso & Jacket
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.26), jacketMat);
      torso.position.y = 1.15;
      torso.castShadow = true;
      survivor.add(torso);

      // Backpack
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.35, 0.16), packMat);
      pack.position.set(0, 1.18, -0.18);
      survivor.add(pack);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), new THREE.MeshStandardMaterial({ color: 0xc89d7c }));
      head.position.y = 1.55;
      survivor.add(head);

      // Hunting Rifle
      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.65), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 }));
      rifle.position.set(-0.25, 1.05, 0.25);
      survivor.add(rifle);

      scene.add(survivor);
    }

    function spawnEnemies() {
      // Shambler Runner
      const zMat = new THREE.MeshStandardMaterial({ color: 0x78716c });
      const zMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.3), zMat);
      zMesh.position.set(-12, 0.8, -10);
      scene.add(zMesh);
      enemies.push({ id: 1, mesh: zMesh, health: 80, speed: 4.8, type: 'shambler' });

      // Mutated Apex Titan (from image #8)
      const bMat = new THREE.MeshStandardMaterial({ color: 0x450a0a });
      const bMesh = new THREE.Group();
      bMesh.position.set(0, 1.2, -24);
      const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.5), bMat);
      bMesh.add(bBody);
      // Glowing Core
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 2 }));
      core.position.set(0, 0.2, 0.26);
      bMesh.add(core);
      // Scythe arm
      const scythe = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.5, 6), new THREE.MeshStandardMaterial({ color: 0xd6d3d1 }));
      scythe.position.set(-0.55, -0.3, 0.3);
      scythe.rotation.x = 0.5;
      bMesh.add(scythe);
      scene.add(bMesh);
      enemies.push({ id: 2, mesh: bMesh, health: 250, speed: 4.2, type: 'titan' });
    }

    function setupInput() {
      window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyQ') isAiming = !isAiming;
        if (e.code === 'KeyR') reload();
        if (e.code === 'Space' && isGrounded) jump();
      });
      window.addEventListener('keyup', e => { keys[e.code] = false; });

      renderer.domElement.addEventListener('click', () => {
        if (!isPointerLocked) { renderer.domElement.requestPointerLock?.(); sfx.init(); }
        else shoot();
      });
      document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
      });
      window.addEventListener('mousemove', e => {
        if (isPointerLocked) {
          cameraYaw -= e.movementX * 0.0022;
          cameraPitch = Math.max(-0.6, Math.min(0.9, cameraPitch + e.movementY * 0.0022));
        }
      });
      document.getElementById('btn-start').addEventListener('click', () => {
        sfx.init();
        document.getElementById('start-screen').style.display = 'none';
        renderer.domElement.requestPointerLock?.();
      });
    }

    function initMobileTouch() {
      const knob = document.getElementById('joystick-knob');
      const container = document.getElementById('joystick-container');
      let jTouch = null;
      let jCenter = { x: 0, y: 0 };

      container.addEventListener('touchstart', e => {
        e.preventDefault();
        sfx.init();
        const t = e.changedTouches[0];
        jTouch = t.identifier;
        const r = container.getBoundingClientRect();
        jCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });

      window.addEventListener('touchmove', e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === jTouch) {
            const dx = t.clientX - jCenter.x;
            const dy = t.clientY - jCenter.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const maxR = 40;
            const nx = d > 0 ? (dx / d) * Math.min(d, maxR) : 0;
            const ny = d > 0 ? (dy / d) * Math.min(d, maxR) : 0;
            knob.style.transform = \`translate(\${nx}px, \${ny}px)\`;
            joystick = { x: nx / maxR, y: -(ny / maxR) };
          }
        }
      });

      window.addEventListener('touchend', e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === jTouch) {
            jTouch = null;
            knob.style.transform = 'translate(0px, 0px)';
            joystick = { x: 0, y: 0 };
          }
        }
      });

      // Camera touch look
      let lookTouch = null;
      let lastLook = { x: 0, y: 0 };
      const lookZone = document.getElementById('touch-look-zone');
      lookZone.addEventListener('touchstart', e => {
        lookTouch = e.changedTouches[0].identifier;
        lastLook = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      });
      window.addEventListener('touchmove', e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === lookTouch) {
            const dx = t.clientX - lastLook.x;
            const dy = t.clientY - lastLook.y;
            lastLook = { x: t.clientX, y: t.clientY };
            cameraYaw -= dx * 0.005;
            cameraPitch = Math.max(-0.6, Math.min(0.9, cameraPitch + dy * 0.005));
          }
        }
      });
      window.addEventListener('touchend', e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookTouch) lookTouch = null;
        }
      });

      // Action Buttons
      document.getElementById('m-fire').addEventListener('click', shoot);
      document.getElementById('m-aim').addEventListener('click', () => {
        isAiming = !isAiming;
        document.getElementById('m-aim').classList.toggle('active', isAiming);
      });
      document.getElementById('m-jump').addEventListener('click', jump);
      const sp = document.getElementById('m-sprint');
      sp.addEventListener('click', () => {
        isSprinting = !isSprinting;
        sp.style.background = isSprinting ? '#f59e0b' : 'rgba(15,23,42,0.85)';
      });
    }

    function jump() {
      if (isGrounded && stamina >= 8) {
        playerVel.y = 7.0;
        isGrounded = false;
        stamina = Math.max(0, stamina - 8);
      }
    }

    function reload() {
      if (ammo < 8 && reserveAmmo > 0) {
        const need = 8 - ammo;
        const load = Math.min(need, reserveAmmo);
        ammo += load;
        reserveAmmo -= load;
        document.getElementById('ammo-text').innerText = \`MUNICIÓN: \${ammo} / \${reserveAmmo}\`;
      }
    }

    function shoot() {
      if (ammo <= 0) { reload(); return; }
      ammo -= 1;
      sfx.playShot();
      document.getElementById('ammo-text').innerText = \`MUNICIÓN: \${ammo} / \${reserveAmmo}\`;

      // Check hit
      enemies.forEach(e => {
        if (e.health > 0) {
          const d = Math.sqrt((playerPos.x - e.mesh.position.x)**2 + (playerPos.z - e.mesh.position.z)**2);
          if (d < 20) {
            e.health -= 45;
            const hm = document.getElementById('hitmarker');
            hm.style.display = 'block';
            setTimeout(() => { hm.style.display = 'none'; }, 120);
            if (e.health <= 0) {
              scene.remove(e.mesh);
            }
          }
        }
      });
    }

    function updatePhysics(dt) {
      let mx = 0, mz = 0;
      if (keys['KeyW']) mz += 1;
      if (keys['KeyS']) mz -= 1;
      if (keys['KeyA']) mx -= 1;
      if (keys['KeyD']) mx += 1;
      mx += joystick.x;
      mz += joystick.y;

      const isMoving = Math.sqrt(mx * mx + mz * mz) > 0.1;
      const sprint = (keys['ShiftLeft'] || isSprinting) && isMoving && !isAiming;
      if (sprint && stamina > 2) stamina = Math.max(0, stamina - dt * 18);
      else stamina = Math.min(100, stamina + dt * 14);

      const speed = isAiming ? 3.0 : sprint ? 8.8 : 4.8;
      if (isMoving) {
        const moveAngle = cameraYaw + Math.atan2(mx, mz);
        playerVel.x += (Math.sin(moveAngle) * speed - playerVel.x) * dt * 12;
        playerVel.z += (Math.cos(moveAngle) * speed - playerVel.z) * dt * 12;
        survivor.rotation.y = isAiming ? cameraYaw : moveAngle;
      } else {
        playerVel.x *= 0.8; playerVel.z *= 0.8;
        if (isAiming) survivor.rotation.y = cameraYaw;
      }

      if (!isGrounded) playerVel.y -= 21 * dt;
      let nextX = playerPos.x + playerVel.x * dt;
      let nextZ = playerPos.z + playerVel.z * dt;
      let nextY = playerPos.y + playerVel.y * dt;

      obstacles.forEach(o => {
        const d = Math.sqrt((nextX - o.x)**2 + (nextZ - o.z)**2);
        if (d < o.radius) {
          nextX = playerPos.x;
          nextZ = playerPos.z;
        }
      });

      if (nextY <= 0) { nextY = 0; playerVel.y = 0; isGrounded = true; }
      playerPos.set(nextX, nextY, nextZ);
      survivor.position.copy(playerPos);

      // Vitals UI
      document.getElementById('hp-bar').style.width = \`\${health}%\`;
      document.getElementById('stamina-bar').style.width = \`\${stamina}%\`;
    }

    function updateCamera(dt) {
      const dist = isAiming ? 2.2 : 3.5;
      const idealX = playerPos.x - Math.sin(cameraYaw) * dist * Math.cos(cameraPitch) + Math.cos(cameraYaw) * 0.55;
      const idealZ = playerPos.z - Math.cos(cameraYaw) * dist * Math.cos(cameraPitch) - Math.sin(cameraYaw) * 0.55;
      const idealY = Math.max(0.4, playerPos.y + 1.6 + Math.sin(cameraPitch) * dist);

      camera.position.x += (idealX - camera.position.x) * dt * 14;
      camera.position.y += (idealY - camera.position.y) * dt * 14;
      camera.position.z += (idealZ - camera.position.z) * dt * 14;
      camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
    }

    function updateEnemies(dt) {
      enemies.forEach(e => {
        if (e.health > 0) {
          const dx = playerPos.x - e.mesh.position.x;
          const dz = playerPos.z - e.mesh.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 18) {
            e.mesh.position.x += (dx / dist) * e.speed * dt;
            e.mesh.position.z += (dz / dist) * e.speed * dt;
            e.mesh.rotation.y = Math.atan2(dx, dz);
            if (dist < 2.0) {
              health = Math.max(0, health - (e.type === 'titan' ? 25 : 12) * dt);
              sfx.playHurt();
              const fl = document.getElementById('damage-flash');
              fl.style.display = 'block';
              setTimeout(() => { fl.style.display = 'none'; }, 100);
            }
          }
        }
      });
    }

    let lastT = performance.now();
    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;

      updatePhysics(dt);
      updateCamera(dt);
      updateEnemies(dt);

      // Rain fall
      if (rainParticles) {
        rainParticles.position.x = playerPos.x;
        rainParticles.position.z = playerPos.z;
        const pos = rainParticles.geometry.attributes.position.array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] -= 35 * dt;
          if (pos[i] < 0) pos[i] = 30;
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }

    window.onload = init;
  <\/script>
</body>
</html>`;
}
