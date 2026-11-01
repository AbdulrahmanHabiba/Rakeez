// Web Speech Recognition wrapper supporting Arabic and hands-free voice capture with anti-duplication
export interface SpeechRecognitionResultHandler {
  onResult: (finalText: string, interimText: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// Cleans consecutive duplicated words (common bug in continuous speech recognition)
export function cleanDuplicateWords(text: string): string {
  if (!text) return '';
  // Split words by whitespace
  const words = text.trim().split(/\s+/);
  const cleaned: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // If consecutive identical word, skip it (up to 1 duplicate allowed if natural, but skip 2+ or 1 if exact match)
    if (i > 0 && word.toLowerCase() === words[i - 1].toLowerCase()) {
      continue;
    }
    cleaned.push(word);
  }
  return cleaned.join(' ');
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

  let accumulatedFinal = '';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let newlyFinalized = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptSegment = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        newlyFinalized += (newlyFinalized ? ' ' : '') + transcriptSegment.trim();
      } else {
        interimTranscript += (interimTranscript ? ' ' : '') + transcriptSegment.trim();
      }
    }

    if (newlyFinalized) {
      accumulatedFinal = (accumulatedFinal ? `${accumulatedFinal} ${newlyFinalized}` : newlyFinalized).trim();
      accumulatedFinal = cleanDuplicateWords(accumulatedFinal);
    }

    onResult(accumulatedFinal, interimTranscript.trim());
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition event error:', event.error);
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
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
