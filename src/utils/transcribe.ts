// Helper for recording microphone audio and transcribing via gemini-3.5-transcribe

export async function recordAndTranscribe(
  maxSeconds = 15,
  onProgress?: (secondsLeft: number) => void
): Promise<{ transcript: string; error?: string }> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { transcript: '', error: 'الميكروفون غير مدعوم في متصفحك.' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: Blob[] = [];

    return new Promise((resolve) => {
      let secondsLeft = maxSeconds;
      const interval = setInterval(() => {
        secondsLeft -= 1;
        onProgress?.(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(interval);
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        clearInterval(interval);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Audio = reader.result as string;

          try {
            const res = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType: audioBlob.type || 'audio/webm',
              }),
            });

            if (!res.ok) {
              throw new Error('فشل التفريغ الصوتي عبر الخادم.');
            }

            const data = await res.json();
            resolve({ transcript: data.transcript || '' });
          } catch (err: any) {
            resolve({
              transcript: '',
              error: err?.message || 'حدث خطأ أثناء الاتصال بنموذج gemini-3.5-transcribe.',
            });
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
    });
  } catch (err: any) {
    return { transcript: '', error: err.message || 'تعذر الوصول إلى الميكروفون.' };
  }
}
