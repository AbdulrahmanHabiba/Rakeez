import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, ArrowRight, Lightbulb, Clock, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { FocusTask, ParkedIdea, Errand } from '../types';
import { isSpeechRecognitionSupported, startSpeechRecognition } from '../utils/speech';
import { playChime } from '../utils/sound';

interface BrainDumpProps {
  onStartFocusTask: (task: FocusTask) => void;
  onAddParkedIdeas: (ideas: ParkedIdea[]) => void;
  onAddErrands: (errands: Errand[]) => void;
  onSendErrandToTimePlanner: (title: string, time?: string) => void;
}

export const BrainDump: React.FC<BrainDumpProps> = ({
  onStartFocusTask,
  onAddParkedIdeas,
  onAddErrands,
  onSendErrandToTimePlanner,
}) => {
  const [rawText, setRawText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Result state
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

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsRecording(false);
    } else {
      setSpeechError(null);
      if (!isSpeechRecognitionSupported()) {
        setSpeechError('التعرف الصوتي غير مدعوم في متصفحك الحالي، يمكنك كتابة أفكارك يدوياً.');
        return;
      }

      playChime('pop');
      const rec = startSpeechRecognition({
        lang: 'ar-SA',
        onResult: (transcript, isFinal) => {
          setRawText((prev) => {
            if (isFinal) {
              return prev ? `${prev} ${transcript}` : transcript;
            }
            return prev.includes(transcript) ? prev : prev ? `${prev} ${transcript}` : transcript;
          });
        },
        onError: (err) => {
          setSpeechError(`خطأ في الميكروفون: ${err}`);
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });

      setRecognitionInstance(rec);
      setIsRecording(true);
    }
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) return;

    setIsLoading(true);
    setSpeechError(null);

    try {
      const response = await fetch('/api/gemini/brain-dump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawText.trim() }),
      });

      if (!response.ok) {
        throw new Error('فشل تحليل الأفكار من الخادم.');
      }

      const data = await response.json();
      setParsedResult(data);
      playChime('step');

      // Auto-save parked ideas to storage
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

  const handleLaunchTask = () => {
    if (!parsedResult?.focusTask) return;

    const newTask: FocusTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: parsedResult.focusTask.title,
      category: (parsedResult.focusTask.category as any) || 'عمل',
      estimatedMinutes: parsedResult.focusTask.estimatedMinutes || 20,
      currentStepIndex: 0,
      completed: false,
      createdAt: Date.now(),
      microSteps: (parsedResult.focusTask.microSteps || ['البدء بفتح المشروع والملف المطلوب']).map(
        (text, idx) => ({
          id: `step-${idx}-${Date.now()}`,
          text,
          completed: false,
        })
      ),
    };

    playChime('success');
    onStartFocusTask(newTask);
  };

  const loadExample = (text: string) => {
    setRawText(text);
    setParsedResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro box */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-stone-900 dark:to-stone-900/60 border border-amber-200/60 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>تفريغ الدماغ الفوري (Brain Dump)</span>
              <span className="text-xs bg-amber-200 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium px-2 py-0.5 rounded-full">
                كتابة أو صوت
              </span>
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              عقلك ممتلئ بـ 10 أفكار في نفس اللحظة؟ لا تحاول تنظيمها بنفسك الآن. اكتب أو تحدث بكل ما في رأسك بشكل عشوائي، والذكاء الاصطناعي سيستخرج لك <strong>مهمة واحدة فقط</strong> تبدأ بها فوراً، ويحفظ باقي الأفكار بأمان.
            </p>
          </div>
        </div>

        {/* Text input area & Mic */}
        <div className="mt-4 relative">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="مثلاً: عاوز أصلح الـ Auth endpoint في الباك إند، بس افتكرت إني محتاج أجدد باقة النت، وعندي فكرة لتطبيق موبايل جديد، ودكتور الأسنان الساعة 6 المغرب وخايف أتاخر كالعادة..."
            rows={4}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 p-3.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none leading-relaxed"
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            {/* Audio Recording Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-xs ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-600" />}
                <span>{isRecording ? 'استماع مباشر.. اضغط للإيقاف' : 'إملاء صوتي مباشر'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setSpeechError(null);
                  setIsLoading(true);
                  try {
                    const { recordAndTranscribe } = await import('../utils/transcribe');
                    const res = await recordAndTranscribe(10);
                    if (res.transcript) {
                      setRawText((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
                      playChime('step');
                    } else if (res.error) {
                      setSpeechError(res.error);
                    }
                  } catch (e: any) {
                    setSpeechError(e.message || 'خطأ في التفريغ.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs transition-all"
                title="تسجيل صوتي وتفريغه بنموذج gemini-3.5-transcribe المتخصص"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>تفريغ بدقة AI (gemini-3.5-transcribe)</span>
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setParsedResult(null);
                  }}
                  className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 px-2 py-1"
                >
                  مسح
                </button>
              )}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!rawText.trim() || isLoading}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'جارِ تصفية الأفكار والفرز...' : 'فرز وتحديد أولوياتي الآن'}</span>
              </button>
            </div>
          </div>

          {speechError && (
            <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Quick preset chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
            <span>جرب سيل أفكار جاهز:</span>
            <button
              onClick={() =>
                loadExample(
                  'عاوز أخلص صفحة البروفايل، بس جالي فكرة مشروع SaaS جديد، ولازم أدفع فاتورة الكهربا وميعاد الجيم الساعة 7 ومشتت جداً'
                )
              }
              className="bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-md text-stone-700 dark:text-stone-300 transition-colors"
            >
              مشتت بين كود وفكرة جديدة وموعد
            </button>
            <button
              onClick={() =>
                loadExample(
                  'عندي Bug في الـ Database مش عارف أحلها وقاعد أفتح تبويبات كتيرة يوتيوب ومقالات ومش بعمل أي حاجة خالص من ساعتين'
                )
              }
              className="bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-md text-stone-700 dark:text-stone-300 transition-colors"
            >
              شلل تنفيذي أمام باج برمجية
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Result Box */}
      {parsedResult && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          {/* Calming reassurance banner */}
          {parsedResult.reassurance && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="font-medium">{parsedResult.reassurance}</p>
            </div>
          )}

          {/* The Single Focus Task (Holy Grail) */}
          {parsedResult.focusTask && (
            <div className="bg-white dark:bg-stone-900 border-2 border-amber-500 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    مهمتك الواحدة الآن (لا تفكر في غيرها)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {parsedResult.focusTask.estimatedMinutes} دقيقة فقط
                  </span>
                  {parsedResult.focusTask.category && (
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-semibold">
                      {parsedResult.focusTask.category}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100 leading-snug">
                  {parsedResult.focusTask.title}
                </h3>
              </div>

              {/* Micro-steps to beat executive dysfunction */}
              <div className="space-y-2 bg-stone-50 dark:bg-stone-950 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-800">
                <p className="text-xs font-bold text-stone-600 dark:text-stone-400">
                  خطوات صغيرة جداً للبدء دون تسويف (Micro-steps):
                </p>
                <div className="space-y-1.5">
                  {parsedResult.focusTask.microSteps?.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Launch Single Task Monotasker */}
              <button
                onClick={handleLaunchTask}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01]"
              >
                <span>ابدأ التركيز على هذه المهمة الآن مع التايمر</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}

          {/* Parked Ideas & Errands cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parked Ideas Vault */}
            {parsedResult.parkedIdeas && parsedResult.parkedIdeas.length > 0 && (
              <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>درج الأفكار المحفوظة (لا تقلق، لن تنساها)</span>
                  </h4>
                  <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded">
                    {parsedResult.parkedIdeas.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {parsedResult.parkedIdeas.map((idea, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-stone-950 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs"
                    >
                      <p className="font-semibold text-stone-800 dark:text-stone-200">{idea.title}</p>
                      {idea.note && <p className="text-[11px] text-stone-500 mt-0.5">{idea.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errands & Appointments */}
            {parsedResult.errands && parsedResult.errands.length > 0 && (
              <div className="bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>مشاوير أو التزامات مستقبلية</span>
                  </h4>
                  <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded">
                    {parsedResult.errands.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {parsedResult.errands.map((errand, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-stone-950 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-stone-800 dark:text-stone-200">{errand.title}</p>
                        {errand.timeOrDate && (
                          <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {errand.timeOrDate}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onSendErrandToTimePlanner(errand.title, errand.timeOrDate)}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors shrink-0"
                        title="إرسال لحاسبة عمى الوقت لحساب موعد الخروج وهامش الأمان"
                      >
                        احسب وقت الخروج
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
