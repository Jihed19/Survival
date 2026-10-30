import * as THREE from 'three';
import { WeatherType, WeatherState } from '../types/game';
import { SpatialAudioManager } from '../audio/SpatialAudioManager';

export class WeatherSystem {
  public currentWeather: WeatherType = 'heavy_rain';
  private scene: THREE.Scene;
  private audioManager: SpatialAudioManager;

  // Rain Particles
  private rainParticles: THREE.Points;
  private rainCount: number = 2000;
  private rainGeometry: THREE.BufferGeometry;

  // Lightning / Thunder
  private lightningLight: THREE.PointLight;
  private lightningTimer: number = 6;
  private isFlashing: boolean = false;

  // Target asphalt mesh for wet puddles reflection
  private asphaltMesh?: THREE.Mesh;

  constructor(scene: THREE.Scene, audioManager: SpatialAudioManager, asphaltMesh?: THREE.Mesh) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.asphaltMesh = asphaltMesh;

    // 1. Rain Particles
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 35;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    scene.add(this.rainParticles);

    // 2. Sudden Lightning Flash Light
    this.lightningLight = new THREE.PointLight(0xdbeafe, 0, 150);
    this.lightningLight.position.set(0, 40, 0);
    scene.add(this.lightningLight);

    this.applyWeather(this.currentWeather);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.applyWeather(type);
  }

  private applyWeather(type: WeatherType) {
    const isRaining = type === 'heavy_rain' || type === 'storm_night';
    this.rainParticles.visible = isRaining;

    // Adjust asphalt wetness
    if (this.asphaltMesh) {
      const mat = this.asphaltMesh.material as THREE.MeshStandardMaterial;
      if (isRaining) {
        mat.roughness = 0.3; // Wet slick reflections
        mat.metalness = 0.4;
      } else {
        mat.roughness = 0.85;
        mat.metalness = 0.1;
      }
    }

    // Dynamic Fog
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      if (type === 'heavy_rain') {
        this.scene.fog.density = 0.022;
        this.scene.fog.color.setHex(0x111827);
      } else if (type === 'toxic_fog') {
        this.scene.fog.density = 0.038;
        this.scene.fog.color.setHex(0x14281d); // Murky greenish toxic fog
      } else if (type === 'storm_night') {
        this.scene.fog.density = 0.026;
        this.scene.fog.color.setHex(0x050814);
      } else {
        this.scene.fog.density = 0.012;
      }
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, isNight: boolean) {
    // Follow player position so rain covers visible volume
    this.rainParticles.position.x = playerPos.x;
    this.rainParticles.position.z = playerPos.z;

    const isRaining = this.currentWeather === 'heavy_rain' || this.currentWeather === 'storm_night';

    if (isRaining) {
      const positions = this.rainGeometry.attributes.position.array as Float32Array;
      const fallSpeed = 38 * delta;

      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= fallSpeed;
        if (positions[i] < 0) {
          positions[i] = 30 + Math.random() * 5;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;

      // Random Lightning Thunderstrike
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.triggerLightning();
        this.lightningTimer = 8 + Math.random() * 14;
      }
    }

    if (this.isFlashing) {
      this.lightningLight.intensity = Math.max(0, this.lightningLight.intensity - delta * 25);
      if (this.lightningLight.intensity <= 0) {
        this.isFlashing = false;
      }
    }
  }

  private triggerLightning() {
    this.isFlashing = true;
    this.lightningLight.intensity = 4.5;
    this.audioManager.playThunder();
  }

  public getWeatherState(): WeatherState {
    const isRaining = this.currentWeather === 'heavy_rain' || this.currentWeather === 'storm_night';
    return {
      current: this.currentWeather,
      rainIntensity: isRaining ? 0.8 : 0,
      fogDensity: (this.scene.fog as THREE.FogExp2)?.density || 0.015,
      thunderActive: this.isFlashing,
    };
  }
}
