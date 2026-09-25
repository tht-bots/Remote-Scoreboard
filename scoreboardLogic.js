function createInitialState() {
  return {
    home: {
      name: 'Home',
      score: 0,
      fouls: 0,
      timeouts: 3,
      logo: '',
      color: '#1d4ed8',
    },
    away: {
      name: 'Away',
      score: 0,
      fouls: 0,
      timeouts: 3,
      logo: '',
      color: '#dc2626',
    },
    clock: {
      minutes: 12,
      seconds: 0,
    },
    running: false,
    quarter: 1,
    period: 1,
    possession: 'home',
    lastUpdated: Date.now(),
  };
}

function setTeamName(state, team, name) {
  if (!state || !team || !name) {
    return state;
  }

  return {
    ...state,
    [team]: {
      ...state[team],
      name,
    },
  };
}

function adjustScore(state, team, delta) {
  if (!state || !team || typeof delta !== 'number') {
    return state;
  }

  return {
    ...state,
    [team]: {
      ...state[team],
      score: Math.max(0, state[team].score + delta),
    },
  };
}

function adjustFoul(state, team, delta) {
  if (!state || !team || typeof delta !== 'number') {
    return state;
  }

  return {
    ...state,
    [team]: {
      ...state[team],
      fouls: Math.max(0, state[team].fouls + delta),
    },
  };
}

function adjustTimeouts(state, team, delta) {
  if (!state || !team || typeof delta !== 'number') {
    return state;
  }

  return {
    ...state,
    [team]: {
      ...state[team],
      timeouts: Math.max(0, state[team].timeouts + delta),
    },
  };
}

function setRunning(state, running) {
  if (!state) {
    return state;
  }

  return {
    ...state,
    running: Boolean(running),
    lastUpdated: Date.now(),
  };
}

function setQuarter(state, quarter) {
  if (!state || typeof quarter !== 'number') {
    return state;
  }

  return {
    ...state,
    quarter,
    period: quarter,
  };
}

function setPeriod(state, period) {
  return setQuarter(state, period);
}

function setTeamColor(state, team, color) {
  if (!state || !team || !color) {
    return state;
  }

  return {
    ...state,
    [team]: {
      ...state[team],
      color,
    },
  };
}

function tickClock(state, seconds = 1) {
  if (!state || !state.running) {
    return state;
  }

  const totalSeconds = state.clock.minutes * 60 + state.clock.seconds;
  const nextTotal = Math.max(0, totalSeconds - seconds);
  const minutes = Math.floor(nextTotal / 60);
  const remainingSeconds = nextTotal % 60;

  return {
    ...state,
    clock: {
      minutes,
      seconds: remainingSeconds,
    },
    lastUpdated: Date.now(),
  };
}

module.exports = {
  createInitialState,
  setTeamName,
  setTeamColor,
  adjustScore,
  adjustFoul,
  adjustTimeouts,
  setRunning,
  setQuarter,
  setPeriod,
  tickClock,
};
