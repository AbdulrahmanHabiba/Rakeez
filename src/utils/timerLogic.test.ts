import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSession,
  startSession,
  pauseSession,
  resetSession,
  getRemainingSeconds,
} from './timerLogic.js';

test('createInitialSession initializes with correct duration', () => {
  const session = createInitialSession(25);
  assert.equal(session.isRunning, false);
  assert.equal(session.totalDurationSeconds, 1500);
  assert.equal(session.pausedRemainingSeconds, 1500);
});

test('startSession calculates targetEndTime based on timestamp', () => {
  const t0 = 1000000;
  const initial = createInitialSession(20);
  const started = startSession(initial, t0);

  assert.equal(started.isRunning, true);
  assert.equal(started.targetEndTime, t0 + 20 * 60 * 1000);
  assert.equal(started.pausedRemainingSeconds, null);

  // Check 5 minutes later
  const t1 = t0 + 5 * 60 * 1000;
  const { remainingSeconds, isJustCompleted } = getRemainingSeconds(started, t1);
  assert.equal(remainingSeconds, 15 * 60);
  assert.equal(isJustCompleted, false);
});

test('pauseSession preserves elapsed remaining seconds exactly', () => {
  const t0 = 1000000;
  const initial = createInitialSession(10); // 600s
  const started = startSession(initial, t0);

  // Advance 120s
  const t1 = t0 + 120 * 1000;
  const paused = pauseSession(started, t1);

  assert.equal(paused.isRunning, false);
  assert.equal(paused.targetEndTime, null);
  assert.equal(paused.pausedRemainingSeconds, 480);

  // Resuming 10000 seconds later should continue from 480 seconds!
  const t2 = 20000000;
  const resumed = startSession(paused, t2);
  assert.equal(resumed.targetEndTime, t2 + 480 * 1000);

  const t3 = t2 + 30 * 1000;
  const { remainingSeconds } = getRemainingSeconds(resumed, t3);
  assert.equal(remainingSeconds, 450);
});

test('session completion detection without duplicate triggers', () => {
  const t0 = 1000000;
  const initial = createInitialSession(1); // 60s
  const started = startSession(initial, t0);

  // Time expired
  const tEnd = t0 + 65 * 1000;
  const result = getRemainingSeconds(started, tEnd);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.isJustCompleted, true);
});
