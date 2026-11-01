import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSession,
  startSession,
  pauseSession,
  getRemainingSeconds,
} from '../src/utils/timerLogic.ts';

test('createInitialSession sets up correct total and remaining time', () => {
  const session = createInitialSession(25);
  assert.equal(session.totalDurationSeconds, 25 * 60);
  assert.equal(session.pausedRemainingSeconds, 25 * 60);
  assert.equal(session.isRunning, false);
});

test('startSession activates running state and sets targetEndTime timestamp', () => {
  const session = createInitialSession(15);
  const now = 1000000;
  const started = startSession(session, now);
  assert.equal(started.isRunning, true);
  assert.equal(started.targetEndTime, now + 15 * 60 * 1000);
});

test('pauseSession pauses running session and captures elapsed time', () => {
  const session = createInitialSession(20);
  const now = 1000000;
  const started = startSession(session, now);
  const paused = pauseSession(started, now + 60 * 1000); // 1 min passed
  assert.equal(paused.isRunning, false);
  assert.equal(paused.pausedRemainingSeconds, 19 * 60);
});

test('getRemainingSeconds calculates remaining seconds accurately', () => {
  const session = createInitialSession(10);
  const result = getRemainingSeconds(session);
  assert.equal(result.remainingSeconds, 600);
  assert.equal(result.isJustCompleted, false);
});
