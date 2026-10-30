import * as THREE from 'three';
import { TimeState } from '../types/game';

export interface DayNightCallbacks {
  onTimeChange?: (timeState: TimeState) => void;
}

export class DayNightCycle {
  public timeHours: number = 14.0; // Starts at 14:00 (mid-afternoon)
  public timeSpeed: number = 1.0; // 1.0 = ~180s full day, 0 = paused, 4 = accelerated
  private cycleDurationSeconds: number = 180; // 3 minutes = 24 game hours

  // 3D Celestial Objects
  private sunLight: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private starsPoints: THREE.Points;
  private scene: THREE.Scene;

  // Orbit radius
  private orbitRadius: number = 85;

  private callbacks: DayNightCallbacks;

  constructor(scene: THREE.Scene, callbacks: DayNightCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    // 1. Directional Sun Light (Warm Key)
    this.sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 200;
    const d = 45;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;
    scene.add(this.sunLight);

    // 2. Visible Sun Orb
    const sunGeo = new THREE.SphereGeometry(3.2, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff7ed,
      fog: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(this.sunMesh);

    // 3. Directional Moon Light (Cool Fill for Night)
    this.moonLight = new THREE.DirectionalLight(0x60a5fa, 0.45);
    this.moonLight.castShadow = false;
    scene.add(this.moonLight);

    // 4. Visible Moon Orb
    const moonGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      fog: false,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(this.moonMesh);

    // 5. Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.65);
    scene.add(this.hemiLight);

    // 6. Deep Space Starfield (Appears at Night)
    this.starsPoints = this.createStarfield();
    scene.add(this.starsPoints);

    // Initial positioning
    this.update(0);
  }

  private createStarfield(): THREE.Points {
    const starCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      // Hemisphere distribution high in the sky
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15); // Above horizon
      const r = 160;

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.cos(phi);
      positions[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0,
      fog: false,
    });

    return new THREE.Points(geo, starMat);
  }

  public update(delta: number) {
    // Advance time
    if (this.timeSpeed > 0) {
      const hoursPerSecond = 24 / this.cycleDurationSeconds;
      this.timeHours = (this.timeHours + delta * hoursPerSecond * this.timeSpeed) % 24;
    }

    // Celestial Angle Calculation:
    // 6:00 AM is sunrise (y = 0 ascending)
    // 12:00 PM is midday zenith (y = max)
    // 18:00 PM is sunset (y = 0 descending)
    // 24:00 / 0:00 is midnight nadir (y = -max)
    const angle = ((this.timeHours - 6) / 24) * Math.PI * 2;
    const sunX = Math.cos(angle) * this.orbitRadius;
    const sunY = Math.sin(angle) * this.orbitRadius;
    const sunZ = Math.sin(angle * 0.5) * (this.orbitRadius * 0.4);

    this.sunLight.position.set(sunX, Math.max(0.1, sunY), sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    // Moon is directly opposite in orbit
    const moonAngle = angle + Math.PI;
    const moonX = Math.cos(moonAngle) * this.orbitRadius;
    const moonY = Math.sin(moonAngle) * this.orbitRadius;
    const moonZ = Math.sin(moonAngle * 0.5) * (this.orbitRadius * 0.4);

    this.moonLight.position.set(moonX, Math.max(0.1, moonY), moonZ);
    this.moonMesh.position.set(moonX, moonY, moonZ);

    // Determine day / twilight / night phases
    const sunElevation = sunY / this.orbitRadius; // -1 to 1
    const isNight = sunElevation < -0.05;

    // 1. Sun & Moon Intensities and Colors
    if (sunElevation > 0.15) {
      // Full Daytime
      this.sunLight.intensity = 1.35 * Math.sin(angle);
      this.sunLight.color.setHex(0xfffbeb);
      this.moonLight.intensity = 0.05;
      this.sunMesh.visible = true;
      this.moonMesh.visible = false;
    } else if (sunElevation > -0.1) {
      // Golden Hour / Dawn / Dusk Twilight
      const factor = (sunElevation + 0.1) / 0.25;
      this.sunLight.intensity = 0.9 * factor;
      this.sunLight.color.setHex(0xf97316); // Vibrant orange sunset
      this.moonLight.intensity = 0.25 * (1 - factor);
      this.sunMesh.visible = true;
      this.moonMesh.visible = true;
    } else {
      // Nighttime
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = 0.45;
      this.sunMesh.visible = false;
      this.moonMesh.visible = true;
    }

    // 2. Starfield Opacity
    const starMat = this.starsPoints.material as THREE.PointsMaterial;
    if (sunElevation < 0) {
      starMat.opacity = THREE.MathUtils.clamp(-sunElevation * 1.5, 0, 0.85);
    } else {
      starMat.opacity = 0;
    }

    // 3. Dynamic Horizon Fog & Sky Colors
    const daySkyColor = new THREE.Color(0x0f172a);
    const sunsetSkyColor = new THREE.Color(0x2d142c);
    const nightSkyColor = new THREE.Color(0x030712);

    let targetSky = daySkyColor;
    if (isNight) {
      targetSky = nightSkyColor;
    } else if (sunElevation < 0.2) {
      targetSky = sunsetSkyColor;
    }

    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(targetSky, 0.08);
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.lerp(targetSky, 0.08);
      }
    }

    // 4. Hemisphere Light Sky/Ground Adjustment
    if (isNight) {
      this.hemiLight.color.setHex(0x1e3a8a); // Night indigo sky
      this.hemiLight.groundColor.setHex(0x020617); // Dark ground
      this.hemiLight.intensity = 0.35;
    } else {
      this.hemiLight.color.setHex(0x38bdf8); // Sky blue
      this.hemiLight.groundColor.setHex(0x0f172a); // Slate ground
      this.hemiLight.intensity = 0.7;
    }

    // Notify UI
    if (this.callbacks.onTimeChange) {
      this.callbacks.onTimeChange(this.getTimeState());
    }
  }

  public getTimeState(): TimeState {
    const hours = Math.floor(this.timeHours);
    const minutes = Math.floor((this.timeHours % 1) * 60);
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    let periodName = 'MEDIODÍA';
    if (this.timeHours >= 5 && this.timeHours < 9) periodName = 'AMANECER';
    else if (this.timeHours >= 9 && this.timeHours < 13) periodName = 'MAÑANA';
    else if (this.timeHours >= 13 && this.timeHours < 17) periodName = 'TARDE';
    else if (this.timeHours >= 17 && this.timeHours < 21) periodName = 'ATARDECER';
    else periodName = 'NOCHE CERRADA';

    const isNight = this.timeHours < 5.5 || this.timeHours > 20.5;

    return {
      timeHours: this.timeHours,
      timeFormatted: formatted,
      periodName,
      isNight,
      timeSpeed: this.timeSpeed,
    };
  }

  public setSpeed(speed: number) {
    this.timeSpeed = speed;
  }

  public setTime(hours: number) {
    this.timeHours = hours % 24;
    this.update(0);
  }
}
