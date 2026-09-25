const socket = io();

const homeNameInput = document.getElementById('homeNameInput');
const awayNameInput = document.getElementById('awayNameInput');
const homeLogoInput = document.getElementById('homeLogoInput');
const awayLogoInput = document.getElementById('awayLogoInput');
const homeColorInput = document.getElementById('homeColorInput');
const awayColorInput = document.getElementById('awayColorInput');
const clockMinutesInput = document.getElementById('clockMinutesInput');
const clockSecondsInput = document.getElementById('clockSecondsInput');
const quarterInput = document.getElementById('quarterInput');

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

function updateStateFromServer(state) {
  if (!state) return;
  homeNameInput.value = state.home.name;
  awayNameInput.value = state.away.name;
  homeColorInput.value = state.home.color || '#1d4ed8';
  awayColorInput.value = state.away.color || '#dc2626';
  updateThemePreview('home', homeColorInput.value);
  updateThemePreview('away', awayColorInput.value);
  clockMinutesInput.value = state.clock.minutes;
  clockSecondsInput.value = state.clock.seconds;
  quarterInput.value = Number(state.quarter ?? state.period ?? 1);
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
