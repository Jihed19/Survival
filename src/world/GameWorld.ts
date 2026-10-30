import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PostApocCharacter } from './PostApocCharacter';
import { RuinedCityEnvironment } from './RuinedCityEnvironment';
import { CollectiblesManager } from './Collectibles';
import { InfectedEnemy } from './InfectedEnemy';
import { DayNightCycle } from './DayNightCycle';
import { WeatherSystem } from './WeatherSystem';
import { SpatialAudioManager } from '../audio/SpatialAudioManager';
import { CollectibleItem, PlayerStats, CameraViewMode, EnemyInfo, TimeState, WeatherState, ShelterInfo } from '../types/game';
import { sounds } from '../audio/SoundEffects';

export interface GameWorldCallbacks {
  onNearbyItemChange: (item: CollectibleItem | null) => void;
  onItemCollected: (item: CollectibleItem) => void;
  onPlayerStatsChange: (stats: PlayerStats) => void;
  onViewModeChange?: (mode: CameraViewMode) => void;
  onEnemyInfoChange?: (enemies: EnemyInfo[]) => void;
  onTimeChange?: (time: TimeState) => void;
  onWeatherChange?: (weather: WeatherState) => void;
  onSheltersUpdate?: (shelters: ShelterInfo[]) => void;
  onShelterDiscovered?: (shelter: ShelterInfo) => void;
  onPlayerPositionChange?: (pos: [number, number, number], heading: number) => void;
  onPlayerDamaged?: () => void;
  onHitEnemy?: () => void;
}

