import React, { useState, useEffect } from 'react';
import { Maximize2, Pause, Play, Check, X } from 'lucide-react';
import { FocusTask } from '../types';
import { TimerSession, getRemainingSeconds, startSession, pauseSession } from '../utils/timerLogic';
import { playChime } from '../utils/sound';

interface MinimizedFocusBarProps {
  task: FocusTask;
  session: TimerSession;
  onUpdateSession: (newSession: TimerSession) => void;
  onRestore: () => void;
  onExit: () => void;
}

export const MinimizedFocusBar: React.FC<MinimizedFocusBarProps> = ({
  task,
  session,
  onUpdateSession,
  onRestore,
  onExit,
}) => {
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const { remainingSeconds } = getRemainingSeconds(session, nowTime);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleToggle = () => {
    if (session.isRunning) {
      onUpdateSession(pauseSession(session));
    } else {
      onUpdateSession(startSession(session));
    }
    playChime('pop');
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-xl w-[92vw] bg-black/90 dark:bg-[#141414]/95 border border-[#333333] shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-white backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <div className="truncate">
          <p className="text-xs font-bold truncate text-[#f5f5f5]">{task.title}</p>
          <p className="text-[10px] text-[#a3a3a3] truncate">
            {task.microSteps[task.currentStepIndex]?.text || 'جلسة تركيز نشطة'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-sm font-bold text-white tabular-nums px-2 py-0.5 rounded-md bg-[#222222]">
          {timeFormatted}
        </span>

        <button
          onClick={handleToggle}
          className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#333333] text-white transition-colors cursor-pointer"
          title={session.isRunning ? 'إيقاف مؤقت' : 'متابعة'}
        >
          {session.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          onClick={onRestore}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-black hover:bg-stone-200 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">استعادة</span>
        </button>

        <button
          onClick={onExit}
          className="p-1.5 rounded-lg text-[#737373] hover:text-white transition-colors"
          title="إنهاء"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
