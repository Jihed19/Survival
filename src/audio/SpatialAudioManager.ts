import * as THREE from 'three';

/**
 * Three.js Spatial Audio Manager using AudioListener & PositionalAudio
 * with 100% procedural zero-dependency audio buffers.
 */
export class SpatialAudioManager {
  public listener: THREE.AudioListener;
  public enabled: boolean = true;
  private audioContext: AudioContext;

  // Cached procedural audio buffers
  private gunshotBuffer: AudioBuffer | null = null;
  private infectedGroanBuffer: AudioBuffer | null = null;
  private bruteRoarBuffer: AudioBuffer | null = null;
  private rainBuffer: AudioBuffer | null = null;
  private thunderBuffer: AudioBuffer | null = null;
  private reloadBuffer: AudioBuffer | null = null;

  constructor(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.audioContext = this.listener.context;

    this.generateProceduralBuffers();
  }

  public resume() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  private generateProceduralBuffers() {
    const ctx = this.audioContext;

    // 1. Gunshot Buffer (Heavy caliber rifle crack + low boom)
    this.gunshotBuffer = this.createBuffer(0.5, (channel, sampleRate) => {
      for (let i = 0; i < channel.length; i++) {
        const t = i / sampleRate;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 18);
        const boom = Math.sin(2 * Math.PI * 85 * Math.exp(-t * 10) * t) * Math.exp(-t * 8);
        channel[i] = noise * 0.7 + boom * 0.5;
      }
    });

    // 2. Infected Zombie Groan Buffer (Eerie guttural rasping breath)
    this.infectedGroanBuffer = this.createBuffer(1.4, (channel, sampleRate) => {
      for (let i = 0; i < channel.length; i++) {
        const t = i / sampleRate;
        const base = Math.sin(2 * Math.PI * (60 + Math.sin(t * 8) * 15) * t);
        const rasp = (Math.random() * 2 - 1) * 0.35 * Math.sin(t * 12);
        const env = Math.sin((t / 1.4) * Math.PI) * Math.exp(-t * 0.4);
        channel[i] = (base + rasp) * env * 0.45;
      }
    });

    // 3. Mutated Brute Roar Buffer (Deep vibrating sub-bass roar)
    this.bruteRoarBuffer = this.createBuffer(1.8, (channel, sampleRate) => {
      for (let i = 0; i < channel.length; i++) {
        const t = i / sampleRate;
        const f = 45 + Math.sin(t * 4) * 20;
        const sub = Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * (f * 1.5) * t);
        const grit = (Math.random() * 2 - 1) * 0.5;
        const env = Math.sin((t / 1.8) * Math.PI) * 0.6;
        channel[i] = (sub + grit) * env;
      }
    });

    // 4. Rain & Thunder Ambient Buffers
    this.rainBuffer = this.createBuffer(2.0, (channel) => {
      let lastOut = 0.0;
      for (let i = 0; i < channel.length; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter approximation
        lastOut = (lastOut * 0.95) + (white * 0.05);
        channel[i] = lastOut * 0.25;
      }
    });

    this.thunderBuffer = this.createBuffer(2.5, (channel, sampleRate) => {
      for (let i = 0; i < channel.length; i++) {
        const t = i / sampleRate;
        const rumble = (Math.random() * 2 - 1) * Math.exp(-t * 1.5);
        const sub = Math.sin(2 * Math.PI * (35 + Math.sin(t * 2) * 10) * t) * Math.exp(-t * 0.8);
        channel[i] = (rumble * 0.5 + sub * 0.6) * 0.7;
      }
    });

    // 5. Reload Mechanical Click
    this.reloadBuffer = this.createBuffer(0.4, (channel, sampleRate) => {
      for (let i = 0; i < channel.length; i++) {
        const t = i / sampleRate;
        const click1 = (t > 0.05 && t < 0.1) ? (Math.random() * 2 - 1) : 0;
        const click2 = (t > 0.25 && t < 0.32) ? (Math.random() * 2 - 1) * 1.2 : 0;
        channel[i] = (click1 + click2) * 0.5;
      }
    });
  }

  private createBuffer(duration: number, fill: (channel: Float32Array, sampleRate: number) => void): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channel = buffer.getChannelData(0);
    fill(channel, sampleRate);
    return buffer;
  }

  /**
   * Attaches a PositionalAudio 3D source to an Object3D in the world.
   */
  public attachPositionalAudio(target: THREE.Object3D, refDistance: number = 8, maxDistance: number = 40): THREE.PositionalAudio {
    const sound = new THREE.PositionalAudio(this.listener);
    sound.setRefDistance(refDistance);
    sound.setMaxDistance(maxDistance);
    sound.setRolloffFactor(1.2);
    sound.setDistanceModel('exponential');
    target.add(sound);
    return sound;
  }

  public playPositionalSound(audio: THREE.PositionalAudio, type: 'groan' | 'brute' | 'gunshot') {
    if (!this.enabled) return;
    this.resume();

    try {
      if (audio.isPlaying) audio.stop();

      let buf: AudioBuffer | null = null;
      if (type === 'groan') buf = this.infectedGroanBuffer;
      else if (type === 'brute') buf = this.bruteRoarBuffer;
      else if (type === 'gunshot') buf = this.gunshotBuffer;

      if (buf) {
        audio.setBuffer(buf);
        audio.setVolume(type === 'brute' ? 1.0 : 0.75);
        audio.play();
      }
    } catch {}
  }

  public playGunshot() {
    if (!this.enabled) return;
    this.resume();
    try {
      const sound = new THREE.Audio(this.listener);
      if (this.gunshotBuffer) {
        sound.setBuffer(this.gunshotBuffer);
        sound.setVolume(0.85);
        sound.play();
      }
    } catch {}
  }

  public playReload() {
    if (!this.enabled) return;
    this.resume();
    try {
      const sound = new THREE.Audio(this.listener);
      if (this.reloadBuffer) {
        sound.setBuffer(this.reloadBuffer);
        sound.setVolume(0.6);
        sound.play();
      }
    } catch {}
  }

  public playThunder() {
    if (!this.enabled) return;
    this.resume();
    try {
      const sound = new THREE.Audio(this.listener);
      if (this.thunderBuffer) {
        sound.setBuffer(this.thunderBuffer);
        sound.setVolume(0.7);
        sound.play();
      }
    } catch {}
  }
}
