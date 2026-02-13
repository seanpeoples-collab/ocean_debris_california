// Ocean Debris Sonification Project - audioService.ts
import { DebrisLocation, DebrisLevel } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private globalFilter: BiquadFilterNode | null = null;
  
  // FX Nodes
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  private oscillators: OscillatorNode[] = [];
  private activeNodes: AudioNode[] = [];
  private baseFrequencies: number[] = []; // Track original freqs for detuning
  private collisionTimer: number | null = null; 
  
  // Real-time params
  private currentDissonanceMultiplier: number = 1;

  public async initialize() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Signal Chain: Oscillators -> Global Filter -> Master Gain -> Destination
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      
      this.globalFilter = this.ctx.createBiquadFilter();
      this.globalFilter.type = 'lowpass';
      this.globalFilter.frequency.setValueAtTime(20000, this.ctx.currentTime); // Open by default
      this.globalFilter.Q.value = 1;

      // --- FX CHAIN: Abyssal Echo (Stereo Delay) ---
      this.delayNode = this.ctx.createDelay(5.0);
      this.delayNode.delayTime.value = 0.4; // 400ms delay

      this.feedbackGain = this.ctx.createGain();
      this.feedbackGain.gain.value = 0.4; // 40% feedback

      this.wetGain = this.ctx.createGain();
      this.wetGain.gain.value = 0.25; // Subtle echo level

      // Routing:
      // 1. Dry Path
      this.globalFilter.connect(this.masterGain);
      
      // 2. Wet Path (Echo)
      this.globalFilter.connect(this.delayNode);
      this.delayNode.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);
      
      // 3. Feedback Loop
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode);

      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  // Optimization Tool: Spectral Filter
  public setFilterFrequency(normalizedVal: number) {
      if (this.globalFilter && this.ctx) {
          // Map 0-1 to 100Hz - 20000Hz (Logarithmic feeling)
          const minFreq = 100;
          const maxFreq = 20000;
          const freq = minFreq * Math.pow(maxFreq / minFreq, normalizedVal);
          this.globalFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
      }
  }

  // Optimization Tool: Harmonic Divergence
  public setDissonance(multiplier: number) {
      this.currentDissonanceMultiplier = multiplier;
      
      // Safety check
      if (!this.ctx || this.oscillators.length === 0) return;

      const now = this.ctx.currentTime;

      // Iterate through oscillator pairs (LFO, Oscillator)
      // The array structure is [LFO, Osc, LFO, Osc, ...]
      for (let i = 0; i < this.oscillators.length; i += 2) {
          const lfo = this.oscillators[i];
          const osc = this.oscillators[i + 1];

          if (!osc || !lfo) continue;

          // voiceIndex determines harmonic position (0 = fundamental, 1 = first harmonic, etc.)
          const voiceIndex = i / 2;

          // 1. Calculate Detune
          // We apply stronger detuning to higher harmonics
          // Formula: Exponential scaling based on multiplier
          
          const baseDetuneSpread = 50; // Cents
          
          // (multiplier^2 - 1) gives us a nice curve where 1->0 and 2.5->5.25
          const intensity = Math.pow(multiplier, 2.5) - 1; 

          // Higher voices get more detuned
          const detuneAmount = (voiceIndex + 0.5) * baseDetuneSpread * intensity;
          
          // Add chaotic random flux to the detune
          const randomFlux = (Math.random() * 20 - 10) * intensity;

          osc.detune.setTargetAtTime(detuneAmount + randomFlux, now, 0.2);

          // 2. Modulate LFO Rate (Wobble)
          // As dissonance increases, the modulation speed should increase/become chaotic
          if (multiplier > 1.2) {
             // Scale LFO speed up with dissonance
             const newLfoRate = 0.5 + (Math.random() * 8 * (multiplier - 1));
             lfo.frequency.setTargetAtTime(newLfoRate, now, 0.5);
          }
      }
  }

  public stopAll() {
    if (this.collisionTimer) {
        window.clearTimeout(this.collisionTimer);
        this.collisionTimer = null;
    }
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.activeNodes.forEach(node => {
      try {
        node.disconnect();
      } catch(e) { /* ignore */ }
    });
    this.oscillators = [];
    this.activeNodes = [];
    this.baseFrequencies = [];
  }

  public playData(location: DebrisLocation) {
    if (!this.ctx || !this.globalFilter) return;
    this.stopAll();

    this.playTelemetrySound();

    const now = this.ctx.currentTime;
    
    // Base frequency depends on latitude (lower = lower pitch)
    const baseFreq = 100 + ((location.coordinates[1] - 32) * 10); 

    // Determine complexity based on density
    let oscillatorCount = 2;
    let waveType: OscillatorType = 'sine';
    let inherentDissonance = 1.0;
    let modulationSpeed = 0.1;

    if (location.level === DebrisLevel.LOW) {
      oscillatorCount = 3;
      waveType = 'sine';
      inherentDissonance = 1.001; 
      modulationSpeed = 0.05;
    } else if (location.level === DebrisLevel.MODERATE) {
      oscillatorCount = 4;
      waveType = 'triangle';
      inherentDissonance = 1.02; 
      modulationSpeed = 0.5;
    } else if (location.level === DebrisLevel.HIGH) {
      oscillatorCount = 6;
      waveType = 'sawtooth';
      inherentDissonance = 1.10; 
      modulationSpeed = 2;
    } else {
      oscillatorCount = 8;
      waveType = 'sawtooth'; 
      inherentDissonance = 1.25; 
      modulationSpeed = 8;
    }

    // Create drone layers
    for (let i = 0; i < oscillatorCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      osc.type = i % 2 === 0 ? waveType : 'sine'; 
      
      let freq = baseFreq * (1 + (i * 0.5)); // Harmonic series base
      
      // Apply inherent dissonance + user multiplier (Initial state)
      const variance = 1 + (Math.random() * (inherentDissonance - 1) * this.currentDissonanceMultiplier);
      freq = freq * variance;
      
      this.baseFrequencies.push(freq); // Store for reference
      osc.frequency.setValueAtTime(freq, now);

      // Add simple LFO for movement
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = modulationSpeed * (Math.random() * 0.5 + 0.5);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 50 * (location.level === DebrisLevel.CRITICAL ? 5 : 1);
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      this.oscillators.push(lfo);
      this.activeNodes.push(lfoGain);

      // Panning
      panner.pan.value = (Math.random() * 2) - 1;

      // Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1 / oscillatorCount, now + 2); // Slow attack

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.globalFilter); // Echo enabled

      osc.start(now);
      
      this.oscillators.push(osc);
      this.activeNodes.push(gain, panner);
    }
    
    // Apply initial dissonance settings again to ensure consistency
    if (this.currentDissonanceMultiplier !== 1) {
        this.setDissonance(this.currentDissonanceMultiplier);
    }

    // Start Micro-Collisions
    this.startMicroCollisions(location.density);
  }

  // #3: UI Telemetry Sound - Subtle Click
  private playTelemetrySound() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      
      // Create a short noise burst for a mechanical click texture
      // 20ms of noise
      const bufferSize = this.ctx.sampleRate * 0.02; 
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5; // Scale amplitude
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Filter to create a sharp "tick" sound around 2500Hz
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2500; 
      filter.Q.value = 1;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      // Very fast decay
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain); // Connect to dry output
      
      noise.start(t);
  }

  // #2: Micro-Collision Textures
  private startMicroCollisions(density: number) {
      if (!this.ctx || !this.globalFilter) return;

      // Density range: ~15 (Low) to 1250 (Critical)
      // Low: Occasional drift wood click (every 2-3s)
      // High: Constant plastic rattle (every ~80ms)
      
      const normalized = Math.min(Math.max(density / 1000, 0), 1);
      
      // Rate calculation (Hz)
      // 0.2Hz (5s) to 12Hz (83ms)
      const minRate = 0.3;
      const maxRate = 12.0;
      const rate = minRate + (normalized * (maxRate - minRate));
      const interval = 1000 / rate;

      const scheduleClick = () => {
          if (!this.ctx || !this.globalFilter) return;

          // Add jitter to interval
          const nextTime = interval * (0.5 + Math.random());
          
          this.playClick(normalized);
          
          this.collisionTimer = window.setTimeout(scheduleClick, nextTime);
      };

      scheduleClick();
  }

  private playClick(intensity: number) {
      if (!this.ctx || !this.globalFilter) return;
      const t = this.ctx.currentTime;

      // Create noise burst
      const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Filter for material texture
      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      // Higher density = Higher pitch (plastic caps vs wood logs)
      const freq = 1000 + (Math.random() * 2000) + (intensity * 2000); 
      clickFilter.frequency.value = freq;
      clickFilter.Q.value = 5 + (intensity * 5); // Sharper click at high density

      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      
      panner.pan.value = (Math.random() * 2) - 1;
      
      // Volume: Clamped to be subtle texture
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(clickFilter);
      clickFilter.connect(gain);
      gain.connect(panner);
      panner.connect(this.globalFilter); // Send to Echo

      noise.start(t);
      noise.stop(t + 0.05);
      
      // Note: Nodes are garbage collected automatically after play
  }
}

export const audioService = new AudioService();