// Web Speech Recognition wrapper supporting Arabic and hands-free voice capture

export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function startSpeechRecognition({
  onResult,
  onError,
  onEnd,
  lang = 'ar-SA',
}: SpeechRecognitionResultHandler & { lang?: string }) {
  if (!isSpeechRecognitionSupported()) {
    onError?.('متصفحك لا يدعم التعرف الصوتي المباشر. يمكنك الكتابة باليد.');
    return null;
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = (finalTranscript || interimTranscript).trim();
    if (currentText) {
      onResult(currentText, !!finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    if (event.error !== 'no-speech') {
      onError?.(event.error);
    }
  };

  recognition.onend = () => {
    onEnd?.();
  };

  try {
    recognition.start();
  } catch (e: any) {
    console.warn('Recognition start exception:', e);
  }

  return recognition;
}

// Optional text-to-speech for reading coach replies out loud
export function speakArabic(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find an Arabic voice if available
  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find((v) => v.lang.startsWith('ar'));
  if (arVoice) {
    utterance.voice = arVoice;
  }

  window.speechSynthesis.speak(utterance);
}
