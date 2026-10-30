import * as THREE from 'three';

/**
 * Detailed 3D procedural humanoid character with articulated skeleton hierarchy
 * and smooth procedural animations (Idle, Walk, Sprint, Jump).
 */
export class SurvivalCharacter {
  public mesh: THREE.Group;
  public headGroup: THREE.Group;
  public weaponMesh: THREE.Group | null = null;
  public shadowMesh: THREE.Mesh;

  // Hierarchical articulated joints
  private hips: THREE.Group;
  private spine: THREE.Group;
  private chest: THREE.Group;
  private neck: THREE.Group;
  private leftUpperArm: THREE.Group;
  private leftLowerArm: THREE.Group;
  private rightUpperArm: THREE.Group;
  private rightLowerArm: THREE.Group;
  private leftUpperLeg: THREE.Group;
  private leftLowerLeg: THREE.Group;
  private rightUpperLeg: THREE.Group;
  private rightLowerLeg: THREE.Group;

  // Materials
  private suitMaterial: THREE.MeshStandardMaterial;
  private armorMaterial: THREE.MeshStandardMaterial;
  private jointMaterial: THREE.MeshStandardMaterial;
  private visorMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;

  // Animation state
  private animTime: number = 0;
  private currentSpeed: number = 0;
  private targetSpeed: number = 0;
  private stepDistance: number = 0;
  public onFootstep?: (sprinting: boolean) => void;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'SurvivalPlayer';

