import { Platform } from 'react-native';

// Web Audio API-based ambient sound generator
// No files needed - generates sound procedurally

let audioCtx: AudioContext | null = null;
let activeNodes: AudioNode[] = [];
let gainNode: GainNode | null = null;

function getCtx() {
  if (!audioCtx && Platform.OS === 'web') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function stopAmbient() {
  activeNodes.forEach((n) => { try { (n as any).stop?.(); } catch {} });
  activeNodes = [];
  if (gainNode) { gainNode.disconnect(); gainNode = null; }
}

export function setAmbientVolume(vol: number) {
  if (gainNode) gainNode.gain.value = vol;
}

export function playAmbient(type: string, volume = 0.25) {
  if (Platform.OS !== 'web') return;
  stopAmbient();

  const ctx = getCtx();
  if (!ctx) return;

  gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  gainNode.connect(ctx.destination);

  switch (type) {
    case 'rain':
      createRain(ctx, gainNode);
      break;
    case 'ocean':
      createOcean(ctx, gainNode);
      break;
    case 'lofi':
      createLofi(ctx, gainNode);
      break;
    case 'forest':
      createForest(ctx, gainNode);
      break;
    case 'fire':
      createFire(ctx, gainNode);
      break;
  }
}

function createRain(ctx: AudioContext, dest: AudioNode) {
  // Brown noise filtered for rain-like sound
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (last + 0.02 * white) / 1.02;
    last = data[i];
    data[i] *= 3.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  filter.Q.value = 0.5;

  source.connect(filter);
  filter.connect(dest);
  source.start();
  activeNodes.push(source);
}

function createOcean(ctx: AudioContext, dest: AudioNode) {
  // Slow LFO modulated noise for waves
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate;
    const wave = Math.sin(t * 0.3) * 0.5 + 0.5; // slow wave envelope
    const noise = Math.random() * 2 - 1;
    data[i] = noise * wave * 0.6;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  source.connect(filter);
  filter.connect(dest);
  source.start();
  activeNodes.push(source);
}

function createLofi(ctx: AudioContext, dest: AudioNode) {
  // Simple mellow chord progression
  const notes = [261.6, 329.6, 392.0, 349.2]; // C4, E4, G4, F4
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.08;

    // Slow tremolo
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.5 + i * 0.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);
    lfo.start();

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start();
    activeNodes.push(osc, lfo);
  });
}

function createForest(ctx: AudioContext, dest: AudioNode) {
  // High-pitched chirps + light wind noise
  const windBuffer = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
  const windData = windBuffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < windData.length; i++) {
    last = (last + (Math.random() * 2 - 1) * 0.01) / 1.01;
    windData[i] = last * 8;
  }
  const wind = ctx.createBufferSource();
  wind.buffer = windBuffer;
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 400;
  windFilter.Q.value = 0.3;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.4;
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(dest);
  wind.start();
  activeNodes.push(wind);

  // Bird chirps
  function chirp() {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2000 + Math.random() * 2000;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.connect(g);
    g.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(chirp, 1000 + Math.random() * 4000);
  }
  chirp();
}

function createFire(ctx: AudioContext, dest: AudioNode) {
  // Crackly noise with pops
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const r = Math.random();
    data[i] = r < 0.98 ? (Math.random() * 2 - 1) * 0.1 : (Math.random() * 2 - 1) * 0.8;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 600;
  filter.Q.value = 1;

  source.connect(filter);
  filter.connect(dest);
  source.start();
  activeNodes.push(source);
}

export const AMBIENT_TYPES = [
  { id: 'none', label: 'None' },
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'forest', label: 'Forest' },
  { id: 'fire', label: 'Fire' },
];
