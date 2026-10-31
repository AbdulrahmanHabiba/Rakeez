import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Maximize2,
  X,
  Volume2,
  Coffee,
  Check,
} from 'lucide-react';
import { FocusTask, ParkedIdea } from '../types';
import { playChime } from '../utils/sound';

interface FocusMonotaskerProps {
  task: FocusTask;
  onUpdateTask: (updatedTask: FocusTask) => void;
  onCompleteTask: (completedTaskId: string) => void;
  onExitFocusMode: () => void;
  onAddParkedIdea: (idea: ParkedIdea) => void;
  onIncrementDopamineStreak: () => void;
}

export const FocusMonotasker: React.FC<FocusMonotaskerProps> = ({
  task,
  onUpdateTask,
  onCompleteTask,
  onExitFocusMode,
  onAddParkedIdea,
  onIncrementDopamineStreak,
}) => {
  // Timer state
  const initialSeconds = (task.estimatedMinutes || 20) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Distraction parking lot modal state
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [distractionText, setDistractionText] = useState('');

  // Manage timer tick
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      playChime('alarm');
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    playChime('pop');
  };

  const resetTimer = (minutes: number = task.estimatedMinutes || 20) => {
    setIsActive(false);
    setSecondsRemaining(minutes * 60);
    setIsBreak(false);
    playChime('pop');
  };

  const startBreak = (minutes: number = 5) => {
    setIsBreak(true);
    setSecondsRemaining(minutes * 60);
    setIsActive(true);
    playChime('step');
  };

  // Microstep navigation & completion
  const currentStep = task.microSteps[task.currentStepIndex];
  const totalSteps = task.microSteps.length;
  const allCompleted = task.microSteps.every((s) => s.completed);

  const handleCompleteCurrentStep = () => {
    playChime('success');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    onIncrementDopamineStreak();

    const updatedSteps = [...task.microSteps];
    updatedSteps[task.currentStepIndex] = {
      ...updatedSteps[task.currentStepIndex],
      completed: true,
    };

    // Find next uncompleted step
    const nextIdx = updatedSteps.findIndex((s, idx) => idx > task.currentStepIndex && !s.completed);
    const fallbackIdx = updatedSteps.findIndex((s) => !s.completed);

    const newStepIndex = nextIdx !== -1 ? nextIdx : fallbackIdx !== -1 ? fallbackIdx : task.currentStepIndex;
    const isNowAllDone = updatedSteps.every((s) => s.completed);

    const updatedTask = {
      ...task,
      microSteps: updatedSteps,
      currentStepIndex: newStepIndex,
      completed: isNowAllDone,
    };

    onUpdateTask(updatedTask);

    if (isNowAllDone) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
      onCompleteTask(task.id);
    }
  };

  const handleSelectStep = (index: number) => {
    onUpdateTask({
      ...task,
      currentStepIndex: index,
    });
    playChime('step');
  };

  const handleSaveDistraction = () => {
    if (!distractionText.trim()) return;

    const newIdea: ParkedIdea = {
      id: Math.random().toString(36).substring(2, 9),
      title: distractionText.trim(),
      note: `تم ركنها أثناء التركيز على مهمة: ${task.title}`,
      createdAt: Date.now(),
    };

    onAddParkedIdea(newIdea);
    setDistractionText('');
    setShowDistractionModal(false);
    playChime('pop');
  };

  // Format time MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercentage = ((initialSeconds - secondsRemaining) / initialSeconds) * 100;

  return (
    <div className="space-y-6">
      {/* Top bar with back button & distraction parking lot */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onExitFocusMode}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0" />
          <span>العودة لجميع الأقسام</span>
        </button>

        {/* Distraction Parking Lot Button (Lifesaver for ADHD context switching) */}
        <button
          onClick={() => setShowDistractionModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs transition-all"
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>ركن فكرة عابرة (Distraction Pad)</span>
        </button>
      </div>

      {/* Main Monotasking Container */}
      <div className="bg-white dark:bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden text-center space-y-6">
        {/* Subtle status header */}
        <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800/80 px-3.5 py-1 rounded-full text-xs font-semibold text-stone-600 dark:text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isBreak ? 'استراحة مستحقة ☕' : 'وضع التركيز الأحادي — مهمتك الوحيدة الآن'}</span>
        </div>

        {/* Task Title */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-tight">
            {task.title}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            تصنيف: {task.category} • الخطوة {task.currentStepIndex + 1} من {totalSteps}
          </p>
        </div>

        {/* THE SINGLE ACTIVE STEP - Big and prominent */}
        {currentStep && !allCompleted ? (
          <div className="bg-amber-50/70 dark:bg-stone-800/80 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-6 max-w-lg mx-auto shadow-sm space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>ركّز على هذا السطر فقط ولا تفكر في الخطوة التالية الآن:</span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 leading-relaxed">
              "{currentStep.text}"
            </p>

            <button
              onClick={handleCompleteCurrentStep}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>تم إنجاز هذه الخطوة! الخطوة التالية ✨</span>
            </button>
          </div>
        ) : allCompleted ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-8 max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200">
              رائع جداً! أنهيت جميع الخطوات بنجاح!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              عقلك استحق جرعة دوبامين حقيقية اليوم لأنك تغلبت على التشتت وأنهيت المهمة.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={onExitFocusMode}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                اختيار مهمة أخرى
              </button>
              <button
                onClick={() => startBreak(5)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs"
              >
                استراحة 5 دقائق
              </button>
            </div>
          </div>
        ) : null}

        {/* Clean Circular/Digital Visual Timer */}
        <div className="py-2">
          <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-stone-900 dark:text-stone-100">
            {timeFormatted}
          </div>
          <p className="text-[11px] text-stone-400 mt-1 font-medium">
            {isActive ? 'العداد يعمل.. تنفّس وركز على الشاشة' : 'العداد متوقف مؤقتاً'}
          </p>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all ${
                isActive
                  ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isActive ? 'إيقاف مؤقت' : 'بدء التايمر'}</span>
            </button>

            <button
              onClick={() => resetTimer(task.estimatedMinutes)}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="إعادة ضبط الوقت"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => startBreak(5)}
              className="flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-medium"
              title="استراحة قصيرة 5 دقائق"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>استراحة 5 د</span>
            </button>
          </div>
        </div>

        {/* All micro-steps overview (Collapsible or subtle) */}
        <div className="max-w-md mx-auto pt-4 border-t border-stone-100 dark:border-stone-800 text-right space-y-2">
          <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
            خريطة الخطوات (اضغط للتبديل إذا علقت):
          </p>
          <div className="space-y-1.5">
            {task.microSteps.map((step, idx) => (
              <div
                key={step.id}
                onClick={() => handleSelectStep(idx)}
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  idx === task.currentStepIndex
                    ? 'bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 font-bold'
                    : step.completed
                    ? 'bg-stone-50 dark:bg-stone-800/40 text-stone-400 line-through'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/50 dark:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      step.completed
                        ? 'bg-emerald-500 text-white'
                        : idx === task.currentStepIndex
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {step.completed ? '✓' : idx + 1}
                  </span>
                  <span>{step.text}</span>
                </div>
                {idx === task.currentStepIndex && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">قيد التنفيذ الآن</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distraction Parking Lot Modal */}
      {showDistractionModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>ركن فكرة عابرة (دون تشتيت عملك الحالي)</span>
              </h3>
              <button
                onClick={() => setShowDistractionModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              جاءتك فكرة برمجية جديدة أو تذكرت شيئاً فجأة؟ لا تفتح تاب جديد ولا تترك كودك الحالي! اكتب الفكرة هنا وسنحفظها لك في "درج الأفكار" لتراجعها بعد إنهاء مهمتك.
            </p>

            <textarea
              value={distractionText}
              onChange={(e) => setDistractionText(e.target.value)}
              placeholder="اكتب الفكرة العابرة هنا..."
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDistractionModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveDistraction}
                disabled={!distractionText.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs disabled:opacity-50"
              >
                احفظها واستمر في التركيز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
