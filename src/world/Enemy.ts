import * as THREE from 'three';
import { EnemyState, EnemyInfo } from '../types/game';
import { sounds } from '../audio/SoundEffects';
import { CollisionObstacle } from './Environment';

export interface EnemyCallbacks {
  onStateChange?: (state: EnemyState) => void;
  onAttackPlayer?: (damage: number) => void;
}

/**
 * Autonomous Cybernetic Sentinel Drone with Distinct Silhouette,
 * 3-12 Part Composite Procedural Mesh, and Proximity AI State Machine.
 */
export class SentinelEnemy {
  public mesh: THREE.Group;
  public state: EnemyState = 'PATROL';
  public health: number = 100;
  public maxHealth: number = 100;

  // Visual sub-parts
  private eyeMesh: THREE.Mesh;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private radarDish: THREE.Group;
  private thrusters: THREE.Group[] = [];
  private leftCannon: THREE.Mesh;
  private rightCannon: THREE.Mesh;
  private shadowMesh: THREE.Mesh;
  private repulsorRing: THREE.Mesh;

  // Waypoints for patrol
  private waypoints: THREE.Vector3[] = [
    new THREE.Vector3(14, 1.6, -8),
    new THREE.Vector3(24, 1.6, -18),
    new THREE.Vector3(12, 1.6, -26),
    new THREE.Vector3(-4, 1.6, -16),
  ];
  private currentWaypointIdx: number = 0;

  // AI & Movement
  public position: THREE.Vector3 = new THREE.Vector3(14, 1.6, -8);
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private heading: number = 0;
  private hoverTime: number = 0;
  private stateTimer: number = 0;
  private attackCooldown: number = 0;
  private hasTriggeredAlertSound: boolean = false;

  private callbacks: EnemyCallbacks;