    // 1. High-fidelity PBR Materials (contrast between matte synthetic suit, hard metallic armor, and glowing visor)
    this.suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Tactical dark slate
      roughness: 0.85,
      metalness: 0.1,
    });

    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155, // Reinforced carbon alloy
      roughness: 0.35,
      metalness: 0.6,
    });

    this.jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Flexible ballistic rubber joints
      roughness: 0.95,
      metalness: 0.05,
    });

    this.visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant cyan tactical visor
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.7,
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316, // High-visibility hazard orange survival accents
      roughness: 0.4,
      metalness: 0.2,
    });

    // 2. Build Humanoid Joint Hierarchy
    // Ground origin at (0, 0, 0), character height approx 1.82m

    // Pelvis / Hips (Y = 0.95m)
    this.hips = new THREE.Group();
    this.hips.position.y = 0.95;
    this.mesh.add(this.hips);

    const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.16, 8);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, this.suitMaterial);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    this.hips.add(pelvisMesh);

    // Tactical Belt
    const beltGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
    const beltMesh = new THREE.Mesh(beltGeo, this.armorMaterial);
    beltMesh.position.y = 0.04;
    beltMesh.castShadow = true;
    this.hips.add(beltMesh);

    // Belt pouches
    for (let i = -1; i <= 1; i += 2) {
      const pouchGeo = new THREE.BoxGeometry(0.08, 0.07, 0.07);
      const pouch = new THREE.Mesh(pouchGeo, this.jointMaterial);
      pouch.position.set(i * 0.19, 0.04, 0.05);
      pouch.castShadow = true;
      this.hips.add(pouch);
    }

    // Spine & Chest
    this.spine = new THREE.Group();
    this.spine.position.y = 0.08;
    this.hips.add(this.spine);

    const abdomenGeo = new THREE.CylinderGeometry(0.16, 0.15, 0.15, 8);
    const abdomenMesh = new THREE.Mesh(abdomenGeo, this.jointMaterial);
    abdomenMesh.position.y = 0.075;
    abdomenMesh.castShadow = true;
    this.spine.add(abdomenMesh);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.15;
    this.spine.add(this.chest);

    // Main Torso / Armor Chest Plate
    const chestGeo = new THREE.BoxGeometry(0.36, 0.28, 0.24);
    const chestMesh = new THREE.Mesh(chestGeo, this.suitMaterial);
    chestMesh.position.y = 0.14;
    chestMesh.castShadow = true;
    this.chest.add(chestMesh);

    // Hardened ballistic plate front
    const plateGeo = new THREE.BoxGeometry(0.3, 0.22, 0.08);
    const plateMesh = new THREE.Mesh(plateGeo, this.armorMaterial);
    plateMesh.position.set(0, 0.15, 0.11);
    plateMesh.castShadow = true;
    this.chest.add(plateMesh);

    // Hazard stripe on chest
    const chestDecalGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
    const chestDecal = new THREE.Mesh(chestDecalGeo, this.accentMaterial);
    chestDecal.position.set(0.08, 0.2, 0.155);
    this.chest.add(chestDecal);

    // Survival Backpack / Life Support Unit on back
    const packGeo = new THREE.BoxGeometry(0.26, 0.32, 0.14);
    const packMesh = new THREE.Mesh(packGeo, this.armorMaterial);
    packMesh.position.set(0, 0.16, -0.16);
    packMesh.castShadow = true;
    this.chest.add(packMesh);

    // Oxygen / Battery canister on backpack side
    const canisterGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.26, 8);
    const canisterMesh = new THREE.Mesh(canisterGeo, this.accentMaterial);
    canisterMesh.position.set(0.12, 0.16, -0.23);
    canisterMesh.castShadow = true;
    this.chest.add(canisterMesh);

    // Neck & Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.28;
    this.chest.add(this.neck);

    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.08, 8);
    const neckMesh = new THREE.Mesh(neckGeo, this.jointMaterial);
    neckMesh.position.y = 0.04;
    this.neck.add(neckMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.08;
    this.neck.add(this.headGroup);

    // Survival Combat Helmet
    const helmetGeo = new THREE.SphereGeometry(0.14, 16, 12);
    helmetGeo.scale(0.9, 1.1, 1.05);
    const helmetMesh = new THREE.Mesh(helmetGeo, this.armorMaterial);
    helmetMesh.position.y = 0.1;
    helmetMesh.castShadow = true;
    this.headGroup.add(helmetMesh);

    // Curved Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.18, 0.08, 0.08);
    const visorMesh = new THREE.Mesh(visorGeo, this.visorMaterial);
    visorMesh.position.set(0, 0.11, 0.11);
    this.headGroup.add(visorMesh);

    // Helmet Comms Antenna / Light
    const commGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6);
    const commMesh = new THREE.Mesh(commGeo, this.accentMaterial);
    commMesh.position.set(-0.12, 0.18, 0.02);
    commMesh.rotation.z = -0.2;
    this.headGroup.add(commMesh);

    // ARMS (Left & Right)
    // Left Arm
    this.leftUpperArm = new THREE.Group();
    this.leftUpperArm.position.set(0.24, 0.24, 0);
    this.chest.add(this.leftUpperArm);

    const lShoulderGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const lShoulder = new THREE.Mesh(lShoulderGeo, this.armorMaterial);
    lShoulder.castShadow = true;
    this.leftUpperArm.add(lShoulder);

    const lArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.22, 8);
    const lArmMesh = new THREE.Mesh(lArmGeo, this.suitMaterial);
    lArmMesh.position.y = -0.11;
    lArmMesh.castShadow = true;
    this.leftUpperArm.add(lArmMesh);

    this.leftLowerArm = new THREE.Group();
    this.leftLowerArm.position.y = -0.22;
    this.leftUpperArm.add(this.leftLowerArm);

    const lForearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.2, 8);
    const lForearmMesh = new THREE.Mesh(lForearmGeo, this.suitMaterial);
    lForearmMesh.position.y = -0.1;
    lForearmMesh.castShadow = true;
    this.leftLowerArm.add(lForearmMesh);

    const lHandGeo = new THREE.BoxGeometry(0.06, 0.08, 0.05);
    const lHandMesh = new THREE.Mesh(lHandGeo, this.jointMaterial);
    lHandMesh.position.y = -0.22;
    this.leftLowerArm.add(lHandMesh);

    // Right Arm (Equipped with tactical modular weapon)
    this.rightUpperArm = new THREE.Group();
    this.rightUpperArm.position.set(-0.24, 0.24, 0);
    this.chest.add(this.rightUpperArm);

    const rShoulderGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const rShoulder = new THREE.Mesh(rShoulderGeo, this.armorMaterial);
    rShoulder.castShadow = true;
    this.rightUpperArm.add(rShoulder);

    const rArmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.22, 8);
    const rArmMesh = new THREE.Mesh(rArmGeo, this.suitMaterial);
    rArmMesh.position.y = -0.11;
    rArmMesh.castShadow = true;
    this.rightUpperArm.add(rArmMesh);

    this.rightLowerArm = new THREE.Group();
    this.rightLowerArm.position.y = -0.22;
    this.rightUpperArm.add(this.rightLowerArm);

    const rForearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.2, 8);
    const rForearmMesh = new THREE.Mesh(rForearmGeo, this.suitMaterial);
    rForearmMesh.position.y = -0.1;
    rForearmMesh.castShadow = true;
    this.rightLowerArm.add(rForearmMesh);

    const rHandGeo = new THREE.BoxGeometry(0.06, 0.08, 0.05);
    const rHandMesh = new THREE.Mesh(rHandGeo, this.jointMaterial);
    rHandMesh.position.y = -0.22;
    this.rightLowerArm.add(rHandMesh);

    // Build Tactical Assault Carbine attached to player
    this.buildWeaponMesh();

    // LEGS (Left & Right)
    // Left Leg
    this.leftUpperLeg = new THREE.Group();
    this.leftUpperLeg.position.set(0.11, -0.05, 0);
    this.hips.add(this.leftUpperLeg);

    const lThighGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.38, 8);
    const lThighMesh = new THREE.Mesh(lThighGeo, this.suitMaterial);
    lThighMesh.position.y = -0.19;
    lThighMesh.castShadow = true;
    this.leftUpperLeg.add(lThighMesh);

    // Knee pad
    const lKneeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.06);
    const lKnee = new THREE.Mesh(lKneeGeo, this.armorMaterial);
    lKnee.position.set(0, -0.37, 0.04);
    this.leftUpperLeg.add(lKnee);

    this.leftLowerLeg = new THREE.Group();
    this.leftLowerLeg.position.y = -0.38;
    this.leftUpperLeg.add(this.leftLowerLeg);

    const lCalfGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.36, 8);
    const lCalfMesh = new THREE.Mesh(lCalfGeo, this.suitMaterial);
    lCalfMesh.position.y = -0.18;
    lCalfMesh.castShadow = true;
    this.leftLowerLeg.add(lCalfMesh);

    // Combat Boot
    const lBootGeo = new THREE.BoxGeometry(0.1, 0.12, 0.2);
    const lBootMesh = new THREE.Mesh(lBootGeo, this.armorMaterial);
    lBootMesh.position.set(0, -0.38, 0.04);
    lBootMesh.castShadow = true;
    this.leftLowerLeg.add(lBootMesh);

    // Right Leg
    this.rightUpperLeg = new THREE.Group();
    this.rightUpperLeg.position.set(-0.11, -0.05, 0);
    this.hips.add(this.rightUpperLeg);

    const rThighGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.38, 8);
    const rThighMesh = new THREE.Mesh(rThighGeo, this.suitMaterial);
    rThighMesh.position.y = -0.19;
    rThighMesh.castShadow = true;
    this.rightUpperLeg.add(rThighMesh);

    // Knee pad
    const rKneeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.06);
    const rKnee = new THREE.Mesh(rKneeGeo, this.armorMaterial);
    rKnee.position.set(0, -0.37, 0.04);
    this.rightUpperLeg.add(rKnee);

    this.rightLowerLeg = new THREE.Group();
    this.rightLowerLeg.position.y = -0.38;
    this.rightUpperLeg.add(this.rightLowerLeg);

    const rCalfGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.36, 8);
    const rCalfMesh = new THREE.Mesh(rCalfGeo, this.suitMaterial);
    rCalfMesh.position.y = -0.18;
    rCalfMesh.castShadow = true;
    this.rightLowerLeg.add(rCalfMesh);

    // Combat Boot
    const rBootGeo = new THREE.BoxGeometry(0.1, 0.12, 0.2);
    const rBootMesh = new THREE.Mesh(rBootGeo, this.armorMaterial);
    rBootMesh.position.set(0, -0.38, 0.04);
    rBootMesh.castShadow = true;
    this.rightLowerLeg.add(rBootMesh);

    // 3. Contact Shadow Grounding
    // Soft radial contact shadow plane pinned flush directly beneath character (Y=0.02)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.mesh.add(this.shadowMesh);
  }

  private buildWeaponMesh() {
    this.weaponMesh = new THREE.Group();
    this.weaponMesh.name = 'CarbineRifle';

    // Rifle Receiver
    const bodyGeo = new THREE.BoxGeometry(0.06, 0.08, 0.35);
    const rifleMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, rifleMat);
    this.weaponMesh.add(bodyMesh);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.28, 8);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.9,
      roughness: 0.2,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, 0.28);
    this.weaponMesh.add(barrel);

    // Holographic Sight
    const sightGeo = new THREE.BoxGeometry(0.035, 0.04, 0.08);
    const sightMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0, 0.055, 0.02);
    this.weaponMesh.add(sight);

    // Ammo Magazine
    const magGeo = new THREE.BoxGeometry(0.04, 0.12, 0.07);
    const mag = new THREE.Mesh(magGeo, this.accentMaterial);
    mag.position.set(0, -0.07, 0.06);
    mag.rotation.x = 0.15;
    this.weaponMesh.add(mag);

    // Handgrip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.1, 0.05);
    const grip = new THREE.Mesh(gripGeo, rifleMat);
    grip.position.set(0, -0.07, -0.08);
    grip.rotation.x = -0.25;
    this.weaponMesh.add(grip);

    // Attach to right hand
    this.weaponMesh.position.set(0, -0.22, 0.12);
    this.weaponMesh.rotation.set(-0.2, 0, 0);
    this.rightLowerArm.add(this.weaponMesh);
  }

  /**
   * Updates character kinematic animation joints based on movement state and delta time.
   */
  public update(
    delta: number,
    isMoving: boolean,
    isSprinting: boolean,
    isGrounded: boolean,
    verticalVelocity: number
  ) {
    this.targetSpeed = isMoving ? (isSprinting ? 2.2 : 1.0) : 0;
    // Exponential smoothing for speed transitions
    this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, this.targetSpeed, 9, delta);

    const speedFactor = this.currentSpeed;
    const strideFreq = isSprinting ? 12 : 7.5;
    this.animTime += delta * strideFreq * (isMoving ? 1 : 0.4);

    if (isGrounded) {
      if (isMoving) {
        // Track footstep cadence
        const previousStep = Math.sin(this.stepDistance);
        this.stepDistance += delta * strideFreq;
        const currentStep = Math.sin(this.stepDistance);
        // Play footstep on stride strike (zero-crossing)
        if (previousStep > 0 && currentStep <= 0 && this.onFootstep) {
          this.onFootstep(isSprinting);
        }
      }

      // 1. Idle Breathing & Micro-sway
      const breath = Math.sin(this.animTime * 1.5) * 0.03;
      const sway = Math.cos(this.animTime * 0.8) * 0.015;

      // 2. Walking / Sprinting Leg Stride Kinematics
      const legAngle = Math.sin(this.animTime) * 0.65 * speedFactor;
      const kneeLiftLeft = Math.max(0, -Math.cos(this.animTime)) * 0.8 * speedFactor;
      const kneeLiftRight = Math.max(0, Math.cos(this.animTime)) * 0.8 * speedFactor;

      // Leg rotations
      this.leftUpperLeg.rotation.x = legAngle;
      this.rightUpperLeg.rotation.x = -legAngle;

      this.leftLowerLeg.rotation.x = kneeLiftLeft;
      this.rightLowerLeg.rotation.x = kneeLiftRight;

      // Arm counter-swinging (opposition to legs)
      const armSwing = Math.sin(this.animTime) * 0.6 * speedFactor;
      const sprintLean = isSprinting ? 0.3 : 0.08 * speedFactor;

      // Left Arm swings freely
      this.leftUpperArm.rotation.x = -armSwing + 0.1;
      this.leftUpperArm.rotation.z = 0.15 + (isSprinting ? 0.2 : 0.05);
      this.leftLowerArm.rotation.x = -Math.abs(armSwing) * 0.7 - 0.2;

      // Right Arm braces weapon forward with tactical ready stance
      this.rightUpperArm.rotation.x = (armSwing * 0.35) - 0.55 - (isSprinting ? 0.2 : 0);
      this.rightUpperArm.rotation.y = -0.3;
      this.rightUpperArm.rotation.z = -0.15;
      this.rightLowerArm.rotation.x = -0.7 - (isSprinting ? 0.3 : 0);

      // Torso / Spine forward tilt and hip bob
      this.spine.rotation.x = sprintLean + breath;
      this.spine.rotation.y = Math.sin(this.animTime) * 0.1 * speedFactor;
      this.hips.position.y = 0.95 - Math.abs(Math.sin(this.animTime)) * 0.05 * speedFactor;
      this.hips.rotation.z = Math.sin(this.animTime) * 0.04 * speedFactor;

      // Head remains focused forward
      this.headGroup.rotation.x = -sprintLean * 0.6 + breath * 0.5;
      this.headGroup.rotation.y = sway;
    } else {
      // Jump / In-air kinematics
      const jumpProgress = THREE.MathUtils.clamp(verticalVelocity / 6, -1, 1);

      this.hips.position.y = 0.95;
      this.spine.rotation.x = jumpProgress > 0 ? -0.15 : 0.15;

      // Tuck legs slightly
      this.leftUpperLeg.rotation.x = 0.4;
      this.leftLowerLeg.rotation.x = 0.5;
      this.rightUpperLeg.rotation.x = 0.25;
      this.rightLowerLeg.rotation.x = 0.7;

      // Arms brace outward for airborne balance
      this.leftUpperArm.rotation.x = -0.3;
      this.leftUpperArm.rotation.z = 0.5;
      this.rightUpperArm.rotation.x = -0.6;
      this.rightUpperArm.rotation.z = -0.3;
    }
  }

  public setVisibilityForFirstPerson(isFirstPerson: boolean) {
    // In first person, hide head and torso back to avoid camera clipping, but keep arms & gun visible
    this.headGroup.visible = !isFirstPerson;
    this.chest.visible = !isFirstPerson;
    this.shadowMesh.visible = !isFirstPerson;
  }
}
