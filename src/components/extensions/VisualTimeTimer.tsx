import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock, Sparkles, Bell } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface VisualTimeTimerProps {
  onClose: () => void;
  onMinimize?: () => void;
  onDopamineEarned?: (amount: number) => void;
}

export const VisualTimeTimer: React.FC<VisualTimeTimerProps> = ({ onClose, onMinimize, onDopamineEarned }) => {
  const [totalMinutes, setTotalMinutes] = useState(15);
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const timerRef = useRef<any>(null);

  const totalSeconds = totalMinutes * 60;
  const progressRatio = Math.max(0, remainingSeconds / totalSeconds);
  const angle = progressRatio * 360;

  const selectDuration = (mins: number) => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setTotalMinutes(mins);
    setRemainingSeconds(mins * 60);
    setIsDone(false);
    playChime('step');
  };

  const toggleRun = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    } else {
      if (remainingSeconds <= 0) {
        setRemainingSeconds(totalSeconds);
      }
      setIsRunning(true);
      setIsDone(false);
      playChime('pop');
    }
  };

  const reset = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setRemainingSeconds(totalSeconds);
    setIsDone(false);
    playChime('step');
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            setIsDone(true);
            playChime('success');
            onDopamineEarned?.(25);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, onDopamineEarned]);

  const displayMinutes = Math.floor(remainingSeconds / 60);
  const displaySeconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-sm font-extrabold text-stone-100">قرص الوقت البصري (علاج عمى الوقت)</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                title="تصغير إلى الشاشة العائمة (PIP)"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Shrinking Pie Disc */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-56 h-56 rounded-full border-4 border-stone-800 flex items-center justify-center shadow-2xl overflow-hidden bg-stone-900">
            {/* Pie Slice using conic gradient */}
            <div
              className="absolute inset-0 transition-all duration-300"
              style={{
                background: `conic-gradient(from 0deg, #f43f5e ${angle}deg, transparent ${angle}deg 360deg)`,
              }}
            />

            {/* Inner Center Cutout (White/Dark circle) */}
            <div className="absolute w-36 h-36 rounded-full bg-stone-950 border border-stone-800/80 flex flex-col items-center justify-center z-10 shadow-lg">
              <span dir="ltr" className="font-mono text-3xl font-black text-stone-100 tabular-nums">
                {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {isDone ? 'انتهى الوقت!' : 'متبقي'}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-400 text-center max-w-xs leading-relaxed">
            القرص الأحمر يتلاشى بصرياً أمام عينيك حتى يدرك عقلك مرور الوقت دون أن يفاجأ بانتهاء الموعد!
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-between gap-1.5">
          {[5, 10, 15, 25, 45].map((m) => (
            <button
              key={m}
              onClick={() => selectDuration(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                totalMinutes === m
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-stone-900 border border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              {m} د
            </button>
          ))}
        </div>

        {/* Control Buttons */}
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
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-rose-500 hover:bg-rose-400 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'إيقاف مؤقت' : 'بدء القرص الآن'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
