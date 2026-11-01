import React from 'react';
import { Lightbulb, Trash2, ArrowRight, Play } from 'lucide-react';
import { ParkedIdea } from '../types';
import { playChime } from '../utils/sound';

interface ParkedIdeasVaultProps {
  ideas: ParkedIdea[];
  onDeleteIdea: (id: string) => void;
  onPromoteToTask: (idea: ParkedIdea) => void;
  onBack?: () => void;
}

export const ParkedIdeasVault: React.FC<ParkedIdeasVaultProps> = ({
  ideas,
  onDeleteIdea,
  onPromoteToTask,
  onBack,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
          <span>العودة لجميع الأدوات</span>
        </button>
      )}

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          درج الأفكار المؤجلة (Parking Lot)
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          احتفظ بكل فكرة جديدة تقفز في رأسك هنا بأمان حتى لا تعطل تركيزك الحالي أو تخشى ضياعها.
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="bg-stone-50 dark:bg-[#101010] border border-dashed border-stone-200 dark:border-[#262626] rounded-2xl p-8 text-center text-xs text-stone-400">
          درج الأفكار فارغ حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {idea.title}
                </h4>
                {idea.note && (
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{idea.note}</p>
                )}
                <span className="text-[10px] text-stone-400 font-mono mt-2 block">
                  {new Date(idea.createdAt).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-[#222222] flex items-center justify-between gap-2">
                <button
                  onClick={() => onPromoteToTask(idea)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900 dark:text-white hover:underline cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>بدء العمل عليها</span>
                </button>
                <button
                  onClick={() => onDeleteIdea(idea.id)}
                  className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
