import * as THREE from 'three';
import { CollectibleItem } from '../types/game';

interface Item3DInstance {
  data: CollectibleItem;
  group: THREE.Group;
  beacon: THREE.Mesh;
  particles?: THREE.Points;
  baseY: number;
}

export class CollectiblesManager {
  public group: THREE.Group;
  public items: Item3DInstance[] = [];
  private animTime: number = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.spawnDefaultWorldItems();
  }

  private spawnDefaultWorldItems() {
    const defaultList: CollectibleItem[] = [
      {
        id: 'item_rifle_1',
        name: 'Fusil Táctico MK-IV',
        description: 'Arma de precisión con mira holográfica y selector de ráfagas.',
        category: 'weapon',
        count: 1,
        icon: 'Crosshair',
        position: [4, 0.4, -6],
        color: '#38bdf8',
        modelType: 'rifle',
      },
      {
        id: 'item_medkit_1',
        name: 'Botiquín de Estimulantes',
        description: 'Restaura +30 de Salud instantáneamente mediante nanobots médicos.',
        category: 'medical',
        count: 1,
        icon: 'HeartPulse',
        position: [-6, 0.35, -4],
        color: '#10b981',
        modelType: 'medkit',
      },
      {
        id: 'item_powercell_1',
        name: 'Núcleo de Energía de Plasma',
        description: 'Batería de alta densidad para reactores de supervivencia y recarga.',
        category: 'energy',
        count: 1,
        icon: 'Zap',
        position: [12, 0.35, -14],
        color: '#f59e0b',
        modelType: 'powercell',
      },
      {
        id: 'item_crate_1',
        name: 'Caja de Suministros Militares',
        description: 'Contiene raciones concentradas, bengalas y filtros de aire.',
        category: 'ammo',
        count: 1,
        icon: 'Box',
        position: [-16, 0.45, 6],
        color: '#f97316',
        modelType: 'crate',
      },
      {
        id: 'item_scrap_1',
        name: 'Aleación de Titanio',
        description: 'Material de construcción recuperado para reparar equipo y refugios.',
        category: 'resource',
        count: 2,
        icon: 'Shield',
        position: [6, 0.3, 14],
        color: '#94a3b8',
        modelType: 'scrap',
      },
      {
        id: 'item_medkit_2',
        name: 'Inyector de Adrenalina',
        description: 'Estabilizador de signos vitales para condiciones extremas.',
        category: 'medical',
        count: 1,
        icon: 'HeartPulse',
        position: [20, 0.35, 8],
        color: '#10b981',
        modelType: 'medkit',
      },
      {
        id: 'item_powercell_2',
        name: 'Célula de Flujo Fotónico',
        description: 'Generador compacto de microondas y recarga de sistemas.',
        category: 'energy',
        count: 1,
        icon: 'Zap',
        position: [-10, 0.35, -26],
        color: '#38bdf8',
        modelType: 'powercell',
      },
      {
        id: 'item_scrap_2',
        name: 'Placas de Grafeno Reforzado',
        description: 'Blindaje ultraligero de alta resistencia al impacto.',
        category: 'resource',
        count: 3,
        icon: 'Shield',
        position: [-22, 0.3, -8],
        color: '#94a3b8',
        modelType: 'scrap',
      },
    ];

    defaultList.forEach((item) => this.addItem(item));
  }

  public addItem(item: CollectibleItem) {
    const itemGroup = new THREE.Group();
    itemGroup.position.set(...item.position);

    const color = new THREE.Color(item.color);

    // 1. Procedural 3D model according to modelType
    let modelMesh: THREE.Group;
    switch (item.modelType) {
      case 'rifle':
        modelMesh = this.buildRifleModel(color);
        break;
      case 'medkit':
        modelMesh = this.buildMedkitModel(color);
        break;
      case 'powercell':
        modelMesh = this.buildPowercellModel(color);
        break;
      case 'crate':
        modelMesh = this.buildCrateModel(color);
        break;
      case 'scrap':
      default:
        modelMesh = this.buildScrapModel(color);
        break;
    }

    itemGroup.add(modelMesh);

    // 2. Vertical luminous light beacon / pillar
    const beaconGeo = new THREE.CylinderGeometry(0.04, 0.25, 4.5, 8, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 2.25;
    itemGroup.add(beacon);

    // 3. Ground ring marker
    const ringGeo = new THREE.RingGeometry(0.35, 0.45, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    itemGroup.add(ring);

    this.group.add(itemGroup);

    this.items.push({
      data: item,
      group: itemGroup,
      beacon,
      baseY: item.position[1],
    });
  }

  private buildRifleModel(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.25,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.65), mat);
    g.add(body);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), mat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, 0.45);
    g.add(barrel);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.25), mat);
    stock.position.set(0, -0.02, -0.42);
    g.add(stock);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.12), accent);
    sight.position.set(0, 0.11, 0.05);
    g.add(sight);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.12), accent);
    mag.position.set(0, -0.15, 0.1);
    mag.rotation.x = 0.2;
    g.add(mag);

    g.scale.set(1.4, 1.4, 1.4);
    return g;
  }

  private buildMedkitModel(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.2,
    });
    const crossMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
    });

    // Medical Case
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.2), caseMat);
    c.castShadow = true;
    g.add(c);

    // Red/Green cross
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.21), crossMat);
    g.add(crossV);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.21), crossMat);
    g.add(crossH);

    // Handle
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    handle.position.set(0, 0.18, 0);
    g.add(handle);

    g.scale.set(1.5, 1.5, 1.5);
    return g;
  }

  private buildPowercellModel(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const coreMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16), coreMat);
    g.add(core);

    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), metalMat);
    capTop.position.y = 0.25;
    g.add(capTop);

    const capBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), metalMat);
    capBottom.position.y = -0.25;
    g.add(capBottom);

    // Ring stabilizer
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 16), coreMat);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);

    g.scale.set(1.4, 1.4, 1.4);
    return g;
  }

  private buildCrateModel(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      metalness: 0.4,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), crateMat);
    g.add(box);

    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.47, 0.1), accentMat);
    g.add(strap1);

    const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.47, 0.57), accentMat);
    g.add(strap2);

    g.scale.set(1.3, 1.3, 1.3);
    return g;
  }

  private buildScrapModel(color: THREE.Color): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Mechanical gear or plate cluster
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 6), mat);
    g.add(plate);

    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 6), mat);
    bolt.position.y = 0.06;
    g.add(bolt);

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), mat);
    pipe.rotation.z = Math.PI / 3;
    g.add(pipe);

    g.scale.set(1.5, 1.5, 1.5);
    return g;
  }

  /**
   * Continuous hovering, bobbing and rotation of items in world
   */
  public update(delta: number) {
    this.animTime += delta;

    this.items.forEach((item) => {
      if (!item.data.collected) {
        // Continuous rotation
        item.group.rotation.y += delta * 1.5;
        // Smooth floating bob
        item.group.position.y = item.baseY + Math.sin(this.animTime * 2.8) * 0.12;

        // Subtle beacon pulse
        if (item.beacon) {
          const mat = item.beacon.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.25 + Math.sin(this.animTime * 4) * 0.1;
        }
      }
    });
  }

  /**
   * Finds the closest collectible item to player within interaction distance
   */
  public getNearbyItem(playerPos: THREE.Vector3, maxDist: number = 2.8): CollectibleItem | null {
    let closestItem: CollectibleItem | null = null;
    let closestDist = maxDist;

    for (const item of this.items) {
      if (item.data.collected) continue;

      const itemPos = item.group.position;
      const dx = playerPos.x - itemPos.x;
      const dz = playerPos.z - itemPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < closestDist) {
        closestDist = dist;
        closestItem = item.data;
      }
    }

    return closestItem;
  }

  /**
   * Collects item: hides 3D object and removes it from active list
   */
  public collectItem(id: string): CollectibleItem | null {
    const found = this.items.find((item) => item.data.id === id);
    if (!found || found.data.collected) return null;

    found.data.collected = true;

    // Smooth vanish scale down
    const startScale = found.group.scale.x;
    let t = 0;
    const shrink = () => {
      t += 0.15;
      const s = THREE.MathUtils.lerp(startScale, 0.01, t);
      found.group.scale.set(s, s, s);
      if (t < 1) {
        requestAnimationFrame(shrink);
      } else {
        found.group.visible = false;
        this.group.remove(found.group);
      }
    };
    shrink();

    return found.data;
  }
}
