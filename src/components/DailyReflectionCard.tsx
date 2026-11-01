import React, { useState } from 'react';
import { Trophy, Sparkles, Check, ChevronDown, ChevronUp, History, Mic, Send, Heart, Flame, Trash2, Plus } from 'lucide-react';
import { JournalEntry } from '../types';
import { playChime } from '../utils/sound';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../utils/speech';

interface DailyReflectionCardProps {
  journal: JournalEntry[];
  onSaveReflection: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  onDeleteReflection?: (id: string) => void;
  lang?: string;
}

const QUICK_WIN_TAGS = [
  'أنجزت مهمة كنت أؤجلها 🏆',
  'تغلبت على التشتت وركزت 🛡️',
  'أخذت الخطوة الأولى فقط ⚡',
  'نظمت بيئة عملي 🌿',
  'حافظت على هدوئي وتفكيري ✨',
  'أغلقت تابات متراكمة 🚀',
];

export const DailyReflectionCard: React.FC<DailyReflectionCardProps> = ({
  journal,
  onSaveReflection,
  onDeleteReflection,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = journal.filter((j) => j.date === todayStr);

  const [answer, setAnswer] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(todayEntries.length === 0);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    if (!isSpeechRecognitionSupported()) return;

    playChime('pop');
    setIsRecording(true);
    startSpeechRecognition({
      lang: 'ar-SA',
      onResult: (finalText) => {
        if (finalText) {
          setAnswer((prev) => (prev ? `${prev} ${finalText}` : finalText));
        }
      },
      onEnd: () => setIsRecording(false),
      onError: () => setIsRecording(false),
    });
  };

  const handleAddWin = (winText: string, tag?: string) => {
    const textToSave = winText.trim();
    if (!textToSave) return;

    onSaveReflection({
      date: todayStr,
      question: 'ما هو أكبر إنجاز أو فوز حققته اليوم؟',
      answer: textToSave,
      tag: tag || selectedTag || undefined,
    });

    setAnswer('');
    setSelectedTag('');
    setIsAddingNew(false);
    setCelebrate(true);
    playChime('success');
    setTimeout(() => setCelebrate(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() && !selectedTag) return;
    handleAddWin(answer.trim() || selectedTag, selectedTag);
  };

  const handleQuickTagClick = (tag: string) => {
    handleAddWin(tag, tag);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-400/10 dark:via-[#161412] dark:to-[#0f0e0c] border border-amber-500/25 dark:border-amber-500/20 rounded-2xl p-5 shadow-xs transition-all relative overflow-hidden">
      {/* Background Dopamine Sparkle */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-mono">
              تأمل المساء اليومي • Daily Wins
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
              ما هو أكبر إنجاز أو فوز حققته اليوم؟
            </h3>
          </div>
        </div>

        {journal.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-[11px] font-bold text-stone-500 dark:text-stone-400 hover:text-amber-500 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            title="عرض سجل الانتصارات"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">سجل الانتصارات ({journal.length})</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
        عقل الـ ADHD يميل لنسيان ما أنجزه. اضغط على أي إنجاز سريع لإضافته فوراً، أو اكتب فوزك بالكلمات أو بالصوت:
      </p>

      {/* Today's Saved Wins List */}
      {todayEntries.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-mono">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>انتصاراتك الموثقة اليوم ({todayEntries.length}):</span>
            </span>

            {!isAddingNew && (
              <button
                onClick={() => setIsAddingNew(true)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>إضافة فوز آخر اليوم</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {todayEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white/90 dark:bg-[#141414]/90 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                    "{entry.answer}"
                  </p>
                  {entry.tag && entry.tag !== entry.answer && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold">
                      {entry.tag}
                    </span>
                  )}
                </div>

                {onDeleteReflection && (
                  <button
                    onClick={() => {
                      onDeleteReflection(entry.id);
                      playChime('pop');
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="حذف هذا الإنجاز"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {celebrate && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 dark:text-emerald-300 font-bold flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>رائع يا بطل! تم تعزيز رصيد الدوبامين الطبيعي الخاص بك بنجاح.</span>
            </div>
          )}
        </div>
      )}

      {/* Input or Quick Tag Selection */}
      {(isAddingNew || todayEntries.length === 0) && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-amber-500/15">
          {/* Quick Choice Tags (Clicking immediately adds the win!) */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-stone-400 font-mono block">اضغط نقرة سريعة للتوثيق الفوري:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_WIN_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-[#181818] text-stone-700 dark:text-stone-300 hover:border-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer font-medium active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Answer Textarea */}
          <div className="relative">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="أو اكتب فوزك بنفسك: أنهيت كتابة الكود، قاومت فتح يوتيوب، صليت في وقتها..."
              className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141414] p-3 pl-10 rtl:pl-10 rtl:pr-3 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-amber-500 transition-all"
            />
            {isSpeechRecognitionSupported() && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute left-2 rtl:left-2 rtl:right-auto top-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
                title="تحدث صوتياً"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>مجموع الانتصارات: {journal.length}</span>
            </span>

            <div className="flex items-center gap-2">
              {todayEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
                >
                  إلغاء
                </button>
              )}
              <button
                type="submit"
                disabled={!answer.trim()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>حفظ هذا الفوز</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* History Logbook Drawer */}
      {showHistory && (
        <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-2 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 font-mono uppercase">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>سجل إنجازاتك السابقة ({journal.length})</span>
          </h4>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 rtl:pr-0 rtl:pl-1">
            {journal.map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-xl bg-white/60 dark:bg-[#151515] border border-stone-200 dark:border-stone-800 text-xs flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                    <span>{entry.date}</span>
                    {entry.tag && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                        {entry.tag}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">
                    {entry.answer}
                  </p>
                </div>

                {onDeleteReflection && (
                  <button
                    onClick={() => {
                      onDeleteReflection(entry.id);
                      playChime('pop');
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    title="حذف هذا الإنجاز"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
