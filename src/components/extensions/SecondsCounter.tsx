import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Trophy, Zap, X, Sparkles, Minimize2 } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface SecondsCounterProps {
  onClose: () => void;
  onMinimize?: () => void;
  onDopamineEarned?: (amount: number) => void;
}

export const SecondsCounter: React.FC<SecondsCounterProps> = ({ onClose, onMinimize, onDopamineEarned }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [focusStreakGoal, setFocusStreakGoal] = useState<number>(60); // 60s challenge
  const [goalReached, setGoalReached] = useState(false);

  const startRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const milliseconds = Math.floor((elapsedMs % 1000) / 10);

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    } else {
      setIsRunning(true);
      startRef.current = performance.now() - elapsedMs;
      timerRef.current = setInterval(() => {
        const diff = performance.now() - startRef.current;
        setElapsedMs(diff);
      }, 30);
      playChime('step');
    }
  };

  const reset = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setElapsedMs(0);
    setLaps([]);
    setGoalReached(false);
    playChime('pop');
  };

  const addLap = () => {
    if (elapsedMs === 0) return;
    setLaps((prev) => [elapsedMs, ...prev]);
    playChime('step');
  };

  // Check goal reached (e.g. 60 seconds of solid focus)
  useEffect(() => {
    if (totalSeconds >= focusStreakGoal && !goalReached) {
      setGoalReached(true);
      playChime('success');
      onDopamineEarned?.(20);
    }
  }, [totalSeconds, focusStreakGoal, goalReached, onDopamineEarned]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-sm font-extrabold text-cyan-400">عداد الثواني ومؤقت الدقة (1, 2, 3...)</h3>
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

        {/* Big Counter Digits (Strictly LTR: Total Seconds . Milliseconds) */}
        <div className="bg-[#0b0f19] border border-cyan-900/50 rounded-3xl p-8 text-center space-y-2 shadow-inner">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-bold block">
            الـثـوانـي الـمـنـقـضـيـة
          </span>

          <div dir="ltr" className="flex items-baseline justify-center font-mono font-black tabular-nums">
            <span className="text-7xl sm:text-8xl text-white filter drop-shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              {totalSeconds}
            </span>
            <span className="text-2xl text-cyan-400 ms-1 font-bold">
              .{String(milliseconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-stone-400 ms-2 font-semibold">s</span>
          </div>

          {goalReached && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
              <Trophy className="w-4 h-4" />
              <span>رائع! صمدت {focusStreakGoal} ثانية كاملة بدون تشتت!</span>
            </div>
          )}
        </div>

        {/* Goal Selector */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-stone-400">هدف الصمود السريع:</span>
          <div className="flex items-center gap-1.5">
            {[30, 60, 120, 300].map((sec) => (
              <button
                key={sec}
                onClick={() => setFocusStreakGoal(sec)}
                className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                  focusStreakGoal === sec
                    ? 'bg-cyan-500 text-black'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                {sec >= 60 ? `${sec / 60}د` : `${sec}ث`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={reset}
            className="py-3 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تصفير</span>
          </button>

          <button
            onClick={toggleRun}
            className={`py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg col-span-1 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'إيقاف' : 'عد الآن'}</span>
          </button>

          <button
            onClick={addLap}
            disabled={elapsedMs === 0}
            className="py-3 rounded-2xl bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Flag className="w-4 h-4" />
            <span>جولة (Lap)</span>
          </button>
        </div>

        {/* Laps List */}
        {laps.length > 0 && (
          <div className="max-h-36 overflow-y-auto space-y-1.5 border-t border-stone-800 pt-3 text-xs font-mono">
            {laps.map((lapMs, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-900/60 border border-stone-800/60"
              >
                <span className="text-stone-400">جولة #{laps.length - idx}</span>
                <span className="text-cyan-300 font-bold">
                  {(lapMs / 1000).toFixed(2)} ثانية
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
