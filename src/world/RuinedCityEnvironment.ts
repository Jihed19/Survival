import * as THREE from 'three';
import { CollisionObstacle } from './Environment';

/**
 * Large Ruined Post-Apocalyptic City Environment (The Last of Us / DayZ style)
 * Broken asphalt with cracks and potholes, destroyed skyscrapers, collapsed overpasses,
 * abandoned rusted pickup trucks and cars, and rubble piles for cover.
 */
export class RuinedCityEnvironment {
  public group: THREE.Group;
  public obstacles: CollisionObstacle[] = [];
  public asphaltMesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'RuinedCity';
    scene.add(this.group);

    // 1. Broken Cracked Asphalt Ground
    this.asphaltMesh = this.createBrokenAsphalt();
    this.group.add(this.asphaltMesh);

    // 2. Ruined Collapsed Buildings & Skyscrapers
    this.createRuinedBuildings();

    // 3. Collapsed Elevated Highway Overpass
    this.createCollapsedOverpass();

    // 4. Abandoned Rusted Cars & Pickup Trucks
    this.createAbandonedVehicles();

    // 5. Rubble Piles, Barricades & Fire Barrels
    this.createUrbanDebris();

    // 6. Fortified Discovered Shelters & Safe Havens
    this.createShelters();
  }

  private createBrokenAsphalt(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Dark weathered asphalt base
    ctx.fillStyle = '#1e242b';
    ctx.fillRect(0, 0, 1024, 1024);

    // Grain and gravel noise
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const gray = Math.floor(20 + Math.random() * 30);
      ctx.fillStyle = `rgb(${gray}, ${gray - 2}, ${gray - 4})`;
      ctx.fillRect(x, y, 3, 3);
    }

    // Faded yellow double road centerline
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(500, 0);
    ctx.lineTo(500, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(524, 0);
    ctx.lineTo(524, 1024);
    ctx.stroke();

    // Deep jagged cracks & potholes
    ctx.strokeStyle = '#090c10';
    ctx.lineWidth = 3;
    for (let c = 0; c < 35; c++) {
      let cx = Math.random() * 1024;
      let cy = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 6; s++) {
        cx += (Math.random() - 0.5) * 80;
        cy += (Math.random() - 0.5) * 80;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Wet puddles / dirt patches
    ctx.fillStyle = 'rgba(10, 12, 16, 0.6)';
    for (let p = 0; p < 12; p++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      const pr = 40 + Math.random() * 60;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(24, 24);
    groundTex.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(350, 350), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createRuinedBuildings() {
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Weathered concrete
      roughness: 0.9,
      metalness: 0.1,
    });

    const darkConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x27303f, // Soot-stained damaged facade
      roughness: 0.95,
      metalness: 0.05,
    });

    const rebarMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12, // Rusted iron rebar
      roughness: 0.7,
      metalness: 0.6,
    });

    const buildingDefs = [
      { x: -35, z: -40, w: 22, h: 32, d: 24, rot: 0.05 },
      { x: 38, z: -36, w: 20, h: 28, d: 22, rot: -0.08 },
      { x: -45, z: 15, w: 26, h: 22, d: 20, rot: 0.15 },
      { x: 42, z: 24, w: 24, h: 36, d: 26, rot: -0.1 },
      { x: -10, z: -65, w: 34, h: 42, d: 26, rot: 0.02 },
      { x: 18, z: 62, w: 28, h: 24, d: 22, rot: 0.2 },
    ];

    buildingDefs.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);
      bGroup.rotation.y = b.rot;

      // Main structural block
      const main = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), concreteMat);
      main.position.y = b.h / 2;
      main.castShadow = true;
      main.receiveShadow = true;
      bGroup.add(main);

      // Collapsed jagged top chunk
      const rubbleTop = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 0.75, b.h * 0.25, b.d * 0.75),
        darkConcreteMat
      );
      rubbleTop.position.set(b.w * 0.1, b.h + b.h * 0.1, 0);
      rubbleTop.rotation.set(0.1, 0.2, -0.15);
      rubbleTop.castShadow = true;
      bGroup.add(rubbleTop);

      // Windows grid rows (cutout facade look)
      for (let y = 3; y < b.h - 4; y += 4) {
        for (let x = -b.w / 2 + 3; x < b.w / 2 - 2; x += 4.5) {
          const windowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 2.2, b.d + 0.2),
            darkConcreteMat
          );
          windowMesh.position.set(x, y, 0);
          bGroup.add(windowMesh);
        }
      }

      // Exposed rusted twisted rebar spikes at top
      for (let r = 0; r < 5; r++) {
        const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6), rebarMat);
        rebar.position.set((Math.random() - 0.5) * b.w * 0.8, b.h + 1.5, (Math.random() - 0.5) * b.d * 0.8);
        rebar.rotation.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
        bGroup.add(rebar);
      }

      this.group.add(bGroup);
      this.obstacles.push({ x: b.x, z: b.z, radius: (Math.max(b.w, b.d) / 2) + 1.2, height: b.h });
    });
  }

  private createCollapsedOverpass() {
    const overpass = new THREE.Group();
    overpass.position.set(0, 0, -20);

    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.2,
    });

    // Massive highway support pillars
    [-15, 15].forEach((px) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 8, 12), bridgeMat);
      pillar.position.set(px, 4, 0);
      pillar.castShadow = true;
      overpass.add(pillar);
      this.obstacles.push({ x: px, z: -20, radius: 2.0, height: 8 });
    });

    // Broken Elevated Highway Road Deck
    const deckLeft = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 10), bridgeMat);
    deckLeft.position.set(-18, 7.8, 0);
    deckLeft.castShadow = true;
    overpass.add(deckLeft);

    // Collapsed diagonal ramp slab touching ground (creates iconic TLOU incline!)
    const fallenRamp = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 10), bridgeMat);
    fallenRamp.position.set(5, 3.6, 0);
    fallenRamp.rotation.z = 0.35; // angled down to ground
    fallenRamp.castShadow = true;
    fallenRamp.receiveShadow = true;
    overpass.add(fallenRamp);

    this.group.add(overpass);
    this.obstacles.push({ x: 5, z: -20, radius: 5.5, height: 7 });
  }

  private createAbandonedVehicles() {
    // Pickup trucks & Sedans matching reference photo #7
    const vehicleCoords = [
      { x: -6, z: 2, type: 'pickup', color: 0x3f3f46, rot: 0.25 }, // Grey rusted pickup
      { x: 12, z: -4, type: 'sedan', color: 0x581c87, rot: -0.6 },  // Abandoned dark sedan
      { x: -16, z: -14, type: 'pickup', color: 0x78350f, rot: 1.1 }, // Rusty brown pickup
      { x: 18, z: 12, type: 'sedan', color: 0x1e3a8a, rot: -0.3 },  // Blue sedan
      { x: 4, z: 26, type: 'pickup', color: 0x1f2937, rot: 2.4 },   // Black truck
    ];

    vehicleCoords.forEach((v) => {
      const carGroup = new THREE.Group();
      carGroup.position.set(v.x, 0, v.z);
      carGroup.rotation.y = v.rot;

      const bodyMat = new THREE.MeshStandardMaterial({
        color: v.color,
        roughness: 0.8,
        metalness: 0.4,
      });

      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.9,
      });

      const rustMat = new THREE.MeshStandardMaterial({
        color: 0x451a03,
        roughness: 0.95,
      });

      if (v.type === 'pickup') {
        // Cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 2.2), bodyMat);
        cab.position.set(0, 1.0, 0.4);
        cab.castShadow = true;
        carGroup.add(cab);

        // Truck Bed
        const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.4), rustMat);
        bed.position.set(0, 0.75, -1.8);
        bed.castShadow = true;
        carGroup.add(bed);

        // Hood
        const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 1.5), bodyMat);
        hood.position.set(0, 0.7, 2.1);
        carGroup.add(hood);
      } else {
        // Sedan chassis
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 4.4), bodyMat);
        chassis.position.y = 0.7;
        chassis.castShadow = true;
        carGroup.add(chassis);

        // Cabin roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.2), bodyMat);
        roof.position.set(0, 1.4, -0.2);
        roof.castShadow = true;
        carGroup.add(roof);
      }

      // 4 Deflated / Rusted Wheels
      [
        [-1.05, 0.35, 1.4],
        [1.05, 0.35, 1.4],
        [-1.05, 0.35, -1.4],
        [1.05, 0.35, -1.4],
      ].forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12), tireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, wy, wz);
        wheel.castShadow = true;
        carGroup.add(wheel);
      });

      this.group.add(carGroup);
      this.obstacles.push({ x: v.x, z: v.z, radius: 2.2, height: 1.8 });
    });
  }

  private createUrbanDebris() {
    // Concrete Barrier K-Rails & Rubble
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8 });

    // Barricade blocking side alley
    for (let i = -2; i <= 2; i++) {
      const kRail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 1.8), barrierMat);
      kRail.position.set(-10, 0.45, 8 + i * 1.9);
      kRail.castShadow = true;
      this.group.add(kRail);
      this.obstacles.push({ x: -10, z: 8 + i * 1.9, radius: 0.8, height: 1 });
    }

    // Burning Fire Barrels (Provide eerie flickering apocalyptic orange light!)
    const barrelCoords = [
      [-4, 8],
      [14, -14],
      [-18, -6],
    ];

    barrelCoords.forEach(([bx, bz]) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 12), rustMat);
      drum.position.set(bx, 0.55, bz);
      drum.castShadow = true;
      this.group.add(drum);

      // Flickering Fire Light inside barrel
      const fireLight = new THREE.PointLight(0xf97316, 1.6, 12, 1.5);
      fireLight.position.set(bx, 1.3, bz);
      this.group.add(fireLight);

      this.obstacles.push({ x: bx, z: bz, radius: 0.5, height: 1.2 });
    });
  }

  private createShelters() {
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.2 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.9 });
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });

    // 1. Shelter 1: Búnker Subterráneo Alfa (X: -28, Z: 22)
    const bunker = new THREE.Group();
    bunker.position.set(-28, 0, 22);

    // Concrete blast shelter structure
    const bunkerBase = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 6), concreteMat);
    bunkerBase.position.y = 1.75;
    bunkerBase.castShadow = true;
    bunkerBase.receiveShadow = true;
    bunker.add(bunkerBase);

    // Heavy vault entrance door
    const vaultDoor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16), steelMat);
    vaultDoor.rotation.x = Math.PI / 2;
    vaultDoor.position.set(0, 1.4, 3.1);
    bunker.add(vaultDoor);

    // Emergency Green Beacon Light atop bunker
    const greenBeacon = new THREE.PointLight(0x22c55e, 2.2, 16);
    greenBeacon.position.set(0, 3.8, 0);
    bunker.add(greenBeacon);

    const beaconGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 })
    );
    beaconGlobe.position.set(0, 3.8, 0);
    bunker.add(beaconGlobe);

    // Sandbag perimeter defense
    for (let s = -3; s <= 3; s += 1.2) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.5), sandbagMat);
      bag.position.set(s, 0.25, 4.2);
      bag.castShadow = true;
      bunker.add(bag);
    }
    this.group.add(bunker);
    this.obstacles.push({ x: -28, z: 22, radius: 4.5, height: 3.5 });

    // 2. Shelter 2: Puesto de Vigía Norte (Watchtower) (X: 24, Z: -32)
    const watchtower = new THREE.Group();
    watchtower.position.set(24, 0, -32);

    // 4 Steel legs
    [
      [-1.8, -1.8],
      [1.8, -1.8],
      [-1.8, 1.8],
      [1.8, 1.8],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 8), steelMat);
      leg.position.set(lx, 4, lz);
      leg.castShadow = true;
      watchtower.add(leg);
    });

    // Elevated cabin platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.5, 4.4), rustMat);
    platform.position.y = 8;
    platform.castShadow = true;
    watchtower.add(platform);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 3.6), concreteMat);
    cabin.position.y = 9.5;
    cabin.castShadow = true;
    watchtower.add(cabin);

    // Amber watchtower searchlight
    const watchLight = new THREE.SpotLight(0xfbbf24, 3.0, 35, Math.PI / 6, 0.5);
    watchLight.position.set(0, 8.5, 2.2);
    watchLight.target.position.set(0, 0, 15);
    watchtower.add(watchLight);
    watchtower.add(watchLight.target);

    this.group.add(watchtower);
    this.obstacles.push({ x: 24, z: -32, radius: 2.8, height: 11 });

    // 3. Shelter 3: Almacén Médico Sanitario (X: -28, Z: -24)
    const pharmacy = new THREE.Group();
    pharmacy.position.set(-28, 0, -24);

    const clinicBase = new THREE.Mesh(new THREE.BoxGeometry(7, 3.8, 7), concreteMat);
    clinicBase.position.y = 1.9;
    clinicBase.castShadow = true;
    clinicBase.receiveShadow = true;
    pharmacy.add(clinicBase);

    // Medical Red Cross sign
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    crossV.position.set(0, 2.8, 3.6);
    pharmacy.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    crossH.position.set(0, 2.8, 3.6);
    pharmacy.add(crossH);

    // Cyan Strobe Survival Light
    const cyanLight = new THREE.PointLight(0x06b6d4, 2.0, 15);
    cyanLight.position.set(0, 4.2, 0);
    pharmacy.add(cyanLight);

    this.group.add(pharmacy);
    this.obstacles.push({ x: -28, z: -24, radius: 4.2, height: 4 });
  }
}
