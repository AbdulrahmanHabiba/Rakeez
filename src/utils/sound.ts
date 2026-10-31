// Web Audio API sound synthesizer for dopamine rewards and ADHD focus ambient sounds

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(type: 'success' | 'step' | 'alarm' | 'pop') {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'success') {
    // Joyful melodic dopamine chord (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } else if (type === 'step') {
    // Gentle high ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } else if (type === 'alarm') {
    // Subtle two-tone wake up chime
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.2);

      gain.gain.setValueAtTime(0.18, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.36);
    });
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }
}

// Ambient noise generator for ADHD focus (Brown Noise / 40Hz Focus Tone / Rain)
let ambientSource: AudioNode | null = null;
let ambientGain: GainNode | null = null;

export function stopAmbientSound() {
  if (ambientGain && audioCtx) {
    ambientGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    setTimeout(() => {
      if (ambientSource) {
        try {
          (ambientSource as any).stop?.();
          ambientSource.disconnect();
        } catch {
          // ignore
        }
        ambientSource = null;
      }
    }, 350);
  }
}

export function playAmbientSound(type: 'brown' | 'binaural40' | 'rain') {
  stopAmbientSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
  gain.connect(ctx.destination);
  ambientGain = gain;

  if (type === 'binaural40') {
    // 40Hz Gamma Focus: Carrier 200Hz in left ear, 240Hz in right ear
    const merger = ctx.createChannelMerger(2);

    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(200, ctx.currentTime);

    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(240, ctx.currentTime);

    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    merger.connect(gain);

    oscLeft.start();
    oscRight.start();

    ambientSource = {
      disconnect: () => {
        oscLeft.stop();
        oscRight.stop();
        oscLeft.disconnect();
        oscRight.disconnect();
        merger.disconnect();
      },
    } as any;
  } else {
    // Synthesize Brown/Pink noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown' || type === 'rain') {
        // Brown noise formula (leaky integrator)
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to make it soft and pleasant
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 350, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    noise.start();

    ambientSource = noise;
  }
}