  constructor(scene: THREE.Scene, callbacks: EnemyCallbacks) {
    this.callbacks = callbacks;
    this.mesh = new THREE.Group();
    this.mesh.name = 'SentinelEnemy';
    this.mesh.position.copy(this.position);

    // 1. Build Distinct 3D Procedural Model (Hover Combat Drone)
    // Core Chassis
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.9,
      roughness: 0.3,
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
    });

    // Eye Material (Starts Amber, turns glowing Crimson on alert/chase)
    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });

    // Main Central Octagonal/Spherical Hull
    const coreGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const coreMesh = new THREE.Mesh(coreGeo, armorMat);
    coreMesh.castShadow = true;
    this.mesh.add(coreMesh);

    // Angular Armored Shell Plates
    const plateGeo = new THREE.BoxGeometry(0.95, 0.35, 0.7);
    const plateMesh = new THREE.Mesh(plateGeo, darkMat);
    plateMesh.position.y = 0.05;
    plateMesh.castShadow = true;
    this.mesh.add(plateMesh);

    // Hazard stripe band across chassis
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 0.72), hazardMat);
    stripe.position.y = 0.12;
    this.mesh.add(stripe);

    // Cyclopean Sensor Eye (Front center)
    const eyeGeo = new THREE.SphereGeometry(0.2, 16, 16);
    this.eyeMesh = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.eyeMesh.position.set(0, 0.05, 0.45);
    this.mesh.add(this.eyeMesh);

    // Eye visor cowl
    const cowlGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 16);
    const cowl = new THREE.Mesh(cowlGeo, darkMat);
    cowl.position.set(0, 0.05, 0.42);
    this.mesh.add(cowl);

    // Rotating Radar Dish on top
    this.radarDish = new THREE.Group();
    this.radarDish.position.set(0, 0.55, -0.1);
    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), darkMat);
    this.radarDish.add(dishMast);
    const dishGeo = new THREE.CylinderGeometry(0.25, 0.05, 0.08, 8);
    const dish = new THREE.Mesh(dishGeo, armorMat);
    dish.position.y = 0.14;
    dish.rotation.x = 0.3;
    this.radarDish.add(dish);
    this.mesh.add(this.radarDish);

    // 4 Articulated Outrigger Thrusters
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    angles.forEach((ang) => {
      const pod = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.35), darkMat);
      arm.position.set(0, 0, 0.18);
      pod.add(arm);

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.28, 8), armorMat);
      nozzle.position.set(0, -0.1, 0.35);
      pod.add(nozzle);

      // Emissive blue jet flame inside nozzle
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.25, 6),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
      );
      flame.position.set(0, -0.25, 0.35);
      flame.rotation.x = Math.PI;
      pod.add(flame);

      pod.rotation.y = ang;
      this.mesh.add(pod);
      this.thrusters.push(pod);
    });

    // Dual Underslung Pulse Cannons
    const cannonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8);
    this.leftCannon = new THREE.Mesh(cannonGeo, darkMat);
    this.leftCannon.rotation.x = Math.PI / 2;
    this.leftCannon.position.set(0.3, -0.3, 0.25);
    this.mesh.add(this.leftCannon);

    this.rightCannon = new THREE.Mesh(cannonGeo, darkMat);
    this.rightCannon.rotation.x = Math.PI / 2;
    this.rightCannon.position.set(-0.3, -0.3, 0.25);
    this.mesh.add(this.rightCannon);

    // Holographic Repulsor Ring beneath drone
    const ringGeo = new THREE.TorusGeometry(0.48, 0.025, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    this.repulsorRing = new THREE.Mesh(ringGeo, ringMat);
    this.repulsorRing.rotation.x = Math.PI / 2;
    this.repulsorRing.position.y = -0.45;
    this.mesh.add(this.repulsorRing);

    // Ground Contact Shadow
    const shadowGeo = new THREE.CircleGeometry(0.9, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    scene.add(this.shadowMesh);

    scene.add(this.mesh);
  }

  /**
   * Updates AI State Machine, Pathfinding, and Visual Animations
   */
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    obstacles: CollisionObstacle[]
  ) {
    this.hoverTime += delta;
    this.stateTimer += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    // Continuous Top Radar Dish Rotation
    this.radarDish.rotation.y += delta * 3.5;

    // Distance to player
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    // AI SENSORY THRESHOLDS
    const detectionRadius = 16.0;
    const deAggroRadius = 28.0;
    const attackRange = 2.2;

    // AI STATE TRANSITIONS
    switch (this.state) {
      case 'PATROL': {
        this.setEyeColor(0xf59e0b, 0.6); // Amber
        this.hasTriggeredAlertSound = false;

        // Player entered detection zone
        if (distToPlayer < detectionRadius) {
          this.switchState('ALERT');
          sounds.playEnemyAlert();
          this.stateTimer = 0;
        } else {
          // Patrol toward current waypoint
          const targetWp = this.waypoints[this.currentWaypointIdx];
          const wdx = targetWp.x - this.position.x;
          const wdz = targetWp.z - this.position.z;
          const wDist = Math.sqrt(wdx * wdx + wdz * wdz);

          if (wDist < 1.8) {
            this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
          } else {
            this.moveToward(targetWp.x, targetWp.z, 2.8, delta, obstacles);
          }
        }
        break;
      }

      case 'ALERT': {
        this.setEyeColor(0xef4444, 1.2); // Glowing Crimson
        // Turn to face player immediately
        const targetAngle = Math.atan2(dx, dz);
        this.heading = THREE.MathUtils.damp(this.heading, targetAngle, 12, delta);

        // Alert pause hesitation before full chase
        if (this.stateTimer > 0.6) {
          this.switchState('CHASE');
        }
        break;
      }

      case 'CHASE': {
        this.setEyeColor(0xef4444, 1.5 + Math.sin(this.hoverTime * 10) * 0.5); // Pulsing Crimson

        if (distToPlayer > deAggroRadius) {
          // Player escaped
          this.switchState('RETURN');
        } else if (distToPlayer <= attackRange) {
          this.switchState('ATTACK');
        } else {
          // Pursue player with obstacle avoidance
          this.moveToward(playerPos.x, playerPos.z, 5.8, delta, obstacles);
        }
        break;
      }

      case 'ATTACK': {
        this.setEyeColor(0xff0044, 2.5); // Bright Red
        // Face player
        const targetAngle = Math.atan2(dx, dz);
        this.heading = THREE.MathUtils.damp(this.heading, targetAngle, 16, delta);

        if (distToPlayer > attackRange * 1.4) {
          this.switchState('CHASE');
        } else if (this.attackCooldown <= 0) {
          this.executeAttack();
        }
        break;
      }

      case 'RETURN': {
        this.setEyeColor(0xf59e0b, 0.7); // Amber
        const homeWp = this.waypoints[0];
        const hdx = homeWp.x - this.position.x;
        const hdz = homeWp.z - this.position.z;
        const hDist = Math.sqrt(hdx * hdx + hdz * hdz);

        if (distToPlayer < detectionRadius * 0.8) {
          this.switchState('CHASE');
        } else if (hDist < 2.0) {
          this.switchState('PATROL');
        } else {
          this.moveToward(homeWp.x, homeWp.z, 3.5, delta, obstacles);
        }
        break;
      }
    }

    // Apply Position & Floating Hover Bobbing
    const hoverY = 1.6 + Math.sin(this.hoverTime * 3.2) * 0.22;
    this.position.y = hoverY;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    // Bank slightly during fast movement
    const speed = this.velocity.length();
    this.mesh.rotation.z = Math.sin(this.hoverTime * 4) * 0.05 - (this.velocity.x * 0.04);
    this.mesh.rotation.x = (this.velocity.z * 0.03);

    // Keep contact shadow locked beneath drone on ground
    this.shadowMesh.position.set(this.position.x, 0.02, this.position.z);
    this.shadowMesh.scale.setScalar(1 + (hoverY - 1.6) * 0.3);
  }

  private moveToward(
    targetX: number,
    targetZ: number,
    speed: number,
    delta: number,
    obstacles: CollisionObstacle[]
  ) {
    let dirX = targetX - this.position.x;
    let dirZ = targetZ - this.position.z;
    const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);

    if (dist > 0.001) {
      dirX /= dist;
      dirZ /= dist;
    }

    // Obstacle avoidance steering
    for (const obs of obstacles) {
      const ox = this.position.x - obs.x;
      const oz = this.position.z - obs.z;
      const oDist = Math.sqrt(ox * ox + oz * oz);
      const safeDist = obs.radius + 1.8;

      if (oDist < safeDist && oDist > 0.001) {
        // Push outward
        const avoidForce = (safeDist - oDist) / safeDist;
        dirX += (ox / oDist) * avoidForce * 1.8;
        dirZ += (oz / oDist) * avoidForce * 1.8;
      }
    }

    // Re-normalize direction
    const finalDist = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (finalDist > 0.001) {
      dirX /= finalDist;
      dirZ /= finalDist;
    }

    // Target Velocity
    const targetVelX = dirX * speed;
    const targetVelZ = dirZ * speed;

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVelX, 8, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVelZ, 8, delta);

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Smooth heading rotation
    const moveAngle = Math.atan2(this.velocity.x, this.velocity.z);
    this.heading = THREE.MathUtils.damp(this.heading, moveAngle, 10, delta);
  }

  private executeAttack() {
    this.attackCooldown = 1.6; // Attack interval
    sounds.playEnemyAttack();

    if (this.callbacks.onAttackPlayer) {
      this.callbacks.onAttackPlayer(15);
    }

    // Recoil animation
    this.position.y += 0.25;
  }

  private setEyeColor(colorHex: number, intensity: number) {
    this.eyeMaterial.color.setHex(colorHex);
    this.eyeMaterial.emissive.setHex(colorHex);
    this.eyeMaterial.emissiveIntensity = intensity;
  }

  private switchState(newState: EnemyState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateTimer = 0;
      if (this.callbacks.onStateChange) {
        this.callbacks.onStateChange(newState);
      }
    }
  }

  public getInfo(playerPos: THREE.Vector3): EnemyInfo {
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

    return {
      id: 'sentinel_drone_alpha',
      name: 'Dron Centinela Mk-I',
      type: 'infected_shambler',
      position: [this.position.x, this.position.y, this.position.z],
      state: this.state,
      health: this.health,
      maxHealth: this.maxHealth,
      distanceToPlayer,
    };
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    scene.remove(this.shadowMesh);
  }
}
