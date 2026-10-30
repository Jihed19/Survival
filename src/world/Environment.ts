import * as THREE from 'three';

export interface CollisionObstacle {
  x: number;
  z: number;
  radius: number;
  height: number;
}

/**
 * Procedural Open-World Survival Environment
 * Creates terrain, shelter habitats, cargo containers, watchtowers, barriers, and rocks.
 */
export class SurvivalEnvironment {
  public group: THREE.Group;
  public obstacles: CollisionObstacle[] = [];
  public dustParticles: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // 1. Procedural Terrain Grid & Ground
    this.createTerrain();

    // 2. Modular Survival Shelter / Base Bunker
    this.createShelterBunker(0, -22);

    // 3. Stacked & Scattered Cargo Shipping Containers
    this.createContainerCluster(18, -12);
    this.createContainerCluster(-20, 10);
    this.createSingleContainer(-15, -18, 0x0284c7, Math.PI / 4);
    this.createSingleContainer(22, 16, 0xd97706, -Math.PI / 6);

    // 4. Observation Watchtower
    this.createWatchtower(-12, -32);
    this.createWatchtower(26, -30);

    // 5. Tactical Concrete Barriers & Cover Walls
    this.createBarrierWall(0, -8, 5, 0);
    this.createBarrierWall(-10, 2, 4, Math.PI / 3);
    this.createBarrierWall(12, 4, 4, -Math.PI / 4);

    // 6. Scattered Rocks & Boulders
    this.createRockScatter();

    // 7. Industrial Fuel & Coolant Barrels
    this.createBarrels(8, -18);
    this.createBarrels(-18, 18);
    this.createBarrels(14, 8);

    // 8. Communication Satellite Relay Dish
    this.createCommsRelay(-28, -8);

