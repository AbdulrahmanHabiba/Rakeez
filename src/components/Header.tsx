import React, { useState } from 'react';
import {
  Brain,
  Volume2,
  VolumeX,
  Settings,
  Flame,
  Home,
  Target,
  Sparkles,
  Palette,
} from 'lucide-react';
import { playAmbientSound, stopAmbientSound, playChime } from '../utils/sound';
import { Language, translations } from '../utils/i18n';
import { AppTheme } from '../types';

interface HeaderProps {
  activeSection: 'home' | 'braindump' | 'focus' | 'tools' | 'history';
  onSelectSection: (section: 'home' | 'braindump' | 'focus' | 'tools' | 'history') => void;
  onOpenSettings: () => void;
  completedStepsCount: number;
  hasActiveTask: boolean;
  lang: Language;
  appTheme?: AppTheme;
  onCycleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onOpenSettings,
  completedStepsCount,
  hasActiveTask,
  lang,
  appTheme,
  onCycleTheme,
}) => {
  const t = translations[lang];
  const [ambientActive, setAmbientActive] = useState(false);

  const toggleAmbientSound = () => {
    if (ambientActive) {
      stopAmbientSound();
      setAmbientActive(false);
    } else {
      playAmbientSound('brown');
      setAmbientActive(true);
    }
  };

  return (
    <header className="border-b border-stone-200 dark:border-[#262626] bg-white/90 dark:bg-black/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectSection('home')}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-black flex items-center justify-center font-bold">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight">
              {t.appName}
            </span>
          </div>
        </div>

        {/* Primary Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectSection('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'home'
                ? 'bg-stone-100 dark:bg-[#1c1c1c] text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {t.navHome}
          </button>
          <button
            onClick={() => onSelectSection('braindump')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'braindump'
                ? 'bg-stone-100 dark:bg-[#1c1c1c] text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {t.navBrainDump}
          </button>
          <button
            onClick={() => onSelectSection('focus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'focus'
                ? 'bg-stone-100 dark:bg-[#1c1c1c] text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span>{t.navFocus}</span>
            {hasActiveTask && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => onSelectSection('tools')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'tools'
                ? 'bg-stone-100 dark:bg-[#1c1c1c] text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {t.navTools}
          </button>
          <button
            onClick={() => onSelectSection('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeSection === 'history'
                ? 'bg-stone-100 dark:bg-[#1c1c1c] text-stone-900 dark:text-white'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            {t.navHistory}
          </button>
        </nav>

        {/* Right Action Cluster (Zero clipping, compact) */}
        <div className="flex items-center gap-2">
          {/* Ambient Brown Noise Toggle (Focus sound) */}
          <button
            onClick={toggleAmbientSound}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              ambientActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                : 'border-stone-200 dark:border-[#262626] text-stone-500 hover:bg-stone-100 dark:hover:bg-[#1c1c1c]'
            }`}
            title="عزل الضوضاء الذهني (Brown Noise)"
          >
            {ambientActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">عزل ذهني</span>
          </button>

          {/* Quick Theme Switcher */}
          {onCycleTheme && (
            <button
              onClick={() => {
                onCycleTheme();
                playChime('pop');
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-[#262626] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1c1c1c] transition-colors cursor-pointer text-xs font-mono"
              title={`الثيم الحالي: ${appTheme || 'amoled'} (اضغط للتبديل السريع)`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] hidden md:inline font-bold uppercase">{appTheme || 'AMOLED'}</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg border border-stone-200 dark:border-[#262626] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1c1c1c] transition-colors cursor-pointer"
            title={t.navSettings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