export class GameWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public character: PostApocCharacter;
  public environment: RuinedCityEnvironment;
  public collectibles: CollectiblesManager;
  public enemies: InfectedEnemy[] = [];
  public dayNight: DayNightCycle;
  public weather: WeatherSystem;
  public spatialAudio: SpatialAudioManager;

  // Fortified Shelters & Safe Havens
  public shelters: ShelterInfo[] = [
    {
      id: 'shelter_bunker_alfa',
      name: 'Búnker Subterráneo Alfa',
      description: 'Refugio acorazado con compuerta hermética, baliza verde y suministros militares.',
      position: [-28, 0, 22],
      discovered: false,
      type: 'bunker',
      distanceToPlayer: 0,
    },
    {
      id: 'shelter_watchtower_north',
      name: 'Puesto de Vigía Norte',
      description: 'Torre de observación elevada con reflector de búsqueda y vista panorámica.',
      position: [24, 0, -32],
      discovered: false,
      type: 'outpost',
      distanceToPlayer: 0,
    },
    {
      id: 'shelter_medical_warehouse',
      name: 'Almacén Médico Sanitario',
      description: 'Farmacia fortificada con cruz roja, antibióticos y kits de primeros auxilios.',
      position: [-28, 0, -24],
      discovered: false,
      type: 'warehouse',
      distanceToPlayer: 0,
    },
  ];

  // View state
  public viewMode: CameraViewMode = 'third_person';
  private cameraYaw: number = 0;
  private cameraPitch: number = 0.12;

  // Player physical state
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 8);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private isGrounded: boolean = true;
  private isMoving: boolean = false;
  private isSprinting: boolean = false;
  public isAiming: boolean = false;
  private playerHeading: number = 0;

  // Shooter stats
  public health: number = 100;
  public maxHealth: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;
  public ammo: number = 8;
  public maxAmmo: number = 8;
  public reserveAmmo: number = 32;
  public kills: number = 0;

  // Shooting & Recoil
  private fireCooldown: number = 0;
  private shakeIntensity: number = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  public touchSprinting: boolean = false;
  public touchJumping: boolean = false;
  public touchShooting: boolean = false;
  public touchAiming: boolean = false;
  public isPointerLocked: boolean = false;

  private isDestroyed: boolean = false;
  private clock: THREE.Clock;
  private frameId: number = 0;
  private callbacks: GameWorldCallbacks;
  private nearbyItem: CollectibleItem | null = null;
  private isSoftwareGl: boolean = false;

  constructor(container: HTMLElement, callbacks: GameWorldCallbacks) {
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Detect software WebGL guard
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Setup Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Studio Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Spatial Audio Manager (Attaches AudioListener to player camera)
    this.spatialAudio = new SpatialAudioManager(this.camera);

    // Day/Night Cycle (Apocalyptic Sunset / Twilight)
    this.dayNight = new DayNightCycle(this.scene, {
      onTimeChange: (timeState) => {
        if (this.callbacks.onTimeChange) {
          this.callbacks.onTimeChange(timeState);
        }
      },
    });

    // Ruined City Environment
    this.environment = new RuinedCityEnvironment(this.scene);

    // Dynamic Weather System (Heavy apocalyptic rain with reflections)
    this.weather = new WeatherSystem(this.scene, this.spatialAudio, this.environment.asphaltMesh);

    // Collectibles & Ammo Crates
    this.collectibles = new CollectiblesManager(this.scene);

    // Detailed Male Survivor (Joel style)
    this.character = new PostApocCharacter();
    this.character.mesh.position.copy(this.playerPos);
    this.scene.add(this.character.mesh);

    this.character.onFootstep = (sprinting) => {
      sounds.playFootstep(sprinting);
    };

    // Spawn Infected Enemies (Shamblers & Apex Brute)
    this.spawnEnemies();

    // Setup Event Listeners
    this.setupEventListeners();

    // Start Game Loop
    this.animate();
  }

  private spawnEnemies() {
    // 1. Shambler Runner in side alley
    const shambler1 = new InfectedEnemy(
      'infected_1',
      'infected_shambler',
      new THREE.Vector3(-12, 0, -8),
      [new THREE.Vector3(-12, 0, -8), new THREE.Vector3(-16, 0, 4), new THREE.Vector3(-8, 0, -18)],
      this.scene,
      this.spatialAudio,
      { onAttackPlayer: (dmg) => this.takeDamage(dmg) }
    );
    this.enemies.push(shambler1);

    // 2. Shambler Runner near abandoned trucks
    const shambler2 = new InfectedEnemy(
      'infected_2',
      'infected_shambler',
      new THREE.Vector3(14, 0, -6),
      [new THREE.Vector3(14, 0, -6), new THREE.Vector3(22, 0, -16), new THREE.Vector3(8, 0, -2)]
      ,this.scene,
      this.spatialAudio,
      { onAttackPlayer: (dmg) => this.takeDamage(dmg) }
    );
    this.enemies.push(shambler2);

    // 3. Mutated Apex Bio-Brute Titan (from image #8 with glowing core and scythe blade!)
    const apexBrute = new InfectedEnemy(
      'brute_apex',
      'mutated_brute',
      new THREE.Vector3(0, 0, -26),
      [new THREE.Vector3(0, 0, -26), new THREE.Vector3(12, 0, -32), new THREE.Vector3(-12, 0, -30)],
      this.scene,
      this.spatialAudio,
      { onAttackPlayer: (dmg) => this.takeDamage(dmg) }
    );
    this.enemies.push(apexBrute);

    // 4. Mutated Clicker (from image #4 with bloomed fungal head and spore clouds)
    const clicker = new InfectedEnemy(
      'clicker_1',
      'mutated_clicker',
      new THREE.Vector3(18, 0, 16),
      [new THREE.Vector3(18, 0, 16), new THREE.Vector3(26, 0, 6), new THREE.Vector3(10, 0, 24)],
      this.scene,
      this.spatialAudio,
      { onAttackPlayer: (dmg) => this.takeDamage(dmg) }
    );
    this.enemies.push(clicker);

    // 5. Agile Stalker (from image #6)
    const stalker = new InfectedEnemy(
      'stalker_1',
      'agile_stalker',
      new THREE.Vector3(-20, 0, -18),
      [new THREE.Vector3(-20, 0, -18), new THREE.Vector3(-26, 0, -6), new THREE.Vector3(-14, 0, -28)],
      this.scene,
      this.spatialAudio,
      { onAttackPlayer: (dmg) => this.takeDamage(dmg) }
    );
    this.enemies.push(stalker);
  }

  private setupEventListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.tryInteract();
      if (e.code === 'KeyV') this.toggleViewMode();
      if (e.code === 'KeyR') this.reloadWeapon();
      if (e.code === 'Space' && this.isGrounded) this.triggerJump();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click: Shoot
        if (this.isPointerLocked) {
          this.shootWeapon();
        } else {
          this.requestPointerLock();
        }
      } else if (e.button === 2) {
        // Right click: Aim ADS
        this.isAiming = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        this.isAiming = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // prevent right click context menu in game
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (this.isPointerLocked) {
        const sensitivity = this.isAiming ? 0.0014 : 0.0024;
        this.cameraYaw -= e.movementX * sensitivity;
        this.cameraPitch = THREE.MathUtils.clamp(
          this.cameraPitch + e.movementY * sensitivity,
          -Math.PI / 4,
          Math.PI / 3
        );
      }
    };

    const handlePointerLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    };

    const handleResize = () => {
      if (!this.renderer || !this.renderer.domElement.parentElement) return;
      const parent = this.renderer.domElement.parentElement;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('resize', handleResize);

    this.unbindListeners = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('resize', handleResize);
    };
  }

  private unbindListeners: () => void = () => {};

  public requestPointerLock() {
    try {
      this.spatialAudio.resume();
      this.renderer.domElement.requestPointerLock?.();
    } catch {}
  }

  public exitPointerLock() {
    try {
      if (document.pointerLockElement) document.exitPointerLock?.();
    } catch {}
  }

  public toggleViewMode() {
    this.viewMode = this.viewMode === 'third_person' ? 'first_person' : 'third_person';
    if (this.callbacks.onViewModeChange) {
      this.callbacks.onViewModeChange(this.viewMode);
    }
    sounds.playClick();
  }

  public triggerJump() {
    if (this.isGrounded && this.stamina >= 8) {
      this.playerVelocity.y = 7.0;
      this.isGrounded = false;
      this.stamina = Math.max(0, this.stamina - 8);
      sounds.playJump();
    }
  }

  public shootWeapon() {
    if (this.ammo <= 0) {
      this.reloadWeapon();
      return;
    }

    if (this.fireCooldown > 0) return;
    this.fireCooldown = 0.35; // Fire rate limit

    this.ammo -= 1;
    this.character.triggerRecoil();
    this.spatialAudio.playGunshot();
    this.shakeIntensity = 0.25;

    // Bullet Raycast Hitscan from camera center forward
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const hitEnemies = this.enemies.filter((e) => e.state !== 'DEAD');
    for (const enemy of hitEnemies) {
      const dist = raycaster.ray.distanceToPoint(enemy.position);
      if (dist < (enemy.type === 'mutated_brute' ? 1.6 : 0.9)) {
        // Hit!
        const damage = 45;
        enemy.takeDamage(damage);

        if (this.callbacks.onHitEnemy) {
          this.callbacks.onHitEnemy();
        }

        if (enemy.health <= 0) {
          this.kills += 1;
        }
        break;
      }
    }

    this.notifyStats();
  }

  public reloadWeapon() {
    if (this.reserveAmmo <= 0 || this.ammo >= this.maxAmmo) return;
    const needed = this.maxAmmo - this.ammo;
    const toLoad = Math.min(needed, this.reserveAmmo);
    this.ammo += toLoad;
    this.reserveAmmo -= toLoad;
    this.spatialAudio.playReload();
    this.notifyStats();
  }

  public tryInteract() {
    if (this.nearbyItem) {
      const collected = this.collectibles.collectItem(this.nearbyItem.id);
      if (collected) {
        sounds.playPickup();

        // If ammo crate, add reserve ammo
        if (collected.category === 'ammo' || collected.modelType === 'crate') {
          this.reserveAmmo = Math.min(80, this.reserveAmmo + 16);
        }

        this.callbacks.onItemCollected(collected);
        this.nearbyItem = null;
        this.callbacks.onNearbyItemChange(null);
        this.notifyStats();
      }
    }
  }

  public rotateCameraTouch(deltaX: number, deltaY: number) {
    const sensitivity = this.isAiming ? 0.0022 : 0.004;
    this.cameraYaw -= deltaX * sensitivity;
    this.cameraPitch = THREE.MathUtils.clamp(
      this.cameraPitch + deltaY * sensitivity,
      -Math.PI / 4,
      Math.PI / 3
    );
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.shakeIntensity = 0.45;
    sounds.playPlayerHurt();

    if (this.callbacks.onPlayerDamaged) {
      this.callbacks.onPlayerDamaged();
    }
    this.notifyStats();
  }

  public dropItem(item: CollectibleItem) {
    const forwardX = Math.sin(this.cameraYaw) * 1.8;
    const forwardZ = Math.cos(this.cameraYaw) * 1.8;

    const newItem: CollectibleItem = {
      ...item,
      id: `dropped_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      position: [this.playerPos.x + forwardX, 0.35, this.playerPos.z + forwardZ],
      collected: false,
    };

    this.collectibles.addItem(newItem);
    sounds.playClick();
  }

  public useItem(item: CollectibleItem) {
    if (item.category === 'medical') {
      this.health = Math.min(this.maxHealth, this.health + (item.stats?.healAmount || 30));
      sounds.playHeal();
    } else if (item.category === 'energy') {
      this.stamina = this.maxStamina;
      sounds.playPickup();
    }
    this.notifyStats();
  }

  private updatePlayerMovement(delta: number) {
    this.fireCooldown = Math.max(0, this.fireCooldown - delta);

    // Aim ADS toggle (Touch or key)
    this.isAiming = this.keys['KeyQ'] || this.isAiming || this.touchAiming;

    if (this.touchShooting) {
      this.shootWeapon();
    }

    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Mobile joystick input
    if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
      moveX += this.joystickVector.x;
      moveZ += this.joystickVector.y;
    }

    const inputMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
    this.isMoving = inputMag > 0.1;

    // Sprinting (disabled while aiming ADS)
    const sprintRequested = (this.keys['ShiftLeft'] || this.touchSprinting) && this.isMoving && !this.isAiming;
    if (sprintRequested && this.stamina > 2) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - delta * 18);
    } else {
      this.isSprinting = false;
      if (this.stamina < this.maxStamina) {
        this.stamina = Math.min(this.maxStamina, this.stamina + delta * 14);
      }
    }

    if (this.touchJumping) {
      this.triggerJump();
    }

    // Speed calculation (ADS slows to 3.2 m/s for precision)
    const baseSpeed = this.isAiming ? 3.2 : this.isSprinting ? 8.8 : 4.8;
    const speed = baseSpeed * Math.min(inputMag, 1.0);

    if (this.isMoving) {
      const inputAngle = Math.atan2(moveX, moveZ);
      const moveAngle = this.cameraYaw + inputAngle;

      this.playerVelocity.x = THREE.MathUtils.damp(
        this.playerVelocity.x,
        Math.sin(moveAngle) * speed,
        14,
        delta
      );
      this.playerVelocity.z = THREE.MathUtils.damp(
        this.playerVelocity.z,
        Math.cos(moveAngle) * speed,
        14,
        delta
      );

      // Character faces camera direction when aiming, or travel direction when running
      const targetHeading = this.isAiming ? this.cameraYaw : moveAngle;
      this.playerHeading = THREE.MathUtils.damp(this.playerHeading, targetHeading, 16, delta);
      this.character.mesh.rotation.y = this.playerHeading;
    } else {
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, 16, delta);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, 16, delta);

      if (this.isAiming) {
        this.playerHeading = THREE.MathUtils.damp(this.playerHeading, this.cameraYaw, 16, delta);
        this.character.mesh.rotation.y = this.playerHeading;
      }
    }

    // Gravity
    if (!this.isGrounded) {
      this.playerVelocity.y -= 21 * delta;
    }

    const nextX = this.playerPos.x + this.playerVelocity.x * delta;
    const nextZ = this.playerPos.z + this.playerVelocity.z * delta;
    const nextY = this.playerPos.y + this.playerVelocity.y * delta;

    // Obstacle collisions
    let resolvedX = nextX;
    let resolvedZ = nextZ;
    const playerRadius = 0.45;

    for (const obs of this.environment.obstacles) {
      const dx = resolvedX - obs.x;
      const dz = resolvedZ - obs.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = playerRadius + obs.radius;

      if (dist < minDist && dist > 0.001) {
        const overlap = minDist - dist;
        resolvedX += (dx / dist) * overlap;
        resolvedZ += (dz / dist) * overlap;
      }
    }

    if (nextY <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    } else {
      this.playerPos.y = nextY;
      this.isGrounded = false;
    }

    this.playerPos.x = resolvedX;
    this.playerPos.z = resolvedZ;
    this.character.mesh.position.copy(this.playerPos);

    // Update survivor animations
    this.character.update(
      delta,
      this.isMoving,
      this.isSprinting,
      this.isGrounded,
      this.isAiming,
      this.playerVelocity.y
    );

    this.notifyStats();
  }

  private notifyStats() {
    this.callbacks.onPlayerStatsChange({
      health: Math.round(this.health),
      maxHealth: this.maxHealth,
      stamina: Math.round(this.stamina),
      maxStamina: this.maxStamina,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
      reserveAmmo: this.reserveAmmo,
      isSprinting: this.isSprinting,
      isAiming: this.isAiming,
      isShooting: this.touchShooting,
      isMoving: this.isMoving,
      isGrounded: this.isGrounded,
      kills: this.kills,
      activeCharacter: this.character.activeGender,
    });
  }

  public setCharacterGender(gender: 'male' | 'female') {
    this.character.setGender(gender);
    this.notifyStats();
  }

  private updateCamera(delta: number) {
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 1.8);
    }

    // Third-person fixed over-the-right-shoulder camera with ADS zoom!
    const followDist = this.isAiming ? 2.1 : 3.5;
    const shoulderOffset = this.isAiming ? 0.65 : 0.52;
    const targetHeight = this.isAiming ? 1.55 : 1.65;

    const cosP = Math.cos(this.cameraPitch);
    const sinP = Math.sin(this.cameraPitch);
    const sinY = Math.sin(this.cameraYaw);
    const cosY = Math.cos(this.cameraYaw);

    const idealX = this.playerPos.x - sinY * followDist * cosP + cosY * shoulderOffset + shakeX;
    const idealZ = this.playerPos.z - cosY * followDist * cosP - sinY * shoulderOffset;
    const idealY = Math.max(0.4, this.playerPos.y + targetHeight + sinP * followDist + shakeY);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, idealX, 16, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, idealY, 16, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, idealZ, 16, delta);

    const lookTarget = new THREE.Vector3(
      this.playerPos.x + cosY * (shoulderOffset * 0.4),
      this.playerPos.y + targetHeight * 0.95,
      this.playerPos.z - sinY * (shoulderOffset * 0.4)
    );
    this.camera.lookAt(lookTarget);
  }

  private updateInteractions() {
    const nearby = this.collectibles.getNearbyItem(this.playerPos, 2.8);
    if (nearby !== this.nearbyItem) {
      this.nearbyItem = nearby;
      this.callbacks.onNearbyItemChange(nearby);
    }
  }

  private animate = () => {
    if (this.isDestroyed) return;

    const rawDt = this.clock.getDelta();
    const delta = Math.min(rawDt, 0.05);

    // 1. Celestial & Lighting Cycle
    this.dayNight.update(delta);

    // 2. Weather System (Rain Particles & Thunder)
    this.weather.update(delta, this.playerPos, this.dayNight.getTimeState().isNight);
    if (this.callbacks.onWeatherChange) {
      this.callbacks.onWeatherChange(this.weather.getWeatherState());
    }

    // 3. Player Movement & Physics
    this.updatePlayerMovement(delta);

    // 4. Smooth Camera Follow & ADS Zoom
    this.updateCamera(delta);

    // 5. Update Infected Enemies & Positional Audio
    for (const enemy of this.enemies) {
      enemy.update(delta, this.playerPos, this.environment.obstacles);
    }
    if (this.callbacks.onEnemyInfoChange) {
      this.callbacks.onEnemyInfoChange(this.enemies.map((e) => e.getInfo(this.playerPos)));
    }

    // 6. Collectibles Hover Bobbing
    this.collectibles.update(delta);

    // 7. Check Proximity Pickups
    this.updateInteractions();

    // 8. Update Shelters Proximity & Discovery
    for (const shelter of this.shelters) {
      const dx = this.playerPos.x - shelter.position[0];
      const dz = this.playerPos.z - shelter.position[2];
      shelter.distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

      if (!shelter.discovered && shelter.distanceToPlayer <= 26) {
        shelter.discovered = true;
        sounds.playPickup();
        if (this.callbacks.onShelterDiscovered) {
          this.callbacks.onShelterDiscovered(shelter);
        }
      }
    }
    if (this.callbacks.onSheltersUpdate) {
      this.callbacks.onSheltersUpdate([...this.shelters]);
    }

    if (this.callbacks.onPlayerPositionChange) {
      this.callbacks.onPlayerPositionChange(
        [this.playerPos.x, this.playerPos.y, this.playerPos.z],
        this.playerHeading
      );
    }

    // 9. Render Frame
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.animate);
  };

  public getCompassBearing(): number {
    let deg = Math.round((this.cameraYaw * 180) / Math.PI) % 360;
    if (deg < 0) deg += 360;
    return deg;
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    this.unbindListeners();
    this.exitPointerLock();

    try {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    } catch {}
  }
}
