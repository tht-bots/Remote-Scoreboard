const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const {
  createInitialState,
  adjustScore,
  adjustFoul,
  adjustTimeouts,
  setTeamName,
  setTeamColor,
  setPossession,
  setRunning,
  setQuarter,
  setPeriod,
  tickClock,
} = require('./scoreboardLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const CONTROLLER_USERNAME = 'Scorekeeper';
const CONTROLLER_PASSWORD = 'FBCS_FLC_Sc0re';

function requireControllerAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Scoreboard Controller"');
    return res.status(401).send('Authentication required');
  }

  const encodedCredentials = authHeader.slice('Basic '.length);
  const decoded = Buffer.from(encodedCredentials, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  if (username === CONTROLLER_USERNAME && password === CONTROLLER_PASSWORD) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Scoreboard Controller"');
  return res.status(401).send('Invalid username or password');
}

app.use(express.json());

let state = createInitialState();

function emitState() {
  io.emit('state', state);
}

function applyStateChange(mutator, payload) {
  const previous = state;
  const next = mutator(previous, payload);
  if (next && next !== previous) {
    state = next;
    emitState();
  }
}

app.get('/api/state', (req, res) => {
  res.json(state);
});

app.get(['/control', '/control/', '/control.html'], requireControllerAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.get('/health', (req, res) => {
  res.json({ ok: true, state });
});

io.on('connection', (socket) => {
  socket.emit('state', state);

  socket.on('requestState', () => {
    socket.emit('state', state);
  });

  socket.on('resetState', () => {
    state = createInitialState();
    emitState();
  });

  socket.on('setTeamName', ({ team, name }) => {
    if (!team || !name) return;
    state = setTeamName(state, team, name.trim() || state[team].name);
    emitState();
  });

  socket.on('adjustScore', ({ team, delta }) => {
    if (!team || typeof delta !== 'number') return;
    state = adjustScore(state, team, delta);
    emitState();
  });

  socket.on('adjustFoul', ({ team, delta }) => {
    if (!team || typeof delta !== 'number') return;
    state = adjustFoul(state, team, delta);
    emitState();
  });

  socket.on('adjustTimeouts', ({ team, delta }) => {
    if (!team || typeof delta !== 'number') return;
    state = adjustTimeouts(state, team, delta);
    emitState();
  });

  socket.on('setRunning', ({ running }) => {
    state = setRunning(state, running);
    emitState();
  });

  socket.on('setQuarter', ({ quarter }) => {
    const nextQuarter = Number(quarter);
    if (Number.isNaN(nextQuarter)) return;
    state = setQuarter(state, nextQuarter);
    emitState();
  });

  socket.on('setPeriod', ({ period, quarter }) => {
    const nextQuarter = Number(quarter ?? period);
    if (Number.isNaN(nextQuarter)) return;
    state = setQuarter(state, nextQuarter);
    emitState();
  });

  socket.on('setTeamLogo', ({ team, logo }) => {
    if (!team || !logo) return;
    state = {
      ...state,
      [team]: {
        ...state[team],
        logo,
      },
    };
    emitState();
  });

  socket.on('setTeamColor', ({ team, color }) => {
    if (!team || !color) return;
    state = setTeamColor(state, team, color);
    emitState();
  });

  socket.on('setPossession', ({ team }) => {
    if (!team) return;
    state = setPossession(state, team);
    emitState();
  });

  socket.on('setClock', ({ minutes, seconds }) => {
    const nextMinutes = Number(minutes);
    const nextSeconds = Number(seconds);
    if (Number.isNaN(nextMinutes) || Number.isNaN(nextSeconds)) return;

    state = {
      ...state,
      clock: {
        minutes: Math.max(0, nextMinutes),
        seconds: Math.min(59, Math.max(0, nextSeconds)),
      },
    };
    emitState();
  });

  socket.on('toggleRunning', () => {
    state = setRunning(state, !state.running);
    emitState();
  });
});

setInterval(() => {
  if (!state.running) return;

  const next = tickClock(state, 1);
  if (!next) return;

  state = next;

  if (state.clock.minutes === 0 && state.clock.seconds === 0) {
    state = setRunning(state, false);
  }

  emitState();
}, 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scoreboard server running at http://localhost:${PORT}`);
  console.log(`Projector view: http://localhost:${PORT}/`);
  console.log(`Remote control: http://localhost:${PORT}/control`);
});
