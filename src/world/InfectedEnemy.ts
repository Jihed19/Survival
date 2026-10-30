import * as THREE from 'three';
import { EnemyState, EnemyType, EnemyInfo } from '../types/game';
import { CollisionObstacle } from './Environment';
import { SpatialAudioManager } from '../audio/SpatialAudioManager';

export interface InfectedCallbacks {
  onAttackPlayer?: (damage: number) => void;
  onStateChange?: (state: EnemyState) => void;
}

// Map enemy type to exact image render asset provided by the user
const ENEMY_ASSETS: Record<EnemyType, { path: string; name: string; width: number; height: number; health: number; speed: number; damage: number }> = {
  mutated_brute: {
    path: '/assets/aistudio/full_body_3d_character_render_of_an_advanced_terrifying_apex_bio_organic_weapon_3e7f0a9e.png',
    name: 'Tirano Apex Bio-Orgánico',
    width: 2.2,
    height: 2.85,
    health: 260,
    speed: 4.8,
    damage: 32,
  },
  mutated_clicker: {
    path: '/assets/aistudio/full_body_3d_character_render_of_a_horrifying_mutated_special_infected_enemy_800fc9f3.png',
    name: 'Chasqueador Fúngico Mutado',
    width: 1.45,
    height: 2.15,
    health: 120,
    speed: 6.0,
    damage: 22,
  },
  infected_shambler: {
    path: '/assets/aistudio/full_body_3d_character_render_of_a_horrifying_gritty_zombie_infected_enemy_from_f6d82b26.png',
    name: 'Infectado Caminante',
    width: 1.35,
    height: 2.0,
    health: 75,
    speed: 4.2,
    damage: 14,
  },
  agile_stalker: {
    path: '/assets/aistudio/full_body_3d_character_render_of_a_terrifying_agile_stalker_infected_enemy_from_4299417b.png',
    name: 'Acechador Viral Ágil',
    width: 1.4,
    height: 1.95,
    health: 90,
    speed: 6.4,
    damage: 18,
  },
};

/**
 * High-Fidelity 3D Infected Enemy using the user's authentic renders.
 * Built with dual-plane volumetric texturing, dynamic lighting, contact shadow,
 * hit reaction flashes, and 3D spatial audio localization.
 */
export class InfectedEnemy {
  public mesh: THREE.Group;
  public id: string;
  public name: string;
  public type: EnemyType;
  public state: EnemyState = 'PATROL';
  public health: number;
  public maxHealth: number;

  public position: THREE.Vector3;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private heading: number = 0;
  private animTime: number = Math.random() * 10;
  private attackCooldown: number = 0;
  private groanCooldown: number = 2 + Math.random() * 5;
  private hitFlashTimer: number = 0;

  // Visual Meshes & Materials
  private visualGroup: THREE.Group;
  private mainMat: THREE.MeshStandardMaterial;
  private coreLight?: THREE.PointLight;
  private shadowMesh: THREE.Mesh;

  // Waypoints for patrol
  private waypoints: THREE.Vector3[];
  private currentWaypointIdx: number = 0;

  // Positional 3D Audio
  public positionalAudio: THREE.PositionalAudio;
  private audioManager: SpatialAudioManager;
  private callbacks: InfectedCallbacks;

