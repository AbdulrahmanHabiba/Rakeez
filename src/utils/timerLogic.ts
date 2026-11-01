// Pure timestamp-based timer logic for ADHD focus sessions (handles tab sleep, backgrounding, refresh)

export interface TimerSession {
  isRunning: boolean;
  totalDurationSeconds: number;
  targetEndTime: number | null; // epoch ms
  pausedRemainingSeconds: number | null;
  completedAt: number | null;
  mode: 'focus' | 'break';
}

export function createInitialSession(durationMinutes = 20): TimerSession {
  const totalDurationSeconds = durationMinutes * 60;
  return {
    isRunning: false,
    totalDurationSeconds,
    targetEndTime: null,
    pausedRemainingSeconds: totalDurationSeconds,
    completedAt: null,
    mode: 'focus',
  };
}

export function startSession(session: TimerSession, now = Date.now()): TimerSession {
  const remaining = session.pausedRemainingSeconds ?? session.totalDurationSeconds;
  return {
    ...session,
    isRunning: true,
    targetEndTime: now + remaining * 1000,
    pausedRemainingSeconds: null,
    completedAt: null,
  };
}

export function pauseSession(session: TimerSession, now = Date.now()): TimerSession {
  if (!session.isRunning || !session.targetEndTime) return session;
  const remaining = Math.max(0, Math.round((session.targetEndTime - now) / 1000));
  return {
    ...session,
    isRunning: false,
    targetEndTime: null,
    pausedRemainingSeconds: remaining,
  };
}

export function resetSession(durationMinutes = 20, mode: 'focus' | 'break' = 'focus'): TimerSession {
  const total = durationMinutes * 60;
  return {
    isRunning: false,
    totalDurationSeconds: total,
    targetEndTime: null,
    pausedRemainingSeconds: total,
    completedAt: null,
    mode,
  };
}

export function getRemainingSeconds(session: TimerSession, now = Date.now()): {
  remainingSeconds: number;
  isJustCompleted: boolean;
} {
  if (!session.isRunning) {
    return {
      remainingSeconds: session.pausedRemainingSeconds ?? session.totalDurationSeconds,
      isJustCompleted: false,
    };
  }

  if (!session.targetEndTime) {
    return {
      remainingSeconds: session.pausedRemainingSeconds ?? session.totalDurationSeconds,
      isJustCompleted: false,
    };
  }

  const diffMs = session.targetEndTime - now;
  if (diffMs <= 0) {
    const isJustCompleted = session.completedAt === null;
    return {
      remainingSeconds: 0,
      isJustCompleted,
    };
  }

  return {
    remainingSeconds: Math.ceil(diffMs / 1000),
    isJustCompleted: false,
  };
}
