import React, { useState } from 'react';
import { Clock, Timer, Hourglass, Volume2, X, ChevronRight, Compass } from 'lucide-react';
import { GiantZenClock } from './GiantZenClock';
import { SecondsCounter } from './SecondsCounter';
import { VisualTimeTimer } from './VisualTimeTimer';
import { PomodoroTimer } from './PomodoroTimer';
import { playChime, playAmbientSound, stopAmbientSound } from '../../utils/sound';

interface ExtensionsHubProps {
  onClose: () => void;
  onDopamineEarned?: (amount: number) => void;
  onMinimizeExtension?: (type: 'pomodoro' | 'seconds' | 'visual' | 'clock') => void;
}

type ActiveExtension = 'menu' | 'zen_clock' | 'seconds_counter' | 'visual_timer' | 'pomodoro';

export const ExtensionsHub: React.FC<ExtensionsHubProps> = ({
  onClose,
  onDopamineEarned,
  onMinimizeExtension,
}) => {
  const [activeExt, setActiveExt] = useState<ActiveExtension>('menu');
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const extensions = [
    {
      id: 'pomodoro' as const,
      title: 'مؤقت بومودورو العصبي (ADHD Pomodoro 25/5)',
      desc: 'جلسات تركيز مقسمة مع شريط تقدم مهدئ وفترات استراحة قصيرة لحماية العقل من الإرهاق.',
      badge: '25m / 5m Cycle',
      icon: Timer,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'zen_clock' as const,
      title: 'ساعة التركيز العملاقة (Giant Zen Clock)',
      desc: 'ساعة شاشة كاملة عملاقة خالية من أي مشتتات بترتيب LTR دقيق (الساعة : الدقيقة : الثانية) مع التاريخ.',
      badge: 'Fullscreen Zen',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'seconds_counter' as const,
      title: 'عداد الثواني ومؤقت الدقة (Seconds Counter)',
      desc: 'مؤقت دقيق يعد الثواني وأجزاء الثانية مع تسجيل الجولات وتحدي الصمود بدون تشتت.',
      badge: '1, 2, 3... Counter',
      icon: Timer,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'visual_timer' as const,
      title: 'قرص الوقت البصري (Visual Time Disc)',
      desc: 'قرص ملون ينكمش تدريجياً لعلاج عمى الوقت (Time Blindness) ومساعدتك على رؤية الوقت وهو يمر.',
      badge: 'Visual Pie',
      icon: Hourglass,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  const ambientSounds = [
    { id: 'brown' as const, name: 'ضوضاء بنية (Brown Noise)', desc: 'الأفضل لتهدئة فرط النشاط الذهني والضجيج الداخلي للـ ADHD' },
    { id: 'binaural40' as const, name: 'موجات غاما 40Hz (Binaural Focus)', desc: 'تحفيز التزامن العصبي وزيادة قوة التركيز والانتباه' },
    { id: 'rain' as const, name: 'صوت المطر الهادئ (Gentle Rain)', desc: 'عزل المشتتات المحيطة وخلق بيئة عمل مريحة للأعصاب' },
  ];

  const toggleSound = (soundId: 'brown' | 'binaural40' | 'rain') => {
    if (activeSound === soundId) {
      stopAmbientSound();
      setActiveSound(null);
    } else {
      playAmbientSound(soundId);
      setActiveSound(soundId);
    }
  };

  const handleMinimize = (type: 'pomodoro' | 'seconds' | 'visual' | 'clock') => {
    setActiveExt('menu');
    onMinimizeExtension?.(type);
    onClose();
  };

  if (activeExt === 'pomodoro') {
    return (
      <PomodoroTimer
        onClose={() => setActiveExt('menu')}
        onMinimize={() => handleMinimize('pomodoro')}
        onDopamineEarned={onDopamineEarned}
      />
    );
  }

  if (activeExt === 'zen_clock') {
    return (
      <GiantZenClock
        onClose={() => setActiveExt('menu')}
        onMinimize={() => handleMinimize('clock')}
      />
    );
  }

  if (activeExt === 'seconds_counter') {
    return (
      <SecondsCounter
        onClose={() => setActiveExt('menu')}
        onMinimize={() => handleMinimize('seconds')}
        onDopamineEarned={onDopamineEarned}
      />
    );
  }

  if (activeExt === 'visual_timer') {
    return (
      <VisualTimeTimer
        onClose={() => setActiveExt('menu')}
        onMinimize={() => handleMinimize('visual')}
        onDopamineEarned={onDopamineEarned}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-black flex items-center justify-center shadow-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-100 flex items-center gap-2">
                <span>ملحقات وإكستنشنز الوقت والتركيز</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                  Extensions
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                ساعات عملاقة ومؤقتات بصرية وبومودورو وعزل صوتي ذهني مصمم لـ ADHD.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Extensions List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-400 font-mono uppercase">
            أدوات الوقت والساعات البصرية
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {extensions.map((ext) => {
              const Icon = ext.icon;
              return (
                <div
                  key={ext.id}
                  onClick={() => {
                    setActiveExt(ext.id);
                    playChime('step');
                  }}
                  className="group p-4 rounded-2xl border border-stone-800 bg-[#0e0e0e] hover:bg-stone-900/90 hover:border-stone-700 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${ext.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-stone-100 group-hover:text-cyan-400 transition-colors">
                          {ext.title}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-semibold">
                          {ext.badge}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                        {ext.desc}
                      </p>
                    </div>
                  </div>

                  <button className="px-3.5 py-2 rounded-xl bg-stone-800 group-hover:bg-cyan-500 text-stone-300 group-hover:text-black font-extrabold text-xs shrink-0 flex items-center gap-1 transition-all">
                    <span>تشغيل</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Soundscapes Box */}
        <div className="space-y-3 pt-2 border-t border-stone-800/80">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-400 font-mono uppercase flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>العزل الصوتي الذهني (مُوَلّد حي بدون ملفات خارجية)</span>
            </h4>
            {activeSound && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold animate-pulse">
                جارِ التشغيل • Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ambientSounds.map((snd) => {
              const isActive = activeSound === snd.id;
              return (
                <button
                  key={snd.id}
                  onClick={() => toggleSound(snd.id as any)}
                  className={`p-3 rounded-2xl border text-xs text-start transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500/15 shadow-md text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'border-stone-800 bg-[#0e0e0e] text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold">{snd.name.split(' ')[0]} {snd.name.split(' ')[1]}</span>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-ping' : 'bg-stone-700'}`} />
                  </div>
                  <span className="text-[10px] text-stone-400 line-clamp-2">
                    {snd.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
