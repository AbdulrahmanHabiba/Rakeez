import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Maximize2,
  Lightbulb,
  Check,
  CheckCircle2,
  Coffee,
  X,
  Sparkles,
} from 'lucide-react';
import { FocusTask, ParkedIdea } from '../types';
import {
  TimerSession,
  getRemainingSeconds,
  startSession,
  pauseSession,
  resetSession,
} from '../utils/timerLogic';
import { playChime } from '../utils/sound';
import { Language, translations } from '../utils/i18n';

interface ImmersiveFocusModeProps {
  task: FocusTask;
  session: TimerSession;
  onUpdateSession: (newSession: TimerSession) => void;
  onUpdateTask: (updatedTask: FocusTask) => void;
  onCompleteTask: (taskId: string) => void;
  onMinimize: () => void;
  onExit: () => void;
  onAddParkedIdea: (idea: ParkedIdea) => void;
  onIncrementDopamine: () => void;
  lang: Language;
}

export const ImmersiveFocusMode: React.FC<ImmersiveFocusModeProps> = ({
  task,
  session,
  onUpdateSession,
  onUpdateTask,
  onCompleteTask,
  onMinimize,
  onExit,
  onAddParkedIdea,
  onIncrementDopamine,
  lang,
}) => {
  const t = translations[lang];

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [distractionText, setDistractionText] = useState('');

  // Live remaining time calculated from timestamp
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const { remainingSeconds, isJustCompleted } = getRemainingSeconds(session, nowTime);

  // Handle completion sound once
  useEffect(() => {
    if (isJustCompleted) {
      playChime('alarm');
      onUpdateSession({
        ...session,
        isRunning: false,
        completedAt: Date.now(),
      });
    }
  }, [isJustCompleted, session, onUpdateSession]);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleTimer = () => {
    if (session.isRunning) {
      const paused = pauseSession(session);
      onUpdateSession(paused);
    } else {
      const started = startSession(session);
      onUpdateSession(started);
    }
    playChime('pop');
  };

  const handleResetTimer = (mins = 20) => {
    const reset = resetSession(mins, 'focus');
    onUpdateSession(reset);
    playChime('pop');
  };

  const handleStartBreak = (mins = 5) => {
    const breakSess = resetSession(mins, 'break');
    onUpdateSession(startSession(breakSess));
    playChime('step');
  };

  // Microstep advance
  const currentStep = task.microSteps[task.currentStepIndex];
  const allCompleted = task.microSteps.every((s) => s.completed);

  const handleAdvanceStep = () => {
    playChime('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onIncrementDopamine();

    const updatedSteps = [...task.microSteps];
    updatedSteps[task.currentStepIndex] = {
      ...updatedSteps[task.currentStepIndex],
      completed: true,
    };

    const nextIdx = updatedSteps.findIndex((s, idx) => idx > task.currentStepIndex && !s.completed);
    const fallbackIdx = updatedSteps.findIndex((s) => !s.completed);
    const newIdx = nextIdx !== -1 ? nextIdx : fallbackIdx !== -1 ? fallbackIdx : task.currentStepIndex;
    const isNowAllDone = updatedSteps.every((s) => s.completed);

    const updatedTask = {
      ...task,
      microSteps: updatedSteps,
      currentStepIndex: newIdx,
      completed: isNowAllDone,
    };

    onUpdateTask(updatedTask);

    if (isNowAllDone) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      onCompleteTask(task.id);
    }
  };

  const handleSaveDistraction = () => {
    if (!distractionText.trim()) return;
    const idea: ParkedIdea = {
      id: Math.random().toString(36).substring(2, 9),
      title: distractionText.trim(),
      note: `ركنت أثناء التركيز على: ${task.title}`,
      createdAt: Date.now(),
    };
    onAddParkedIdea(idea);
    setDistractionText('');
    setShowDistractionModal(false);
    playChime('pop');
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-[#f5f5f5] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Quiet Bar */}
      <div className="flex items-center justify-between gap-4 max-w-4xl w-full mx-auto">
        <button
          onClick={onMinimize}
          className="flex items-center gap-1.5 text-xs text-[#a3a3a3] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#141414] cursor-pointer"
          title={t.focusMinimize}
        >
          <Minimize2 className="w-4 h-4" />
          <span>{t.focusMinimize}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Distraction Parking Lot */}
          <button
            onClick={() => setShowDistractionModal(true)}
            className="flex items-center gap-1.5 text-xs text-[#d4d4d4] bg-[#141414] hover:bg-[#202020] border border-[#262626] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.focusParkDistraction}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
            title={isFullscreen ? t.focusExitFullscreen : t.focusFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Exit */}
          <button
            onClick={onExit}
            className="p-2 rounded-lg text-[#a3a3a3] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
            title="إنهاء"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Focus Centerpiece */}
      <div className="max-w-2xl w-full mx-auto text-center space-y-8 my-auto">
        {/* Subtle Mode Tag */}
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#a3a3a3] tracking-widest uppercase">
          <span
            className={`w-2 h-2 rounded-full ${
              session.mode === 'break' ? 'bg-blue-400' : 'bg-emerald-400'
            }`}
          />
          <span>{session.mode === 'break' ? 'استراحة مستحقة' : t.focusTitle}</span>
        </div>

        {/* Task Title */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f5f5f5]">
            {task.title}
          </h2>
          <p className="text-xs text-[#737373]">
            الخطوة {task.currentStepIndex + 1} من {task.microSteps.length}
          </p>
        </div>

        {/* The Giant Beautiful Timer */}
        <div className="py-2">
          <div className="text-7xl sm:text-9xl font-mono font-bold tracking-tighter text-[#f5f5f5] tabular-nums">
            {timeFormatted}
          </div>
          <p className="text-xs text-[#737373] mt-2 font-mono">
            {session.isRunning ? 'العداد قيد التشغيل' : 'متوقف مؤقتاً'}
          </p>
        </div>

        {/* The One Active Step */}
        {currentStep && !allCompleted ? (
          <div className="bg-[#101010] border border-[#262626] rounded-2xl p-6 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <p className="text-xs font-mono text-[#a3a3a3] uppercase tracking-wider">
              {t.focusActiveTask}:
            </p>
            <p className="text-base sm:text-lg font-bold text-[#fafaf9] leading-relaxed">
              "{currentStep.text}"
            </p>
            <button
              onClick={handleAdvanceStep}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#e5e5e5] text-black font-bold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.focusStepDone}</span>
            </button>
          </div>
        ) : allCompleted ? (
          <div className="bg-[#101010] border border-[#262626] rounded-2xl p-6 text-center space-y-3 max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <h4 className="text-base font-bold text-[#fafaf9]">{t.focusAllDone}</h4>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={onExit}
                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs"
              >
                اختيار مهمة أخرى
              </button>
              <button
                onClick={() => handleStartBreak(5)}
                className="px-4 py-2 rounded-xl bg-[#202020] text-white font-bold text-xs"
              >
                استراحة 5 دقائق
              </button>
            </div>
          </div>
        ) : null}

        {/* Minimal Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleToggleTimer}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              session.isRunning
                ? 'bg-[#202020] text-[#f5f5f5] hover:bg-[#2c2c2c]'
                : 'bg-white text-black hover:bg-stone-200'
            }`}
          >
            {session.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{session.isRunning ? t.focusPause : t.focusResume}</span>
          </button>

          <button
            onClick={() => handleResetTimer(task.estimatedMinutes)}
            className="p-2.5 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-[#a3a3a3] hover:text-white transition-colors cursor-pointer"
            title={t.focusReset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleStartBreak(5)}
            className="px-3.5 py-2.5 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-[#a3a3a3] hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title={t.focusBreak5}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{t.focusBreak5}</span>
          </button>
        </div>
      </div>

      {/* Subtle Step Dots at bottom */}
      <div className="flex items-center justify-center gap-1.5 max-w-sm mx-auto">
        {task.microSteps.map((step, idx) => (
          <div
            key={step.id}
            className={`h-1.5 rounded-full transition-all ${
              idx === task.currentStepIndex
                ? 'w-6 bg-white'
                : step.completed
                ? 'w-2 bg-emerald-500'
                : 'w-2 bg-[#333333]'
            }`}
          />
        ))}
      </div>

      {/* Distraction Parking Lot Modal */}
      {showDistractionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#262626] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>ركن فكرة عابرة (دون قطع التركيز)</span>
              </h4>
              <button
                onClick={() => setShowDistractionModal(false)}
                className="text-[#737373] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={distractionText}
              onChange={(e) => setDistractionText(e.target.value)}
              placeholder="اكتب فكرتك هنا وسنحفظها لك في درج الأفكار..."
              rows={3}
              autoFocus
              className="w-full text-xs rounded-xl border border-[#262626] bg-black p-3 text-white focus:outline-hidden focus:border-[#525252]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDistractionModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveDistraction}
                disabled={!distractionText.trim()}
                className="px-4 py-1.5 rounded-xl bg-white text-black font-bold text-xs disabled:opacity-50"
              >
                حفظ واستمرار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
