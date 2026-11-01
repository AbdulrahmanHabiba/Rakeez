import React from 'react';
import { CheckCircle2, Lightbulb, Clock, Trash2, ArrowRight } from 'lucide-react';
import { FocusTask, ParkedIdea, DeclutterItem } from '../types';
import { Language, translations } from '../utils/i18n';

interface HistoryScreenProps {
  completedTasks: FocusTask[];
  parkedIdeas: ParkedIdea[];
  declutterItems: DeclutterItem[];
  completedStepsCount: number;
  onClearCompletedTasks: () => void;
  lang: Language;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  completedTasks,
  parkedIdeas,
  declutterItems,
  completedStepsCount,
  onClearCompletedTasks,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {t.historyTitle}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            {t.historySubtitle}
          </p>
        </div>

        {completedTasks.length > 0 && (
          <button
            onClick={onClearCompletedTasks}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل</span>
          </button>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 text-center space-y-1">
          <span className="text-[11px] text-stone-400 font-medium block">خطوات اليوم</span>
          <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
            {completedStepsCount}
          </span>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 text-center space-y-1">
          <span className="text-[11px] text-stone-400 font-medium block">أفكار محفوظة</span>
          <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
            {parkedIdeas.length}
          </span>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 text-center space-y-1">
          <span className="text-[11px] text-stone-400 font-medium block">صور مفروزة</span>
          <span className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
            {declutterItems.length}
          </span>
        </div>
      </div>

      {/* Completed Tasks List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          المهام المكتملة حديثاً ({completedTasks.length})
        </h3>

        {completedTasks.length === 0 ? (
          <div className="bg-stone-50 dark:bg-[#101010] border border-dashed border-stone-200 dark:border-[#262626] rounded-2xl p-8 text-center text-xs text-stone-400">
            {t.historyEmpty}
          </div>
        ) : (
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-xl p-3.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{task.title}</span>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  {new Date(task.createdAt).toLocaleDateString('ar-EG', {
                    month: 'numeric',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
