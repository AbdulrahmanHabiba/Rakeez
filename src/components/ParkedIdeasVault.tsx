import React from 'react';
import { Lightbulb, Trash2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { ParkedIdea, FocusTask } from '../types';
import { playChime } from '../utils/sound';

interface ParkedIdeasVaultProps {
  ideas: ParkedIdea[];
  onDeleteIdea: (id: string) => void;
  onPromoteToTask: (idea: ParkedIdea) => void;
}

export const ParkedIdeasVault: React.FC<ParkedIdeasVaultProps> = ({
  ideas,
  onDeleteIdea,
  onPromoteToTask,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50/70 dark:bg-stone-900 border border-amber-200/80 dark:border-stone-800 rounded-2xl p-5 space-y-1">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>درج الأفكار المؤجلة (Idea Parking Lot)</span>
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          عندما تأتيك فكرة رائعة وأنت مبرمج في منتصف الكود، عقلك يخشى نسيانها فيترك العمل ويجري وراءها. وظيفة هذا الدرج هي الاحتفاظ بكل الأفكار بأمان تام لتفرغ رأسك الآن وتعود إليها وقت الفراغ.
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-300 dark:border-stone-800 rounded-xl p-8 text-center text-xs text-stone-400">
          درج الأفكار فارغ حالياً. أي فكرة جديدة تقفز في ذهنك أثناء العمل يمكنك ركنها هنا فوراً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {idea.title}
                </h4>
                {idea.note && (
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{idea.note}</p>
                )}
                <span className="text-[10px] text-stone-400 mt-2 block">
                  {new Date(idea.createdAt).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onPromoteToTask(idea)}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>بدء العمل عليها الآن</span>
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
