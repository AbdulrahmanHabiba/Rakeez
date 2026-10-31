import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Brain,
  Code2,
  Moon,
  Sun,
  ShieldCheck,
  Gamepad2,
  Radio,
} from 'lucide-react';
import { playAmbientSound, stopAmbientSound } from '../utils/sound';

interface HeaderProps {
  completedMicroStepsCount: number;
  onOpenDevGuide: () => void;
  onLaunchGame: () => void;
  onLaunchLiveVoice: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  completedMicroStepsCount,
  onOpenDevGuide,
  onLaunchGame,
  onLaunchLiveVoice,
  darkMode,
  onToggleDarkMode,
}) => {
  const [ambientType, setAmbientType] = useState<'off' | 'brown' | 'binaural40' | 'rain'>('off');

  const handleSoundChange = (type: 'brown' | 'binaural40' | 'rain') => {
    if (ambientType === type) {
      stopAmbientSound();
      setAmbientType('off');
    } else {
      playAmbientSound(type);
      setAmbientType(type);
    }
  };

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & App title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 tracking-tight">
                ركّز <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">| Rakeez</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                <ShieldCheck className="w-3 h-3" />
                رفيق الـ ADHD
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              تصفية التشتت • مهمة واحدة في كل مرة • حاسبة عمى الوقت
            </p>
          </div>
        </div>

        {/* Ambient Noise + Dopamine Counter + Live Audio + 3D Game + Dev Guide + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Dopamine micro-reward counter */}
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-stone-800/80 border border-amber-200/70 dark:border-stone-700 text-stone-700 dark:text-stone-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden lg:inline">إنجازات اليوم:</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold px-1">{completedMicroStepsCount}</span>
          </div>

          {/* Live Voice Button (gemini-3.8-live) */}
          <button
            onClick={onLaunchLiveVoice}
            className="flex items-center gap-1.5 text-xs bg-amber-100/70 dark:bg-amber-950/70 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 font-bold transition-all shadow-xs"
            title="محادثة صوتية حية في الوقت الفعلي بنموذج gemini-3.8-live"
          >
            <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">صوت حي</span>
          </button>

          {/* 3D Tab Buster Game Launcher */}
          <button
            onClick={onLaunchGame}
            className="flex items-center gap-1.5 text-xs bg-purple-100/70 dark:bg-purple-950/70 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-200 px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 font-bold transition-all shadow-xs"
            title="لعبة كاسر التشتت ثلاثية الأبعاد (Three.js)"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">لعبة 3D</span>
          </button>

          {/* ADHD Ambient sound generator (Brown noise / Binaural 40Hz / Rain) */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
            <button
              onClick={() => handleSoundChange('brown')}
              title="Brown Noise: عزل الأصوات المشتتة"
              className={`px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                ambientType === 'brown'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span className="hidden xl:inline">عزل ذهني</span>
            </button>
            <button
              onClick={() => handleSoundChange('binaural40')}
              title="40Hz Gamma Focus Tone: موجات التركيز الدماغي"
              className={`px-2 py-1 rounded-md transition-all font-medium ${
                ambientType === 'binaural40'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <span className="hidden xl:inline">40Hz</span>
              <span className="xl:hidden">40Hz</span>
            </button>
            {ambientType !== 'off' && (
              <button
                onClick={() => {
                  stopAmbientSound();
                  setAmbientType('off');
                }}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md"
                title="إيقاف الصوت"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dev advice modal button */}
          <button
            onClick={onOpenDevGuide}
            className="flex items-center gap-1.5 text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 font-medium transition-colors"
            title="نصيحة المطور: تحويل هذا التطبيق إلى React Native"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden xl:inline">React Native</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title={darkMode ? 'الوضع الفاتح' : 'الوضع الليلي'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
