import { SoundType } from '../types';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private currentType: SoundType = 'off';
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentSound(): SoundType {
    return this.currentType;
  }

  public play(type: SoundType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.currentType === type) {
      return;
    }

    this.stop();

    if (type === 'off') {
      this.currentType = 'off';
      return;
    }

    this.currentType = type;

    switch (type) {
      case 'rain':
        this.createRainSound();
        break;
      case 'waves':
        this.createWavesSound();
        break;
      case 'fire':
        this.createFireSound();
        break;
      case 'forest':
        this.createForestSound();
        break;
    }
  }

  public stop() {
    if (this.activeNodes.length > 0) {
      for (const node of this.activeNodes) {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }
      this.activeNodes = [];
    }
    this.currentType = 'off';
  }

  // Generates Pink Noise Buffer (Rain / Natural textures)
  private createNoiseBuffer(seconds: number = 4): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(5);
    noise.loop = true;

    // Filter for gentle rain
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(150, this.ctx.currentTime);

    noise.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, lowpass, highpass);
  }

  private createWavesSound() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(6);
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO to simulate wave swell
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8s wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain);
  }

  private createFireSound() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter);
  }

  private createForestSound() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(5);
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain);
  }
}

export const soundManager = new SoundSynthesizer();
