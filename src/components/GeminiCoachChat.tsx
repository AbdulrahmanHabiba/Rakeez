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
  Brain,
  AlertCircle,
  ArrowRight,
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
  onBack?: () => void;
}

export const GeminiCoachChat: React.FC<GeminiCoachChatProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  activeTask,
  isLoading,
  onBack,
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
    <div className="max-w-3xl mx-auto space-y-4 py-4 animate-in fade-in duration-300">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0" />
          <span>العودة لجميع الأدوات</span>
        </button>
      )}

      <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px]">
        {/* Top Header with Model Picker */}
        <div className="p-3.5 border-b border-stone-100 dark:border-[#222222] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-[#202020] text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                سند • رفيق التركيز (Body Double)
              </h3>
              <p className="text-[10px] text-stone-400">
                {activeTask ? `مهمتك: ${activeTask.title.slice(0, 30)}` : 'جلسة دعم وتوجيه ذهني'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 dark:bg-[#1a1a1a] p-0.5 rounded-lg text-[10px] font-mono">
              <button
                onClick={() => setSelectedModel('gemini-3.8-flash')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-white dark:bg-[#282828] text-stone-900 dark:text-white font-bold shadow-xs'
                    : 'text-stone-400'
                }`}
              >
                3.8 Flash
              </button>
              <button
                onClick={() => setSelectedModel('gemini-4-argon')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedModel === 'gemini-4-argon'
                    ? 'bg-white dark:bg-[#282828] text-stone-900 dark:text-white font-bold shadow-xs'
                    : 'text-stone-400'
                }`}
              >
                4 Argon
              </button>
              <button
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-white dark:bg-[#282828] text-stone-900 dark:text-white font-bold shadow-xs'
                    : 'text-stone-400'
                }`}
              >
                Flash Lite
              </button>
            </div>

            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-[#202020] transition-colors"
              title="مسح المحادثة"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-stone-400">
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-[#1a1a1a] text-stone-500 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div className="max-w-sm space-y-1">
                <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  مرحباً يا بطل، أنا معك لمضاعفة الحضور والتركيز.
                </p>
                <p className="text-[11px] text-stone-400">
                  قولي أنت بتعمل إيه دلوقتي أو اختار فكرة سريعة:
                </p>
              </div>

              <div className="w-full max-w-sm space-y-1.5 text-right pt-2">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-right text-xs bg-stone-50 dark:bg-[#181818] hover:bg-stone-100 dark:hover:bg-[#222222] p-2.5 rounded-xl border border-stone-200/60 dark:border-[#222222] text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-stone-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] shrink-0 font-bold">
                    س
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-black font-medium'
                      : 'bg-stone-100 dark:bg-[#1a1a1a] text-stone-900 dark:text-stone-100 border border-stone-200/50 dark:border-[#262626]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/40 dark:border-[#2a2a2a] text-[10px] text-stone-400">
                      <span>سند</span>
                      <button
                        onClick={() => speakArabic(msg.content)}
                        className="p-1 hover:text-stone-900 dark:hover:text-white transition-colors"
                        title="استماع"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-2 items-center text-xs text-stone-400 p-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] font-mono mr-1">سند يكتب...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-100 dark:border-[#222222]">
          {speechError && (
            <div className="text-[10px] text-red-500 pb-1 flex items-center gap-1">
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
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-red-500 text-white border-red-500 animate-pulse'
                  : 'bg-stone-50 dark:bg-[#1a1a1a] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-[#262626]'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب أو تحدث لسند..."
              className="flex-1 text-xs rounded-xl border border-stone-200 dark:border-[#262626] bg-stone-50/50 dark:bg-[#0c0c0c] p-2.5 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-stone-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-black disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
