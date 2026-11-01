import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Minimize2, Bell, Sparkles, Coffee } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface PomodoroTimerProps {
  onClose: () => void;
  onMinimize?: () => void;
  onDopamineEarned?: (amount: number) => void;
}

type Mode = 'work' | 'shortBreak' | 'longBreak';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onClose,
  onMinimize,
  onDopamineEarned,
}) => {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  const timerRef = useRef<any>(null);

  const DURATIONS: Record<Mode, number> = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const switchMode = (newMode: Mode) => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    playChime('step');
  };

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    } else {
      setIsRunning(true);
      playChime('pop');
    }
  };

  const reset = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setTimeLeft(DURATIONS[mode]);
    playChime('step');
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime('success');

            if (mode === 'work') {
              onDopamineEarned?.(25);
              const nextCycles = completedCycles + 1;
              setCompletedCycles(nextCycles);
              if (nextCycles % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              switchMode('work');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, completedCycles, onDopamineEarned]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / DURATIONS[mode];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-sm font-extrabold text-stone-100">مؤقت البومودورو للـ ADHD</h3>
          </div>

          <div className="flex items-center gap-1.5">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                title="تصغير إلى الشاشة العائمة (PIP)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-stone-900 border border-stone-800 rounded-2xl">
          <button
            onClick={() => switchMode('work')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'work' ? 'bg-rose-500 text-white shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            تركيز (25د)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'shortBreak' ? 'bg-emerald-500 text-black shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            راحة (5د)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'longBreak' ? 'bg-cyan-500 text-black shadow-md' : 'text-stone-400 hover:text-white'
            }`}
          >
            راحة طويلة (15د)
          </button>
        </div>

        {/* Big Digits Display (Strictly LTR: MM:SS) */}
        <div className="bg-[#0f0d14] border border-rose-950 rounded-3xl p-8 text-center space-y-3 shadow-inner">
          <div dir="ltr" className="font-mono text-6xl sm:text-7xl font-black text-stone-100 tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                mode === 'work' ? 'bg-rose-500' : mode === 'shortBreak' ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 font-mono pt-1">
            <span>الدورات المكتملة: {completedCycles} 🍅</span>
            <span>{mode === 'work' ? 'وقت الإنجاز العميق' : 'استراحة استرخاء'}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={reset}
            className="py-3 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تعيين</span>
          </button>

          <button
            onClick={toggleRun}
            className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
              isRunning ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-rose-500 hover:bg-rose-400 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'إيقاف مؤقت' : 'بدء البومودورو'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
