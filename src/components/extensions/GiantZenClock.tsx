import React, { useState, useEffect } from 'react';
import { X, Minimize2, Moon, Volume2, VolumeX } from 'lucide-react';

interface GiantZenClockProps {
  onClose: () => void;
  onMinimize?: () => void;
}

export const GiantZenClock: React.FC<GiantZenClockProps> = ({ onClose, onMinimize }) => {
  const [time, setTime] = useState(new Date());
  const [showSeconds, setShowSeconds] = useState(true);
  const [is24H, setIs24H] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isTickSound, setIsTickSound] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);
      if (isTickSound) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(now.getSeconds() === 0 ? 800 : 440, ctx.currentTime);
          gain.gain.setValueAtTime(0.015, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.06);
        } catch {}
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isTickSound]);

  // Format hours and minutes
  let hours = time.getHours();
  const ampm = hours >= 12 ? 'م' : 'ص';
  if (!is24H) {
    hours = hours % 12 || 12;
  }
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(time.getMinutes()).padStart(2, '0');
  const secondsStr = String(time.getSeconds()).padStart(2, '0');

  // Arabic Date
  const dateFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(time);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen z-50 flex flex-col justify-between p-6 sm:p-12 transition-all duration-500 select-none overflow-hidden ${
        isDimmed ? 'bg-black text-stone-500' : 'bg-black text-white'
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between z-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-stone-400">
            ساعة التركيز العملاقة • ZEN FULLSCREEN CLOCK
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSeconds(!showSeconds)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors cursor-pointer ${
              showSeconds ? 'border-amber-400 text-amber-400 bg-amber-400/10' : 'border-stone-800 text-stone-500'
            }`}
            title="إظهار / إخفاء الثواني"
          >
            الثواني {showSeconds ? '✓' : '✗'}
          </button>

          <button
            onClick={() => setIs24H(!is24H)}
            className="px-3 py-1.5 rounded-xl border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            {is24H ? '24H' : '12H'}
          </button>

          <button
            onClick={() => setIsDimmed(!isDimmed)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDimmed ? 'border-amber-400 text-amber-400 bg-amber-400/10' : 'border-stone-800 text-stone-400'
            }`}
            title="الوضع المظلم الهادئ (Dim Mode)"
          >
            <Moon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsTickSound(!isTickSound)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isTickSound ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10' : 'border-stone-800 text-stone-400'
            }`}
            title="صوت دقات الساعة الهادئة"
          >
            {isTickSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-2 rounded-xl border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="تصغير إلى الزاوية (PIP)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-white transition-colors cursor-pointer"
            title="إغلاق الساعة والعودة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Giant Digits (Strictly LTR: Hours : Minutes : Seconds) */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-6 w-full">
        <div
          dir="ltr"
          className="font-mono font-black tracking-tighter flex items-center justify-center tabular-nums leading-none"
        >
          {/* Hours & Minutes */}
          <span className="text-6xl sm:text-8xl md:text-9xl lg:text-[13rem] xl:text-[16rem] text-stone-100 filter drop-shadow-[0_0_35px_rgba(255,255,255,0.18)]">
            {hoursStr}:{minutesStr}
          </span>

          {/* Seconds in correct position (on the right) */}
          {showSeconds && (
            <span className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl text-amber-400/90 ms-3 sm:ms-6 self-end mb-3 sm:mb-8 font-bold">
              :{secondsStr}
            </span>
          )}

          {!is24H && (
            <span className="text-base sm:text-2xl font-bold text-stone-500 ms-3 sm:ms-5 self-start mt-4 sm:mt-8">
              {ampm}
            </span>
          )}
        </div>

        <p className="text-base sm:text-2xl text-stone-400 font-bold tracking-wide">
          {dateFormatted}
        </p>
      </div>

      {/* Bottom Zen Quote */}
      <div className="text-center text-xs sm:text-sm text-stone-600 font-mono w-full max-w-2xl mx-auto pb-2">
        ركز على هذه اللحظة فقط • لا تشغل نفسك بما فات أو ما هو آت • اضغط Esc أو ✕ للخروج
      </div>
    </div>
  );
};
