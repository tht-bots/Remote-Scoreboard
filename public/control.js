const socket = io();

const possessionButtons = document.querySelectorAll('[data-possession]');
const homeNameInput = document.getElementById('homeNameInput');
const awayNameInput = document.getElementById('awayNameInput');
const homeLogoInput = document.getElementById('homeLogoInput');
const awayLogoInput = document.getElementById('awayLogoInput');
const homeColorInput = document.getElementById('homeColorInput');
const awayColorInput = document.getElementById('awayColorInput');
const clockMinutesInput = document.getElementById('clockMinutesInput');
const clockSecondsInput = document.getElementById('clockSecondsInput');
const quarterInput = document.getElementById('quarterInput');
const enableSoundToggle = document.getElementById('enableSoundToggle');
const testBuzzerButton = document.getElementById('testBuzzerButton');
const quickBlastButton = document.getElementById('quickBlastButton');

let audioContext = null;
let soundEnabled = enableSoundToggle.checked;
let wasAtZero = false;

function ensureAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function playBuzzer() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const duration = 1.5; 
  const frequencies = [150, 154, 210, 215]; 

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000; 

  const gainNode = audioCtx.createGain();
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.05); 
  gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime + duration - 0.2); 
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration); 

  frequencies.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    osc.type = index % 2 === 0 ? 'square' : 'sawtooth'; 
    osc.frequency.value = freq;
    osc.connect(filter); 
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  });
}

function playBuzzerPattern() {
  if (!soundEnabled) return;
  playBuzzer();
}

function playQuickBlast() {
  const ctx = ensureAudioContext();
  if (!ctx || !soundEnabled) return;

  const duration = 0.35;
  const frequencies = [210, 240, 260];

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2800;

  const gainNode = ctx.createGain();
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.02);
  gainNode.gain.setValueAtTime(0.6, ctx.currentTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    osc.type = index === 0 ? 'square' : 'triangle';
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start(ctx.currentTime + index * 0.015);
    osc.stop(ctx.currentTime + duration + index * 0.015);
  });
}

function updateSoundPreference() {
  soundEnabled = enableSoundToggle.checked;
  localStorage.setItem('scoreboard-sound-enabled', String(soundEnabled));
  if (soundEnabled) {
    ensureAudioContext();
  }
}

function setTeamName(team) {
  const input = team === 'home' ? homeNameInput : awayNameInput;
  const name = input.value.trim();
  if (!name) return;
  socket.emit('setTeamName', { team, name });
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleLogoUpload(team, inputElement) {
  const file = inputElement.files && inputElement.files[0];
  if (!file) return;

  const dataUrl = await readImageAsDataUrl(file);
  socket.emit('setTeamLogo', { team, logo: dataUrl });
}

function updateThemePreview(team, color) {
  if (team === 'home') {
    document.documentElement.style.setProperty('--home-color', color);
  } else {
    document.documentElement.style.setProperty('--away-color', color);
  }
}

function updateTeamColor(team, colorInput) {
  const color = colorInput.value;
  updateThemePreview(team, color);
  socket.emit('setTeamColor', { team, color });
}

function adjustScore(team, delta) {
  socket.emit('adjustScore', { team, delta: Number(delta) });
}

function adjustFoul(team, delta) {
  socket.emit('adjustFoul', { team, delta: Number(delta) });
}

function adjustTimeouts(team, delta) {
  socket.emit('adjustTimeouts', { team, delta: Number(delta) });
}

function syncPossessionDisplay(state) {
  const selectedTeam = state && state.possession ? state.possession : 'home';

  possessionButtons.forEach((button) => {
    const isActive = button.dataset.possession === selectedTeam;
    button.classList.toggle('possession-selected', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateStateFromServer(state) {
  if (!state) return;

  const atZero = (state.clock.minutes === 0 && state.clock.seconds === 0);

  homeNameInput.value = state.home.name;
  awayNameInput.value = state.away.name;
  homeColorInput.value = state.home.color || '#1d4ed8';
  awayColorInput.value = state.away.color || '#dc2626';
  updateThemePreview('home', homeColorInput.value);
  updateThemePreview('away', awayColorInput.value);
  clockMinutesInput.value = state.clock.minutes;
  clockSecondsInput.value = state.clock.seconds;
  quarterInput.value = Number(state.quarter ?? state.period ?? 1);
  syncPossessionDisplay(state);

  if (soundEnabled && atZero && !wasAtZero) {
    playBuzzerPattern();
  }

  wasAtZero = atZero;
}

function setPossession(team) {
  socket.emit('setPossession', { team });
  syncPossessionDisplay({ possession: team });
}

socket.on('state', (state) => {
  updateStateFromServer(state);
});

socket.emit('requestState');

document.querySelectorAll('[data-action="set-name"]').forEach((button) => {
  button.addEventListener('click', () => {
    const team = button.dataset.team;
    setTeamName(team);
  });
});

document.querySelectorAll('[data-delta]').forEach((button) => {
  button.addEventListener('click', () => {
    const team = button.dataset.team;
    const delta = Number(button.dataset.delta);
    adjustScore(team, delta);
  });
});

document.querySelectorAll('[data-foul]').forEach((button) => {
  button.addEventListener('click', () => {
    const team = button.dataset.team;
    const delta = Number(button.dataset.foul);
    adjustFoul(team, delta);
  });
});

document.querySelectorAll('[data-timeout]').forEach((button) => {
  button.addEventListener('click', () => {
    const team = button.dataset.team;
    const delta = Number(button.dataset.timeout);
    adjustTimeouts(team, delta);
  });
});

document.getElementById('toggleClockButton').addEventListener('click', () => {
  socket.emit('toggleRunning');
});

document.getElementById('resetButton').addEventListener('click', () => {
  const confirmed = window.confirm('Reset the game? This clears the score, clock, fouls, and timeouts.');
  if (!confirmed) return;

  socket.emit('resetState');
});

document.getElementById('applyClockButton').addEventListener('click', () => {
  const minutes = Number(clockMinutesInput.value);
  const seconds = Number(clockSecondsInput.value);
  socket.emit('setClock', { minutes, seconds });
});

document.getElementById('applyQuarterButton').addEventListener('click', () => {
  const quarter = Number(quarterInput.value);
  socket.emit('setQuarter', { quarter });
});

enableSoundToggle.addEventListener('change', () => {
  updateSoundPreference();
});

testBuzzerButton.addEventListener('click', () => {
  playBuzzerPattern();
});

quickBlastButton.addEventListener('click', () => {
  playQuickBlast();
});

const savedSoundSetting = localStorage.getItem('scoreboard-sound-enabled');
if (savedSoundSetting !== null) {
  soundEnabled = savedSoundSetting === 'true';
  enableSoundToggle.checked = soundEnabled;
}

possessionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setPossession(button.dataset.possession);
  });
});

document.getElementById('applyHomeColorButton').addEventListener('click', () => {
  updateTeamColor('home', homeColorInput);
});

document.getElementById('applyAwayColorButton').addEventListener('click', () => {
  updateTeamColor('away', awayColorInput);
});

homeLogoInput.addEventListener('change', async (event) => {
  await handleLogoUpload('home', event.target);
});

awayLogoInput.addEventListener('change', async (event) => {
  await handleLogoUpload('away', event.target);
});
