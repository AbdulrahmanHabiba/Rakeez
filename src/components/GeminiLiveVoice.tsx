import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Volume2, Radio, AlertCircle, Play, Pause, X } from 'lucide-react';
import { playChime } from '../utils/sound';
import { speakArabic } from '../utils/speech';

interface GeminiLiveVoiceProps {
  onClose?: () => void;
  activeTaskTitle?: string;
}

export const GeminiLiveVoice: React.FC<GeminiLiveVoiceProps> = ({ onClose, activeTaskTitle }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [aiIsResponding, setAiIsResponding] = useState(false);
  const [statusMessage, setStatusMessage] = useState('جاهز للاتصال بنموذج gemini-3.8-live (Live API)...');
  const [lastModelSpokenText, setLastModelSpokenText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Connect & Start Voice Session
  const startLiveSession = async () => {
    try {
      setStatusMessage('جارِ الاتصال المباشر بنموذج gemini-3.8-live عبر WebSocket...');
      playChime('pop');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusMessage('متصل بنجاح! جارِ تشغيل الميكروفون المباشر...');

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);

            // Compute audio volume level for visualizer
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            setAudioLevel(Math.min(100, Math.round(rms * 400)));

            // Convert Float32 to Int16 PCM and Base64 encode
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            const uint8 = new Uint8Array(pcm16.buffer);
            let binary = '';
            for (let i = 0; i < uint8.byteLength; i++) {
              binary += String.fromCharCode(uint8[i]);
            }
            const base64Audio = btoa(binary);

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio: base64Audio }));
            }
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);
          setIsTalking(true);
          setStatusMessage('الجلسة الصوتية المباشرة نشطة 🎙️ تحدث بحرية وسيرد عليك سند في الوقت الفعلي.');
        } catch (micErr: any) {
          console.warn('Microphone stream error:', micErr);
          setStatusMessage('تم الاتصال ولكن تعذر تشغيل الميكروفون تلقائياً. يمكنك التحدث عبر الأزرار السريعة.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === 'ready' || data.status === 'ready_fallback') {
            setStatusMessage(data.message || 'متصل برفيق التركيز الصوتي.');
          }

          if (data.textReply) {
            setLastModelSpokenText(data.textReply);
            setAiIsResponding(true);
            speakArabic(data.textReply);
            setTimeout(() => setAiIsResponding(false), 5000);
          }

          if (data.audio) {
            setAiIsResponding(true);
            // Play raw audio or notify
            setTimeout(() => setAiIsResponding(false), 3000);
          }

          if (data.interrupted) {
            window.speechSynthesis?.cancel();
            setAiIsResponding(false);
          }
        } catch (err) {
          console.warn('Live message parse error:', err);
        }
      };

      ws.onerror = () => {
        setStatusMessage('حدث خطأ في الاتصال بالـ WebSocket. مفعل وضع الرفيق الصوتي الذكي الاحتياطي.');
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsTalking(false);
      };
    } catch (e: any) {
      console.warn('Live session exception:', e);
      setStatusMessage('تعذر بدء الاتصال المباشر. يرجى التحقق من الشبكة.');
    }
  };

  const stopLiveSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsTalking(false);
    setAudioLevel(0);
    window.speechSynthesis?.cancel();
    playChime('pop');
    setStatusMessage('تم إنهاء الجلسة الصوتية.');
  };

  const sendQuickVoicePrompt = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ textPrompt: text }));
    } else {
      // Fallback
      setLastModelSpokenText(`أنا معك ومتابع تركيزك! خذ نفساً عميقاً، وركز في مهمتك الحالية: ${activeTaskTitle || 'البرمجة'}.`);
      speakArabic(`أنا معك ومتابع تركيزك! خذ نفساً عميقاً، وركز في مهمتك الحالية.`);
    }
    playChime('step');
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-6 max-w-2xl mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                محادثة صوتية مباشرة في الوقت الفعلي
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                gemini-3.8-live (Live API)
              </span>
            </div>
            <p className="text-xs text-stone-500">
              جلسة صوتية حية لمضاعفة الحضور (Live Body Doubling) بدون الحاجة للكتابة باليد!
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* The Visualizer Orb */}
      <div className="py-6 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Pulsing glow based on voice volume */}
          <div
            className={`w-32 h-32 rounded-full transition-all duration-150 ${
              aiIsResponding
                ? 'bg-purple-500/30 scale-125 animate-pulse'
                : isTalking
                ? 'bg-amber-500/20'
                : 'bg-stone-100 dark:bg-stone-800'
            }`}
            style={{
              transform: isTalking ? `scale(${1 + audioLevel / 150})` : undefined,
            }}
          />

          <div
            className={`absolute w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
              aiIsResponding
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-500/30'
                : isTalking
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/30'
                : 'bg-stone-300 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            {aiIsResponding ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : isTalking ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
          </div>
        </div>

        <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 text-center max-w-md">
          {statusMessage}
        </p>

        {lastModelSpokenText && (
          <div className="bg-amber-50 dark:bg-stone-800/80 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 text-center max-w-md animate-in fade-in">
            "{lastModelSpokenText}"
          </div>
        )}
      </div>

      {/* Main Action Button */}
      <div className="flex flex-col items-center gap-3">
        {!isConnected ? (
          <button
            onClick={startLiveSession}
            className="w-full max-w-xs py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            <span>بدء المحادثة الصوتية الحية</span>
          </button>
        ) : (
          <button
            onClick={stopLiveSession}
            className="w-full max-w-xs py-3 px-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <MicOff className="w-5 h-5" />
            <span>إنهاء المحادثة الصوتية</span>
          </button>
        )}
      </div>

      {/* Quick Prompts to stimulate Live Session */}
      <div className="border-t border-stone-100 dark:border-stone-800 pt-4 space-y-2">
        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block text-right">
          أو تحدث معه سريعاً بنقرة زر (Hands-free prompts):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => sendQuickVoicePrompt('أنا مبرمج وشغال على الكود دلوقتي، خليك معايا Body Double!')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-right transition-colors"
          >
            💻 "شغال على الكود دلوقتي، خليك معايا شجعني"
          </button>
          <button
            onClick={() => sendQuickVoicePrompt('عقلي مشتت جداً وحاسس بشلل تنفيذي، ساعدني أبدأ')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-right transition-colors"
          >
            🧠 "عقلي مشتت وحاسس بشلل تنفيذي"
          </button>
          <button
            onClick={() => sendQuickVoicePrompt('جالي فكرة مشروع تانية ومتحمس أهرب من شغلي الحالي')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-right transition-colors"
          >
            💡 "جالي فكرة مشروع تانية ومتحمس أهرب من شغلي"
          </button>
          <button
            onClick={() => sendQuickVoicePrompt('عندي مشوار وخايف أتاخر كالعادة، فكرني بموعد اللبس')}
            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-right transition-colors"
          >
            ⏰ "عندي مشوار وخايف أتاخر كالعادة"
          </button>
        </div>
      </div>
    </div>
  );
};