    // 9. Floating Atmospheric Dust Motes
    this.dustParticles = this.createDustMotes();
    this.group.add(this.dustParticles);
  }

  private createTerrain() {
    // Canvas texture for ground: tactical grid + terrain grit
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirt / dark asphalt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Noise grit
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(25 + Math.random() * 25);
      ctx.fillStyle = `rgb(${gray}, ${gray + 4}, ${gray + 8})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Modern tactical survival grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 2;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Grid coordinate markings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= 512; x += 128) {
      for (let y = 0; y <= 512; y += 128) {
        ctx.strokeRect(x - 6, y - 6, 12, 12);
      }
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(40, 40);
    groundTex.colorSpace = THREE.SRGBColorSpace;

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.9,
      metalness: 0.15,
    });

    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.group.add(groundMesh);

    // Perimeter mountain cliffs to contain world naturally
    this.createPerimeterMountains();
  }

  private createPerimeterMountains() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });

    const count = 48;
    const radius = 95;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.sin(i * 3.7) * 10);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const height = 12 + Math.abs(Math.sin(i * 2.3)) * 14;
      const width = 10 + Math.random() * 8;
      const geo = new THREE.ConeGeometry(width, height, 6);
      const cliff = new THREE.Mesh(geo, rockMat);
      cliff.position.set(x, height / 2 - 1, z);
      cliff.rotation.y = Math.random() * Math.PI;
      cliff.castShadow = true;
      cliff.receiveShadow = true;
      this.group.add(cliff);

      this.obstacles.push({ x, z, radius: width * 0.75, height });
    }
  }

  private createShelterBunker(bx: number, bz: number) {
    const bunker = new THREE.Group();
    bunker.position.set(bx, 0, bz);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.7,
    });

    const darkTrim = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.3,
    });

    const lightGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    // Main Habitat Structure (6m x 3.2m x 9m)
    const baseGeo = new THREE.BoxGeometry(6.4, 3.4, 9.2);
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.y = 1.7;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    bunker.add(baseMesh);

    // Beveled / Sloped Roof Panels
    const roofGeo = new THREE.BoxGeometry(6.8, 0.4, 9.6);
    const roofMesh = new THREE.Mesh(roofGeo, darkTrim);
    roofMesh.position.y = 3.5;
    roofMesh.castShadow = true;
    bunker.add(roofMesh);

    // Solar panels on roof
    for (let sz = -3; sz <= 3; sz += 2) {
      const solarGeo = new THREE.BoxGeometry(5.2, 0.1, 1.4);
      const solarMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.9,
      });
      const panel = new THREE.Mesh(solarGeo, solarMat);
      panel.position.set(0, 3.75, sz);
      bunker.add(panel);
    }

    // Airlock Door Frame
    const doorFrameGeo = new THREE.BoxGeometry(2.4, 2.6, 0.4);
    const doorFrame = new THREE.Mesh(doorFrameGeo, darkTrim);
    doorFrame.position.set(0, 1.3, 4.7);
    bunker.add(doorFrame);

    // Neon Door Status Strip
    const doorLightGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1);
    const doorLight = new THREE.Mesh(doorLightGeo, lightGlowMat);
    doorLight.position.set(0, 2.5, 4.9);
    bunker.add(doorLight);

    // Exterior Air Vent / HVAC unit
    const hvacGeo = new THREE.BoxGeometry(1.4, 1.4, 1.2);
    const hvac = new THREE.Mesh(hvacGeo, darkTrim);
    hvac.position.set(-3.5, 1.2, 0);
    hvac.castShadow = true;
    bunker.add(hvac);

    // Base Signage: "SECTOR 04 - REFUGIO ALFA"
    const signGeo = new THREE.BoxGeometry(3.0, 0.5, 0.1);
    const sign = new THREE.Mesh(signGeo, new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }));
    sign.position.set(0, 2.9, 4.7);
    bunker.add(sign);

    this.group.add(bunker);

    // Obstacle bounds
    this.obstacles.push({ x: bx, z: bz, radius: 4.6, height: 4 });
  }

  private createContainerCluster(cx: number, cz: number) {
    this.createSingleContainer(cx, cz, 0xe11d48, 0); // Red container
    this.createSingleContainer(cx + 3.2, cz + 1.5, 0x0284c7, 0.1); // Blue container
    this.createSingleContainer(cx - 0.5, cz + 0.8, 0xf59e0b, 0.05, 2.6); // Stacked yellow on top
    this.createSingleContainer(cx - 3.4, cz - 1.2, 0x16a34a, -0.2); // Green container
  }

  private createSingleContainer(
    x: number,
    z: number,
    colorHex: number,
    rotY: number = 0,
    yPos: number = 0
  ) {
    const container = new THREE.Group();
    container.position.set(x, yPos, z);
    container.rotation.y = rotY;

    const width = 2.6;
    const height = 2.6;
    const length = 6.2;

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.65,
      metalness: 0.4,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.8,
      metalness: 0.6,
    });

    // Main box
    const boxGeo = new THREE.BoxGeometry(width, height, length);
    const box = new THREE.Mesh(boxGeo, mat);
    box.position.y = height / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    container.add(box);

    // Corrugated rib details on sides (3 distinct accents)
    for (let rz = -2.5; rz <= 2.5; rz += 0.8) {
      const ribGeo = new THREE.BoxGeometry(width + 0.08, height - 0.2, 0.15);
      const rib = new THREE.Mesh(ribGeo, darkMat);
      rib.position.set(0, height / 2, rz);
      rib.castShadow = true;
      container.add(rib);
    }

    // Corner castings
    for (let cx = -1; cx <= 1; cx += 2) {
      for (let cz = -1; cz <= 1; cz += 2) {
        const cornerGeo = new THREE.BoxGeometry(0.2, height, 0.2);
        const corner = new THREE.Mesh(cornerGeo, darkMat);
        corner.position.set(cx * (width / 2), height / 2, cz * (length / 2));
        container.add(corner);
      }
    }

    this.group.add(container);

    if (yPos === 0) {
      this.obstacles.push({ x, z, radius: 2.5, height });
    }
  }

  private createWatchtower(wx: number, wz: number) {
    const tower = new THREE.Group();
    tower.position.set(wx, 0, wz);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.75,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });

    const height = 7.5;
    const legSpread = 2.2;

    // 4 Structural legs
    for (let lx = -1; lx <= 1; lx += 2) {
      for (let lz = -1; lz <= 1; lz += 2) {
        const legGeo = new THREE.CylinderGeometry(0.08, 0.12, height, 8);
        const leg = new THREE.Mesh(legGeo, metalMat);
        leg.position.set(lx * legSpread, height / 2, lz * legSpread);
        leg.castShadow = true;
        tower.add(leg);
      }
    }

    // Cross-bracing struts
    for (let h = 2; h < height; h += 2.2) {
      const braceX = new THREE.Mesh(new THREE.BoxGeometry(legSpread * 2, 0.08, 0.08), metalMat);
      braceX.position.set(0, h, legSpread);
      tower.add(braceX);

      const braceBack = new THREE.Mesh(new THREE.BoxGeometry(legSpread * 2, 0.08, 0.08), metalMat);
      braceBack.position.set(0, h, -legSpread);
      tower.add(braceBack);
    }

    // Observation deck platform
    const platformGeo = new THREE.BoxGeometry(5.4, 0.3, 5.4);
    const platform = new THREE.Mesh(platformGeo, floorMat);
    platform.position.y = height;
    platform.castShadow = true;
    platform.receiveShadow = true;
    tower.add(platform);

    // Guard rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.5 });
    const railNorth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 0.08), railMat);
    railNorth.position.set(0, height + 0.5, 2.5);
    tower.add(railNorth);

    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 0.08), railMat);
    railSouth.position.set(0, height + 0.5, -2.5);
    tower.add(railSouth);

    // Searchlight fixture
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
    });
    const searchLight = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.5, 8), lightMat);
    searchLight.position.set(1.5, height + 1.2, 2.2);
    searchLight.rotation.x = Math.PI / 3;
    tower.add(searchLight);

    this.group.add(tower);
    this.obstacles.push({ x: wx, z: wz, radius: 2.8, height });
  }

  private createBarrierWall(bx: number, bz: number, count: number, angle: number) {
    const wall = new THREE.Group();
    wall.position.set(bx, 0, bz);
    wall.rotation.y = angle;

    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Concrete
      roughness: 0.9,
      metalness: 0.1,
    });

    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Yellow hazard
      roughness: 0.5,
    });

    for (let i = 0; i < count; i++) {
      const zOffset = (i - count / 2) * 1.8;
      const barrierGeo = new THREE.BoxGeometry(0.6, 0.9, 1.7);
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(0, 0.45, zOffset);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      wall.add(barrier);

      // Warning stripe decal
      const stripeGeo = new THREE.BoxGeometry(0.62, 0.15, 1.4);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0, 0.7, zOffset);
      wall.add(stripe);

      // Calculate global coordinate for obstacle
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const worldX = bx - sinA * zOffset;
      const worldZ = bz + cosA * zOffset;
      this.obstacles.push({ x: worldX, z: worldZ, radius: 0.7, height: 1 });
    }

    this.group.add(wall);
  }

  private createRockScatter() {
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });

    const rockCoords: [number, number, number][] = [
      [10, -5, 1.4],
      [-8, 12, 1.8],
      [15, 24, 2.2],
      [-24, -14, 2.5],
      [6, 30, 1.6],
      [-14, 28, 2.0],
      [28, -8, 1.9],
      [-5, -15, 1.2],
    ];

    rockCoords.forEach(([rx, rz, scale]) => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(rx, scale * 0.7, rz);
      rock.scale.set(scale * 1.2, scale * 0.9, scale * 1.1);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);

      this.obstacles.push({ x: rx, z: rz, radius: scale * 0.9, height: scale });
    });
  }

  private createBarrels(bx: number, bz: number) {
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Hazardous bio green
      roughness: 0.4,
      metalness: 0.7,
    });

    const offsets: [number, number][] = [
      [0, 0],
      [0.8, 0.2],
      [-0.4, 0.7],
    ];

    offsets.forEach(([ox, oz]) => {
      const bGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.05, 12);
      const bMesh = new THREE.Mesh(bGeo, barrelMat);
      bMesh.position.set(bx + ox, 0.525, bz + oz);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.group.add(bMesh);

      this.obstacles.push({ x: bx + ox, z: bz + oz, radius: 0.4, height: 1.1 });
    });
  }

  private createCommsRelay(rx: number, rz: number) {
    const comms = new THREE.Group();
    comms.position.set(rx, 0, rz);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.3,
    });

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 5.5, 8), metalMat);
    mast.position.y = 2.75;
    mast.castShadow = true;
    comms.add(mast);

    // Parabolic Satellite Dish
    const dishGeo = new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35);
    const dish = new THREE.Mesh(dishGeo, metalMat);
    dish.position.set(0, 5.2, 0);
    dish.rotation.x = -Math.PI / 3;
    dish.castShadow = true;
    comms.add(dish);

    // Center transceiver
    const probe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 })
    );
    probe.position.set(0, 5.6, 0.8);
    probe.rotation.x = -Math.PI / 3;
    comms.add(probe);

    this.group.add(comms);
    this.obstacles.push({ x: rx, z: rz, radius: 1.2, height: 6 });
  }

  private createDustMotes(): THREE.Points {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = 0.5 + Math.random() * 8;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  public update(delta: number) {
    // Gentle drift for dust motes
    const positions = this.dustParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] += delta * 0.15;
      if (positions[i] > 9) {
        positions[i] = 0.5;
      }
    }
    this.dustParticles.geometry.attributes.position.needsUpdate = true;
  }
}
