import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Trash2,
  Bot,
  User,
  Sparkles,
  Zap,
  Cpu,
  BrainCircuit,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, FocusTask } from '../types';
import { isSpeechRecognitionSupported, startSpeechRecognition, speakArabic } from '../utils/speech';
import { playChime } from '../utils/sound';

interface GeminiCoachChatProps {
  messages: ChatMessage[];
  onSendMessage: (userMessage: string, model: string) => Promise<void>;
  onClearChat: () => void;
  activeTask?: FocusTask | null;
  isLoading: boolean;
}

export const GeminiCoachChat: React.FC<GeminiCoachChatProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  activeTask,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>(
    'gemini-3.8-flash'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setSpeechError(null);
    playChime('pop');
    await onSendMessage(text, selectedModel);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsRecording(false);
    } else {
      setSpeechError(null);
      if (!isSpeechRecognitionSupported()) {
        setSpeechError('التعرف الصوتي غير مدعوم في متصفحك.');
        return;
      }

      playChime('pop');
      const rec = startSpeechRecognition({
        lang: 'ar-SA',
        onResult: (transcript, isFinal) => {
          setInputText((prev) => {
            if (isFinal) {
              return prev ? `${prev} ${transcript}` : transcript;
            }
            return prev.includes(transcript) ? prev : prev ? `${prev} ${transcript}` : transcript;
          });
        },
        onError: (err) => {
          setSpeechError(`خطأ في التسجيل: ${err}`);
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

  const quickPrompts = [
    'أنا حاسس بشلل تنفيذي ومش عارف أبدأ إيه أولاً',
    'كن معايا Body Double لمدة 15 دقيقة وتابع تركيزي',
    'كل شوية بفتح 100 تاب في المتصفح ومش بخلص حاجة، وقفني!',
    'جالي فكرة مشروع تاني ومتحمس لها ومشتتاني عن شغلي',
  ];

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs flex flex-col h-[650px]">
      {/* Top Bar with Model Switcher & Status */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>سند • رفيق التركيز (Body Double)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-stone-500">
              {activeTask
                ? `يرافقك أثناء مهمتك: ${activeTask.title.slice(0, 30)}...`
                : 'جاهز لمساعدتك في ترتيب عقلك ودحر التسويف'}
            </p>
          </div>
        </div>

        {/* Model Selector Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-xl text-[11px]">
            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
              title="النموذج العام المتوازن للتركيز والمحادثة السريعة"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>3.8 Flash</span>
            </button>
            <button
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                selectedModel === 'gemini-4-argon'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
              title="للتفكير المعقد والمهام الصعبة وحل المشكلات البرمجية"
            >
              <Cpu className="w-3 h-3 text-purple-500" />
              <span>4 Argon</span>
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
              title="استجابة فائقة السرعة ولحظية"
            >
              <Zap className="w-3 h-3 text-blue-500" />
              <span>Flash Lite</span>
            </button>
          </div>

          <button
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="مسح المحادثة وبدء جلسة جديدة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-stone-500">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-stone-800/80 text-amber-500 flex items-center justify-center">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                أهلاً بك يا بطل! أنا رفيقك في التركيز 🧘‍♂️
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                أنا مصمم مخصوص لطبيعة عقل الـ ADHD وللمبرمجين. لا ألقي عليك محاضرات، بل نأخذ خطوة واحدة فقط في المرة، وأساندك وقت الشلل التنفيذي أو الرغبة في الهروب لمشروع جديد.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="w-full max-w-md space-y-1.5 text-right">
              <p className="text-[11px] font-bold text-stone-400">ابدأ بنقرة سريعة:</p>
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-right text-xs bg-stone-50 dark:bg-stone-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800 text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-between"
                >
                  <span>{q}</span>
                  <span className="text-stone-300 text-xs">←</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-white rounded-br-xs font-medium'
                    : 'bg-stone-100 dark:bg-stone-800/90 text-stone-900 dark:text-stone-100 rounded-bl-xs border border-stone-200/50 dark:border-stone-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/40 dark:border-stone-700/40 text-[10px] text-stone-400">
                    <span>رفيق التركيز</span>
                    <button
                      onClick={() => speakArabic(msg.content)}
                      className="p-1 hover:text-amber-500 transition-colors"
                      title="استمع للإجابة بالصوت"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-stone-700 text-white flex items-center justify-center text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-center">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-stone-100 dark:bg-stone-800 p-3 rounded-2xl text-xs text-stone-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-stone-400">سند يفكر ويكتب...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30 space-y-2">
        {speechError && (
          <div className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{speechError}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl border transition-all ${
              isRecording
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
            }`}
            title="تحدث بالصوت"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-500" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="تحدث أو اكتب لسند.. (مثلاً: حاسس إني هربت من الكود لليوتيوب، ساعدني أرجع)"
            className="flex-1 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-2.5 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-all shadow-xs"
            title="إرسال"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
