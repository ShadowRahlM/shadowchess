// Chess sound engine with multiple sound packs
// Packs: standard (lichess), piano (lichess), synthetic (Web Audio)

const SOUND_FILES = {
  move: 'Move.mp3',
  capture: 'Capture.mp3',
  check: 'Check.mp3',
  checkmate: 'Checkmate.mp3',
  victory: 'Victory.mp3',
  defeat: 'Defeat.mp3',
  draw: 'Draw.mp3',
  error: 'Error.mp3',
  select: 'Select.mp3',
  lowtime: 'LowTime.mp3',
};

const PACKS = {
  standard: { name: 'Lichess Standard', path: '/sounds/standard/' },
  piano: { name: 'Lichess Piano', path: '/sounds/piano/' },
  synthetic: { name: 'Synthesized', path: null },
};

let audioCache = {};
let currentPack = 'standard';
let volume = 0.7;
let enabled = true;
let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function loadSound(name) {
  const pack = PACKS[currentPack];
  if (!pack || !pack.path) return null;
  const key = currentPack + ':' + name;
  if (audioCache[key]) return audioCache[key];
  const url = pack.path + (SOUND_FILES[name] || name + '.mp3');
  const audio = new Audio(url);
  audio.preload = 'auto';
  audioCache[key] = audio;
  return audio;
}

function playFile(name) {
  if (!enabled) return;
  const cached = loadSound(name);
  if (cached) {
    const clone = cached.cloneNode();
    clone.volume = volume;
    clone.play().catch(function() {});
  }
}

function playSynth(type, freq, dur, vol) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime((vol || 0.3) * volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch(e) {}
}

function playSynthNoise(dur, vol) {
  try {
    const c = getCtx();
    const bufSize = c.sampleRate * dur;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    gain.gain.setValueAtTime((vol || 0.15) * volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start();
  } catch(e) {}
}

// Public API
export function playMove() {
  if (currentPack === 'synthetic') {
    playSynth('sine', 400, 0.08, 0.2);
    setTimeout(function() { playSynth('sine', 300, 0.06, 0.15); }, 30);
  } else {
    playFile('move');
  }
}

export function playCapture() {
  if (currentPack === 'synthetic') {
    playSynthNoise(0.1, 0.2);
    setTimeout(function() { playSynth('sine', 200, 0.1, 0.2); }, 20);
  } else {
    playFile('capture');
  }
}

export function playCheck() {
  if (currentPack === 'synthetic') {
    playSynth('square', 800, 0.12, 0.15);
    setTimeout(function() { playSynth('square', 600, 0.1, 0.12); }, 60);
  } else {
    playFile('check');
  }
}

export function playGameOver(won) {
  if (currentPack === 'synthetic') {
    if (won) {
      playSynth('sine', 523, 0.2, 0.25);
      setTimeout(function() { playSynth('sine', 659, 0.2, 0.2); }, 200);
      setTimeout(function() { playSynth('sine', 784, 0.4, 0.15); }, 400);
    } else {
      playSynth('sine', 400, 0.3, 0.2);
      setTimeout(function() { playSynth('sine', 300, 0.3, 0.15); }, 300);
    }
  } else {
    playFile(won ? 'victory' : 'defeat');
  }
}

export function playError() {
  if (currentPack === 'synthetic') {
    playSynth('sawtooth', 150, 0.15, 0.1);
  } else {
    playFile('error');
  }
}

export function playSelect() {
  if (currentPack === 'synthetic') {
    playSynth('sine', 600, 0.05, 0.1);
  } else {
    playFile('select');
  }
}

export function playDraw() {
  if (currentPack === 'synthetic') {
    playSynth('sine', 400, 0.2, 0.2);
    setTimeout(function() { playSynth('sine', 350, 0.2, 0.15); }, 200);
  } else {
    playFile('draw');
  }
}

export function setPack(pack) {
  if (PACKS[pack]) {
    currentPack = pack;
    audioCache = {};
  }
}

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
}

export function setEnabled(e) {
  enabled = e;
}

export function getPack() { return currentPack; }
export function getVolume() { return volume; }
export function isEnabled() { return enabled; }
export function getPacks() { return PACKS; }
