import React, { useState } from 'react';
import { Target, Play, Brain, Sparkles, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FocusTask, ParkedIdea, JournalEntry } from '../types';
import { Language, translations } from '../utils/i18n';
import { playChime } from '../utils/sound';
import { DailyReflectionCard } from './DailyReflectionCard';

interface HomeScreenProps {
  activeTask: FocusTask | null;
  onStartFocus: () => void;
  onNavigateToBrainDump: () => void;
  onQuickCapture: (text: string) => void;
  completedStepsCount: number;
  parkedIdeasCount: number;
  lang: Language;
  journal: JournalEntry[];
  onSaveReflection: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  onDeleteReflection?: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeTask,
  onStartFocus,
  onNavigateToBrainDump,
  onQuickCapture,
  completedStepsCount,
  parkedIdeasCount,
  lang,
  journal,
  onSaveReflection,
  onDeleteReflection,
}) => {
  const t = translations[lang];
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickCapture(quickInput.trim());
    setQuickInput('');
    playChime('pop');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 py-4">
      {/* Calm Greeting */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t.homeWelcome}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          {t.homeSubtitle}
        </p>
      </div>

      {/* Daily Reflection - What was your biggest win today? */}
      <DailyReflectionCard
        journal={journal}
        onSaveReflection={onSaveReflection}
        onDeleteReflection={onDeleteReflection}
        lang={lang}
      />

      {/* Primary Hero Task Card */}
      {activeTask && !activeTask.completed ? (
        <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="uppercase tracking-wider font-bold text-stone-600 dark:text-stone-300">
              {t.homePrimaryTaskCard}
            </span>
            <span>{activeTask.estimatedMinutes} دقيقة مقترحة</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {activeTask.title}
            </h3>
            {activeTask.microSteps[activeTask.currentStepIndex] && (
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>الخطوة القادمة: {activeTask.microSteps[activeTask.currentStepIndex].text}</span>
              </p>
            )}
          </div>

          <button
            onClick={onStartFocus}
            className="w-full py-3.5 px-5 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-transform hover:scale-[1.01] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.focusStartCta}</span>
          </button>
        </div>
      ) : (
        <div className="bg-stone-50 dark:bg-[#101010] border border-dashed border-stone-200 dark:border-[#262626] rounded-2xl p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-stone-200/60 dark:bg-[#202020] text-stone-600 dark:text-stone-300 flex items-center justify-center mx-auto">
            <Brain className="w-5 h-5" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <p className="text-xs font-bold text-stone-700 dark:text-stone-300">{t.homeNoTaskNotice}</p>
          </div>
          <button
            onClick={onNavigateToBrainDump}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <span>{t.homeStartDumpCta}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* Fast Thought Capture Form */}
      <form onSubmit={handleQuickSubmit} className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={t.homeQuickDumpPlaceholder}
            className="w-full text-xs rounded-xl border border-stone-200 dark:border-[#262626] bg-white dark:bg-[#101010] p-3 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-500"
          />
          {quickInput.trim() && (
            <button
              type="submit"
              className="absolute left-2.5 rtl:left-2.5 rtl:right-auto top-2 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-[11px]"
            >
              {t.homeQuickDumpBtn}
            </button>
          )}
        </div>
      </form>

      {/* Quiet Progress Summary (No cognitive overload) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-4 rounded-xl border border-stone-200/80 dark:border-[#262626] bg-stone-50/50 dark:bg-[#101010] text-center space-y-1">
          <span className="text-xs text-stone-400 block">{t.homeActiveStreak}</span>
          <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
            {completedStepsCount}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-stone-200/80 dark:border-[#262626] bg-stone-50/50 dark:bg-[#101010] text-center space-y-1">
          <span className="text-xs text-stone-400 block">{t.homeParkedIdeasSummary}</span>
          <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
            {parkedIdeasCount}
          </span>
        </div>
      </div>
    </div>
  );
};
