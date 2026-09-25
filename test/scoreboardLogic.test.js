const test = require('node:test');
const assert = require('node:assert/strict');
const { createInitialState, adjustScore, adjustFoul, adjustTimeouts, tickClock, setRunning, setPeriod, setTeamName, setTeamColor, setPossession } = require('../scoreboardLogic.js');

test('creates the default game state', () => {
  const state = createInitialState();

  assert.equal(state.home.name, 'Home');
  assert.equal(state.away.name, 'Away');
  assert.equal(state.home.score, 0);
  assert.equal(state.away.score, 0);
  assert.equal(state.clock.minutes, 12);
  assert.equal(state.clock.seconds, 0);
  assert.equal(state.period, 1);
});

test('adds points to the designated team', () => {
  const state = createInitialState();
  const updated = adjustScore(state, 'home', 3);

  assert.equal(updated.home.score, 3);
  assert.equal(updated.away.score, 0);
});

test('adjusts fouls and timeouts', () => {
  const state = createInitialState();
  const withFouls = adjustFoul(state, 'home', 1);
  const withTimeouts = adjustTimeouts(withFouls, 'away', -1);

  assert.equal(withFouls.home.fouls, 1);
  assert.equal(withTimeouts.away.timeouts, 2);
});

test('ticks time down while the clock is running', () => {
  const state = createInitialState();
  const started = setRunning(state, true);
  const updated = tickClock(started, 1);

  assert.equal(updated.clock.minutes, 11);
  assert.equal(updated.clock.seconds, 59);
});

test('updates team names and period', () => {
  const state = createInitialState();
  const renamed = setTeamName(state, 'home', 'Falcons');
  const periodSet = setPeriod(renamed, 3);

  assert.equal(periodSet.home.name, 'Falcons');
  assert.equal(periodSet.period, 3);
});

test('updates custom team colors', () => {
  const state = createInitialState();
  const updated = setTeamColor(state, 'home', '#123456');

  assert.equal(updated.home.color, '#123456');
  assert.equal(updated.away.color, '#dc2626');
});

test('updates which team has possession', () => {
  const state = createInitialState();
  const updated = setPossession(state, 'away');

  assert.equal(updated.possession, 'away');
  assert.equal(updated.home.name, 'Home');
});
