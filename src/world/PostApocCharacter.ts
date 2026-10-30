import * as THREE from 'three';

/**
 * High-Fidelity Survivor Character using the user's authentic character artwork.
 * Matches:
 * Male: 3d_character_render_of_a_gritty_male_zombie_apocalypse_survivor_standing_08d7ae1b.png (Joel)
 * Female: full_body_3d_character_render_of_a_gritty_female_zombie_apocalypse_survivor_a6255089.png (Ellie)
 */
export class PostApocCharacter {
  public mesh: THREE.Group;
  public shadowMesh: THREE.Mesh;
  public activeGender: 'male' | 'female' = 'male';

  // Visual billboard layers
  private bodyMesh: THREE.Mesh;
  private maleTexture: THREE.Texture;
  private femaleTexture: THREE.Texture;
  private bodyMaterial: THREE.MeshStandardMaterial;

  // Flashlight and weapon effects
  public flashlight: THREE.SpotLight;
  public muzzleFlashLight: THREE.PointLight;
  private rifleProp: THREE.Group;

  // Animation parameters
  private animTime: number = 0;
  private currentSpeed: number = 0;
  private targetSpeed: number = 0;
  private aimFactor: number = 0;
  private recoilTimer: number = 0;
  private stepDistance: number = 0;
  public onFootstep?: (sprinting: boolean) => void;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'SurvivorPlayer';

    const textureLoader = new THREE.TextureLoader();

    // 1. Load exact character textures from user's assets
    this.maleTexture = textureLoader.load(
      '/assets/aistudio/3d_character_render_of_a_gritty_male_zombie_apocalypse_survivor_standing_08d7ae1b.png'
    );
    this.maleTexture.colorSpace = THREE.SRGBColorSpace;

    this.femaleTexture = textureLoader.load(
      '/assets/aistudio/full_body_3d_character_render_of_a_gritty_female_zombie_apocalypse_survivor_a6255089.png'
    );
    this.femaleTexture.colorSpace = THREE.SRGBColorSpace;

    // 2. High-Fidelity PBR Material with Alpha Transparency
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.maleTexture,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.75,
      metalness: 0.1,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    // 3. 3D Body Mesh with Multi-Angle Volume (Height approx 1.95m, scaled properly)
    const bodyGeo = new THREE.PlaneGeometry(1.25, 2.0);
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    this.bodyMesh.position.y = 1.0;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.mesh.add(this.bodyMesh);

    // Cross-angle plane 1
    const crossMesh1 = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    crossMesh1.position.y = 1.0;
    crossMesh1.rotation.y = Math.PI / 4;
    crossMesh1.castShadow = true;
    this.mesh.add(crossMesh1);

    // Cross-angle plane 2
    const crossMesh2 = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    crossMesh2.position.y = 1.0;
    crossMesh2.rotation.y = -Math.PI / 4;
    crossMesh2.castShadow = true;
    this.mesh.add(crossMesh2);

    // 4. Tactical Hunting Rifle in Hand
    this.rifleProp = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.25 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.7 });

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 8), steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, 0.45);
    this.rifleProp.add(barrel);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.3), woodMat);
    stock.position.set(0, -0.03, -0.12);
    this.rifleProp.add(stock);

    this.rifleProp.position.set(-0.25, 1.05, 0.35);
    this.mesh.add(this.rifleProp);

    // Muzzle Flash Light
    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 12);
    this.muzzleFlashLight.position.set(0, 0, 0.8);
    this.rifleProp.add(this.muzzleFlashLight);

    // 5. Shoulder-Mounted Tactical Flashlight
    this.flashlight = new THREE.SpotLight(0xfff7ed, 2.0, 30, Math.PI / 5, 0.4, 1.2);
    this.flashlight.position.set(0.15, 1.4, 0.2);
    this.flashlight.target.position.set(0.15, 1.2, 8);
    this.mesh.add(this.flashlight);
    this.mesh.add(this.flashlight.target);

    // 6. Ground Radial Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.mesh.add(this.shadowMesh);
  }

  public setGender(gender: 'male' | 'female') {
    this.activeGender = gender;
    this.bodyMaterial.map = gender === 'male' ? this.maleTexture : this.femaleTexture;
    this.bodyMaterial.needsUpdate = true;
  }

  public triggerRecoil() {
    this.recoilTimer = 0.18;
    this.muzzleFlashLight.intensity = 4.0;
  }

  public update(
    delta: number,
    isMoving: boolean,
    isSprinting: boolean,
    isGrounded: boolean,
    isAiming: boolean,
    verticalVelocity: number
  ) {
    this.targetSpeed = isMoving ? (isSprinting ? 2.2 : 1.0) : 0;
    this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, this.targetSpeed, 9, delta);
    this.aimFactor = THREE.MathUtils.damp(this.aimFactor, isAiming ? 1.0 : 0.0, 12, delta);

    if (this.recoilTimer > 0) {
      this.recoilTimer -= delta;
      if (this.recoilTimer <= 0) {
        this.muzzleFlashLight.intensity = 0;
      }
    }

    const speedFactor = this.currentSpeed;
    const strideFreq = isSprinting ? 12.5 : 7.5;
    this.animTime += delta * strideFreq * (isMoving ? 1 : 0.4);

    if (isGrounded) {
      if (isMoving) {
        const prevStep = Math.sin(this.stepDistance);
        this.stepDistance += delta * strideFreq;
        const currStep = Math.sin(this.stepDistance);
        if (prevStep > 0 && currStep <= 0 && this.onFootstep) {
          this.onFootstep(isSprinting);
        }
      }

      // Smooth kinematic sway & breathing
      const breath = Math.sin(this.animTime * 1.6) * 0.025;
      const walkBob = Math.abs(Math.sin(this.animTime)) * 0.06 * speedFactor;
      const walkTilt = Math.sin(this.animTime) * 0.04 * speedFactor;

      this.bodyMesh.position.y = 1.0 - walkBob + breath;
      this.bodyMesh.rotation.z = walkTilt;

      // Sprint pitch forward lean
      const sprintLean = isSprinting ? 0.18 : 0.04 * speedFactor;
      this.bodyMesh.rotation.x = sprintLean;

      // Weapon positioning (Standard Hip Carry vs Aim ADS raise)
      const aimRifleX = -0.15;
      const aimRifleY = 1.35;
      const aimRifleZ = 0.55;
      const recoilKick = this.recoilTimer > 0 ? 0.15 : 0;

      this.rifleProp.position.x = THREE.MathUtils.lerp(-0.25, aimRifleX, this.aimFactor);
      this.rifleProp.position.y = THREE.MathUtils.lerp(1.05 - walkBob, aimRifleY - recoilKick, this.aimFactor);
      this.rifleProp.position.z = THREE.MathUtils.lerp(0.35, aimRifleZ - recoilKick, this.aimFactor);
      this.rifleProp.rotation.x = THREE.MathUtils.lerp(0.1, -0.05, this.aimFactor);
    } else {
      // In air jump
      this.bodyMesh.position.y = 1.08;
      this.bodyMesh.rotation.x = -0.1;
    }
  }
}
