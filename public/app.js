const socket = io();

const elements = {
  clockStack: document.querySelector('.clock-stack'),
  quarterValue: document.getElementById('quarterValue'),
  clockValue: document.getElementById('clockValue'),
  homeName: document.getElementById('homeName'),
  awayName: document.getElementById('awayName'),
  homeScore: document.getElementById('homeScore'),
  awayScore: document.getElementById('awayScore'),
  homeFouls: document.getElementById('homeFouls'),
  awayFouls: document.getElementById('awayFouls'),
  homeTimeouts: document.getElementById('homeTimeouts'),
  awayTimeouts: document.getElementById('awayTimeouts'),
  homeLogo: document.getElementById('homeLogo'),
  awayLogo: document.getElementById('awayLogo'),
  homePanel: document.querySelector('.home-panel'),
  awayPanel: document.querySelector('.away-panel'),
};

const lastScoreValues = { home: null, away: null };
let lastZeroState = false;
let audioContext = null;
let soundEnabled = localStorage.getItem('scoreboard-sound-enabled') !== 'false';

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

  const duration = 2.0;
  const frequencies = [150, 154, 210, 215];

  const gainNode = audioCtx.createGain();
  gainNode.connect(audioCtx.destination);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime + duration - 0.2);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

  frequencies.forEach((freq) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(gainNode);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  });
}

function playBuzzerPattern() {
  if (!soundEnabled) return;
  playBuzzer();
}

function formatClock(clock) {
  const minutes = String(Math.max(0, clock.minutes || 0)).padStart(2, '0');
  const seconds = String(Math.max(0, clock.seconds || 0)).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatTimeouts(value) {
  const dots = Array.from({ length: 3 }, (_, idx) => (idx < value ? '●' : '○')).join(' ');
  return dots;
}

function setLogo(imageElement, logoValue) {
  if (!logoValue) {
    imageElement.classList.remove('visible');
    imageElement.removeAttribute('src');
    return;
  }

  imageElement.src = logoValue;
  imageElement.classList.add('visible');
}

function updateScoreValue(element, team, nextValue) {
  const previousValue = lastScoreValues[team];
  if (previousValue !== nextValue) {
    element.classList.remove('score-change');
    void element.offsetWidth;
    element.textContent = nextValue;
    element.classList.add('score-change');
    lastScoreValues[team] = nextValue;
    return;
  }

  element.textContent = nextValue;
}

function renderState(state) {
  if (!state) return;

  const homeTimeouts = state.home.timeouts ?? 0;
  const awayTimeouts = state.away.timeouts ?? 0;
  const selectedQuarter = Number(state.quarter ?? state.period ?? 1);
  const possession = state.possession || 'home';
  const clockIsZero = (state.clock?.minutes ?? 0) === 0 && (state.clock?.seconds ?? 0) === 0;

  if (soundEnabled && clockIsZero && !lastZeroState) {
    playBuzzerPattern();
  }

  lastZeroState = clockIsZero;

  elements.quarterValue.textContent = selectedQuarter;
  elements.clockValue.textContent = formatClock(state.clock);
  elements.clockStack.classList.toggle('clock-warning', clockIsZero);
  elements.homeName.textContent = state.home.name;
  elements.awayName.textContent = state.away.name;
  updateScoreValue(elements.homeScore, 'home', state.home.score);
  updateScoreValue(elements.awayScore, 'away', state.away.score);
  elements.homeFouls.textContent = state.home.fouls;
  elements.awayFouls.textContent = state.away.fouls;
  elements.homeTimeouts.textContent = formatTimeouts(homeTimeouts);
  elements.awayTimeouts.textContent = formatTimeouts(awayTimeouts);
  setLogo(elements.homeLogo, state.home.logo);
  setLogo(elements.awayLogo, state.away.logo);

  elements.homePanel.classList.toggle('possession-active', possession === 'home');
  elements.awayPanel.classList.toggle('possession-active', possession === 'away');

  document.documentElement.style.setProperty('--home-color', state.home.color || '#1d4ed8');
  document.documentElement.style.setProperty('--away-color', state.away.color || '#dc2626');
}

socket.on('state', (state) => {
  renderState(state);
});

socket.emit('requestState');
