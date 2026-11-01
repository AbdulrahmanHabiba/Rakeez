import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Layers,
  ListPlus,
  Send,
  Target,
} from 'lucide-react';
import { FocusTask, ParkedIdea, Errand } from '../types';
import { isSpeechRecognitionSupported, startSpeechRecognition } from '../utils/speech';
import { playChime } from '../utils/sound';
import { Language, translations } from '../utils/i18n';

interface BrainDumpProps {
  onStartFocusTask: (task: FocusTask) => void;
  onAddParkedIdeas: (ideas: ParkedIdea[]) => void;
  onAddErrands: (errands: Errand[]) => void;
  onSendErrandToTimePlanner: (title: string, time?: string) => void;
  lang?: Language;
}

interface IdeaItem {
  id: string;
  text: string;
  type?: 'task' | 'idea' | 'errand';
}

export const BrainDump: React.FC<BrainDumpProps> = ({
  onStartFocusTask,
  onAddParkedIdeas,
  onAddErrands,
  onSendErrandToTimePlanner,
  lang = 'ar',
}) => {
  const t = translations[lang];

  // Two modes: 'items' (فكرة فكرة صغيرة) vs 'batch' (نص شامل)
  const [dumpMode, setDumpMode] = useState<'items' | 'batch'>('items');

  // Mode 1: Item-by-Item state
  const [singleInput, setSingleInput] = useState('');
  const [collectedItems, setCollectedItems] = useState<IdeaItem[]>([]);

  // Mode 2: Batch text state
  const [rawText, setRawText] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTarget, setRecordingTarget] = useState<'single' | 'batch'>('single');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const baseTextRef = useRef('');

  // Parsed Result state (from Gemini)
  const [parsedResult, setParsedResult] = useState<{
    focusTask: {
      title: string;
      estimatedMinutes: number;
      category?: string;
      microSteps: string[];
    };
    parkedIdeas: Array<{ title: string; note?: string }>;
    errands?: Array<{ title: string; timeOrDate?: string }>;
    reassurance: string;
  } | null>(null);

  // Toggle Voice Recording
  const toggleRecording = (target: 'single' | 'batch') => {
    if (isRecording) {
      if (recognitionInstance) recognitionInstance.stop();
      setIsRecording(false);
      setInterimText('');
    } else {
      setSpeechError(null);
      if (!isSpeechRecognitionSupported()) {
        setSpeechError('التعرف الصوتي غير مدعوم في متصفحك الحالي، يمكنك كتابة أفكارك يدوياً.');
        return;
      }

      setRecordingTarget(target);
      baseTextRef.current = target === 'single' ? singleInput.trim() : rawText.trim();
      setInterimText('');
      playChime('pop');

      const rec = startSpeechRecognition({
        lang: lang === 'en' ? 'en-US' : 'ar-SA',
        onResult: (finalText, liveInterim) => {
          const prefix = baseTextRef.current;
          const merged = prefix ? `${prefix} ${finalText}` : finalText;
          if (target === 'single') {
            if (finalText) setSingleInput(merged);
          } else {
            if (finalText) setRawText(merged);
          }
          setInterimText(liveInterim);
        },
        onError: (err) => {
          setSpeechError(`خطأ في الميكروفون: ${err}`);
          setIsRecording(false);
          setInterimText('');
        },
        onEnd: () => {
          setIsRecording(false);
          setInterimText('');
        },
      });

      setRecognitionInstance(rec);
      setIsRecording(true);
    }
  };

  // Item-by-item actions
  const handleAddSingleItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = singleInput.trim();
    if (!clean) return;

    const newItem: IdeaItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: clean,
    };

    setCollectedItems((prev) => [...prev, newItem]);
    setSingleInput('');
    playChime('step');
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === collectedItems.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...collectedItems];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCollectedItems(updated);
    playChime('pop');
  };

  const handleDeleteItem = (id: string) => {
    setCollectedItems((prev) => prev.filter((item) => item.id !== id));
    playChime('pop');
  };

  const handleConvertItemToTask = (item: IdeaItem) => {
    const newTask: FocusTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: item.text,
      category: 'عمل',
      estimatedMinutes: 20,
      microSteps: [
        { id: '1', text: 'فتح ملف العمل وتجهيز المحيط', completed: false },
        { id: '2', text: `البدء في الخطوة الأولى من: ${item.text.slice(0, 30)}`, completed: false },
        { id: '3', text: 'إنهاء الجزء الأساسي ومراجعته', completed: false },
      ],
      currentStepIndex: 0,
      completed: false,
      createdAt: Date.now(),
    };
    onStartFocusTask(newTask);
  };

  const handleConvertItemToVault = (item: IdeaItem) => {
    onAddParkedIdeas([
      {
        id: Math.random().toString(36).substring(2, 9),
        title: item.text,
        createdAt: Date.now(),
      },
    ]);
    handleDeleteItem(item.id);
    playChime('success');
  };

  const handleConvertItemToErrand = (item: IdeaItem) => {
    onAddErrands([
      {
        id: Math.random().toString(36).substring(2, 9),
        title: item.text,
        completed: false,
      },
    ]);
    handleDeleteItem(item.id);
    playChime('success');
  };

  // Smart Reorder using Gemini or smart heuristic
  const handleSmartReorder = async () => {
    if (collectedItems.length < 2) return;
    setIsLoading(true);

    try {
      const allTexts = collectedItems.map((i) => i.text).join('\n');
      const response = await fetch('/api/gemini/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: allTexts }),
      });

      if (response.ok) {
        const data = await response.json();
        setParsedResult(data);
        playChime('success');
      } else {
        // Fallback: reverse order (most recent first)
        setCollectedItems((prev) => [...prev].reverse());
        playChime('pop');
      }
    } catch {
      // Fallback
      setCollectedItems((prev) => [...prev].reverse());
    } finally {
      setIsLoading(false);
    }
  };

  // Batch analyze
  const handleAnalyze = async () => {
    const textToAnalyze = dumpMode === 'batch'
      ? rawText.trim()
      : collectedItems.map((i) => i.text).join('. ');

    if (!textToAnalyze) return;

    setIsLoading(true);
    setSpeechError(null);

    try {
      const response = await fetch('/api/gemini/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: textToAnalyze }),
      });

      if (!response.ok) {
        throw new Error('فشل تحليل الأفكار من الخادم.');
      }

      const data = await response.json();
      setParsedResult(data);
      playChime('step');

      // Auto-save parked ideas
      if (data.parkedIdeas && data.parkedIdeas.length > 0) {
        const mappedIdeas: ParkedIdea[] = data.parkedIdeas.map((item: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          title: item.title,
          note: item.note,
          createdAt: Date.now(),
        }));
        onAddParkedIdeas(mappedIdeas);
      }

      // Auto-save errands
      if (data.errands && data.errands.length > 0) {
        const mappedErrands: Errand[] = data.errands.map((item: any) => ({
          id: Math.random().toString(36).substring(2, 9),
          title: item.title,
          timeOrDate: item.timeOrDate,
          completed: false,
        }));
        onAddErrands(mappedErrands);
      }
    } catch (err: any) {
      console.error(err);
      setSpeechError(err.message || 'حدث خطأ أثناء الاتصال. يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Header with Mode Switcher */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t.dumpTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              تخلّص من فوضى الأفكار المتزاحمة في رأسك بالطريقة التي تريح دماغك الآن:
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-[#181818] rounded-xl border border-stone-200 dark:border-stone-800 self-start sm:self-auto shrink-0">
            <button
              onClick={() => {
                setDumpMode('items');
                playChime('step');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dumpMode === 'items'
                  ? 'bg-white dark:bg-[#252525] text-amber-500 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>فكرة فكرة (سريع)</span>
            </button>

            <button
              onClick={() => {
                setDumpMode('batch');
                playChime('step');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dumpMode === 'batch'
                  ? 'bg-white dark:bg-[#252525] text-amber-500 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>نص شامل دفعة واحدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: ITEM-BY-ITEM RAPID CAPTURE */}
      {dumpMode === 'items' && (
        <div className="space-y-4">
          {/* Compact Input Field */}
          <form onSubmit={handleAddSingleItem} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-3 shadow-xs space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                placeholder="اكتب فكرة سريعة هنا واضغط Enter أو زر الإضافة..."
                className="w-full text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/70 dark:bg-[#0c0c0c] p-3 pl-20 rtl:pl-20 rtl:pr-3 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-amber-500 transition-all"
              />

              <div className="absolute left-2 rtl:left-2 rtl:right-auto flex items-center gap-1">
                {isSpeechRecognitionSupported() && (
                  <button
                    type="button"
                    onClick={() => toggleRecording('single')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isRecording && recordingTarget === 'single'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    }`}
                    title="تسجيل صوتي لهذه الفكرة"
                  >
                    {isRecording && recordingTarget === 'single' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!singleInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black font-extrabold text-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>أضف</span>
                </button>
              </div>
            </div>

            {isRecording && recordingTarget === 'single' && interimText && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 text-xs text-red-400 animate-pulse font-mono">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>جارِ الاستماع: "{interimText}"</span>
              </div>
            )}
          </form>

          {/* List of Collected Items */}
          {collectedItems.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-1">
                <span>الأفكار المفرغة ({collectedItems.length}): رتّبها بنفسك بالأسهم أو اضغط ترتيب ذكي</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSmartReorder}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ترتيب ذكي بالأولويات</span>
                  </button>
                  <button
                    onClick={() => setCollectedItems([])}
                    className="text-[11px] text-stone-400 hover:text-red-400 cursor-pointer"
                  >
                    مسح الكل
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {collectedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group bg-white dark:bg-[#141414] border border-stone-200 dark:border-[#262626] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-stone-400 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Manual Reorder Buttons */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                          title="نقل لأعلى"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === collectedItems.length - 1}
                          className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                          title="نقل لأسفل"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-[#202020] text-stone-500 dark:text-stone-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {item.text}
                      </span>
                    </div>

                    {/* Action Pills */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleConvertItemToTask(item)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-black text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="ابدأ التركيز على هذه المهمة الآن"
                      >
                        <Target className="w-3 h-3" />
                        <span>تركيز الآن</span>
                      </button>

                      <button
                        onClick={() => handleConvertItemToVault(item)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#202020] hover:bg-amber-500/20 text-stone-600 dark:text-stone-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="حفظ في درج الأفكار لعدم نسيانها"
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>للدرج</span>
                      </button>

                      <button
                        onClick={() => handleConvertItemToErrand(item)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#202020] hover:bg-blue-500/20 text-stone-600 dark:text-stone-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="إضافة كمشوار"
                      >
                        <Clock className="w-3 h-3" />
                        <span>مشوار</span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-lg text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Full Triage Button */}
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isLoading ? 'جارِ فرز الأفكار بالذكاء الاصطناعي...' : `فرز وتصنيف الـ (${collectedItems.length}) أفكار بالذكاء الاصطناعي`}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-center space-y-1">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                لم تفرغ أي أفكار بعد. اكتب أول فكرة تدور في ذهنك بالأعلى واضغط Enter!
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: BATCH ALL-IN-ONE TEXTAREA */}
      {dumpMode === 'batch' && (
        <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t.dumpPlaceholder}
            rows={5}
            className="w-full rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/60 dark:bg-[#0c0c0c] p-3.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-500 transition-all resize-none leading-relaxed"
          />

          {isRecording && recordingTarget === 'batch' && interimText && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-pulse font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />
              <span>جارِ الاستماع: "{interimText}"</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleRecording('batch')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  isRecording && recordingTarget === 'batch'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-stone-100 dark:bg-[#1f1f1f] hover:bg-stone-200 dark:hover:bg-[#282828] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-[#2f2f2f]'
                }`}
              >
                {isRecording && recordingTarget === 'batch' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />}
                <span>{isRecording && recordingTarget === 'batch' ? 'إيقاف التسجيل' : t.dumpBtnMicLive}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setParsedResult(null);
                  }}
                  className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-2 py-1"
                >
                  مسح
                </button>
              )}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!rawText.trim() || isLoading}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-black shadow-xs disabled:opacity-40 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'جارِ الفرز والتنظيم...' : t.dumpBtnTriage}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARSED RESULTS CARD (IF ANY) */}
      {parsedResult && (
        <div className="bg-stone-50/80 dark:bg-[#141414] border border-stone-200 dark:border-[#262626] rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
            <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نتيجة الفرز الذكي للأفكار</span>
            </span>
            <button
              onClick={() => setParsedResult(null)}
              className="text-[11px] text-stone-400 hover:text-stone-600"
            >
              إغلاق
            </button>
          </div>

          {/* Primary Task */}
          {parsedResult.focusTask && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#1c1c1c] border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  المهمة الوحيدة المقترحة للبدء فوراً:
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {parsedResult.focusTask.estimatedMinutes} دقيقة
                </span>
              </div>

              <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                {parsedResult.focusTask.title}
              </h4>

              {parsedResult.focusTask.microSteps && (
                <div className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                  {parsedResult.focusTask.microSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const newTask: FocusTask = {
                    id: Math.random().toString(36).substring(2, 9),
                    title: parsedResult.focusTask.title,
                    category: (parsedResult.focusTask.category as any) || 'عمل',
                    estimatedMinutes: parsedResult.focusTask.estimatedMinutes || 20,
                    microSteps: parsedResult.focusTask.microSteps.map((s, idx) => ({
                      id: String(idx + 1),
                      text: s,
                      completed: false,
                    })),
                    currentStepIndex: 0,
                    completed: false,
                    createdAt: Date.now(),
                  };
                  onStartFocusTask(newTask);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء التركيز على هذه المهمة الآن</span>
              </button>
            </div>
          )}

          {/* Reassurance text */}
          {parsedResult.reassurance && (
            <p className="text-xs text-stone-500 dark:text-stone-400 text-center font-mono">
              🌿 {parsedResult.reassurance}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