  constructor(
    id: string,
    type: EnemyType,
    startPos: THREE.Vector3,
    waypoints: THREE.Vector3[],
    scene: THREE.Scene,
    audioManager: SpatialAudioManager,
    callbacks: InfectedCallbacks
  ) {
    this.id = id;
    this.type = type;
    this.audioManager = audioManager;
    this.callbacks = callbacks;
    this.waypoints = waypoints;
    this.position = startPos.clone();

    const def = ENEMY_ASSETS[type] || ENEMY_ASSETS.infected_shambler;
    this.name = def.name;
    this.maxHealth = def.health;
    this.health = def.health;

    this.mesh = new THREE.Group();
    this.mesh.name = `Infected_${id}`;
    this.mesh.position.copy(this.position);

    this.visualGroup = new THREE.Group();
    this.mesh.add(this.visualGroup);

    // 1. Load exact texture matching the user's uploaded art
    const textureLoader = new THREE.TextureLoader();
    const enemyTex = textureLoader.load(def.path);
    enemyTex.colorSpace = THREE.SRGBColorSpace;

    this.mainMat = new THREE.MeshStandardMaterial({
      map: enemyTex,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    // 2. High-Fidelity Multi-Plane 3D Mesh
    // Front plane
    const planeGeo = new THREE.PlaneGeometry(def.width, def.height);
    const frontPlane = new THREE.Mesh(planeGeo, this.mainMat);
    frontPlane.position.y = def.height / 2;
    frontPlane.castShadow = true;
    frontPlane.receiveShadow = true;
    this.visualGroup.add(frontPlane);

    // Cross-angle angled plane (gives full volumetric appearance without turning invisible from side angles)
    const crossPlane = new THREE.Mesh(planeGeo, this.mainMat);
    crossPlane.position.y = def.height / 2;
    crossPlane.rotation.y = Math.PI / 4;
    crossPlane.castShadow = true;
    this.visualGroup.add(crossPlane);

    // Second cross plane at opposite angle
    const crossPlane2 = new THREE.Mesh(planeGeo, this.mainMat);
    crossPlane2.position.y = def.height / 2;
    crossPlane2.rotation.y = -Math.PI / 4;
    crossPlane2.castShadow = true;
    this.visualGroup.add(crossPlane2);

    // 3. Special visual additions per enemy type
    if (type === 'mutated_brute') {
      // Bioluminescent glowing orange bio-core (Apex Titan from image #8!)
      const coreGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xf97316,
        emissiveIntensity: 3.0,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 1.45, 0.15);
      this.visualGroup.add(core);

      this.coreLight = new THREE.PointLight(0xf97316, 2.5, 9);
      this.coreLight.position.set(0, 1.45, 0.3);
      this.visualGroup.add(this.coreLight);
    } else if (type === 'mutated_clicker') {
      // Spore glow
      const sporeLight = new THREE.PointLight(0xeab308, 0.8, 4);
      sporeLight.position.set(0, 1.7, 0.2);
      this.visualGroup.add(sporeLight);
    }

    // 4. Attach Positional Audio to enemy mesh for 3D spatial sound localization
    this.positionalAudio = this.audioManager.attachPositionalAudio(
      this.mesh,
      type === 'mutated_brute' ? 12 : 7,
      type === 'mutated_brute' ? 55 : 35
    );

    // 5. Contact ground shadow
    const shadowGeo = new THREE.CircleGeometry(type === 'mutated_brute' ? 1.5 : 0.85, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    scene.add(this.shadowMesh);

    scene.add(this.mesh);
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.hitFlashTimer = 0.18;
    this.mainMat.emissive = new THREE.Color(0xff2222);
    this.mainMat.emissiveIntensity = 1.2;

    if (this.health <= 0) {
      this.state = 'DEAD';
      this.mesh.rotation.x = Math.PI / 2;
      this.mesh.position.y = 0.2;
      if (this.callbacks.onStateChange) this.callbacks.onStateChange('DEAD');
    } else {
      if (this.state === 'PATROL') {
        this.state = 'CHASE';
        if (this.callbacks.onStateChange) this.callbacks.onStateChange('CHASE');
      }
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, obstacles: CollisionObstacle[]) {
    if (this.state === 'DEAD') {
      this.shadowMesh.scale.set(0.6, 0.6, 0.6);
      return;
    }

    this.animTime += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.groanCooldown -= delta;

    // Hit Flash Decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.mainMat.emissive = new THREE.Color(0x000000);
        this.mainMat.emissiveIntensity = 0;
      }
    }

    // Periodic 3D positional ambient audio groan so player can track it by sound
    if (this.groanCooldown <= 0) {
      this.groanCooldown = 4.5 + Math.random() * 7;
      this.audioManager.playPositionalSound(
        this.positionalAudio,
        this.type === 'mutated_brute' ? 'brute' : 'groan'
      );
    }

    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    const aggroDist = this.type === 'mutated_brute' ? 24 : 18;
    const attackRange = this.type === 'mutated_brute' ? 2.6 : 1.9;

    // AI State Machine
    if (distToPlayer < aggroDist) {
      if (distToPlayer <= attackRange) {
        if (this.state !== 'ATTACK') {
          this.state = 'ATTACK';
          if (this.callbacks.onStateChange) this.callbacks.onStateChange('ATTACK');
        }
      } else {
        if (this.state !== 'CHASE') {
          this.state = 'CHASE';
          if (this.callbacks.onStateChange) this.callbacks.onStateChange('CHASE');
        }
      }
    } else if (distToPlayer > 32 && this.state !== 'PATROL') {
      this.state = 'PATROL';
      if (this.callbacks.onStateChange) this.callbacks.onStateChange('PATROL');
    }

    // Movement calculation
    let targetX = playerPos.x;
    let targetZ = playerPos.z;
    const def = ENEMY_ASSETS[this.type] || ENEMY_ASSETS.infected_shambler;
    let speed = def.speed;

    if (this.state === 'PATROL') {
      const wp = this.waypoints[this.currentWaypointIdx];
      targetX = wp.x;
      targetZ = wp.z;
      speed = def.speed * 0.45;
      const wpd = Math.sqrt((wp.x - this.position.x) ** 2 + (wp.z - this.position.z) ** 2);
      if (wpd < 2.0) {
        this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
      }
    }

    if (this.state === 'ATTACK') {
      speed = 0;
      if (this.attackCooldown <= 0) {
        this.executeAttack();
      }
    }

    if (speed > 0) {
      let mdx = targetX - this.position.x;
      let mdz = targetZ - this.position.z;
      const mDist = Math.sqrt(mdx * mdx + mdz * mdz);

      if (mDist > 0.001) {
        mdx /= mDist;
        mdz /= mDist;
      }

      // Avoid obstacles
      for (const obs of obstacles) {
        const ox = this.position.x - obs.x;
        const oz = this.position.z - obs.z;
        const oDist = Math.sqrt(ox * ox + oz * oz);
        const minDist = obs.radius + 1.2;
        if (oDist < minDist && oDist > 0.001) {
          const push = (minDist - oDist) / minDist;
          mdx += (ox / oDist) * push * 2;
          mdz += (oz / oDist) * push * 2;
        }
      }

      this.velocity.x = mdx * speed;
      this.velocity.z = mdz * speed;

      this.position.x += this.velocity.x * delta;
      this.position.z += this.velocity.z * delta;

      const targetAngle = Math.atan2(mdx, mdz);
      this.heading = THREE.MathUtils.damp(this.heading, targetAngle, 8, delta);
    } else {
      const targetAngle = Math.atan2(dx, dz);
      this.heading = THREE.MathUtils.damp(this.heading, targetAngle, 12, delta);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    // Contact shadow follows
    this.shadowMesh.position.set(this.position.x, 0.02, this.position.z);

    // Natural running / shambling animation bob
    const bobFreq = speed > 3 ? 8 : 4;
    const bob = Math.abs(Math.sin(this.animTime * bobFreq)) * 0.12;
    const tilt = Math.sin(this.animTime * bobFreq) * 0.08;
    this.visualGroup.position.y = bob;
    this.visualGroup.rotation.z = tilt;

    // Pulse core light for Titan Brute
    if (this.coreLight) {
      this.coreLight.intensity = 2.0 + Math.sin(this.animTime * 6) * 0.8;
    }
  }

  private executeAttack() {
    const def = ENEMY_ASSETS[this.type] || ENEMY_ASSETS.infected_shambler;
    this.attackCooldown = this.type === 'mutated_brute' ? 1.8 : 1.3;

    // Lunging attack visual jerk
    this.visualGroup.position.z = 0.45;
    setTimeout(() => {
      this.visualGroup.position.z = 0;
    }, 180);

    if (this.callbacks.onAttackPlayer) {
      this.callbacks.onAttackPlayer(def.damage);
    }
  }

  public getInfo(playerPos: THREE.Vector3): EnemyInfo {
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      state: this.state,
      health: this.health,
      maxHealth: this.maxHealth,
      position: [this.position.x, this.position.y, this.position.z],
      distanceToPlayer,
    };
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    scene.remove(this.shadowMesh);
  }
}
