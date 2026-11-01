import React from 'react';
import { Home, Brain, Target, Layers, History, Settings } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface MobileNavProps {
  activeSection: 'home' | 'braindump' | 'focus' | 'tools' | 'history';
  onSelectSection: (section: 'home' | 'braindump' | 'focus' | 'tools' | 'history') => void;
  hasActiveTask: boolean;
  onOpenSettings: () => void;
  lang: Language;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeSection,
  onSelectSection,
  hasActiveTask,
  onOpenSettings,
  lang,
}) => {
  const t = translations[lang];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-black/95 border-t border-stone-200 dark:border-[#262626] backdrop-blur-md px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around h-13">
        <button
          onClick={() => onSelectSection('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
            activeSection === 'home'
              ? 'text-stone-900 dark:text-white'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>{t.navHome}</span>
        </button>

        <button
          onClick={() => onSelectSection('braindump')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
            activeSection === 'braindump'
              ? 'text-stone-900 dark:text-white'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          }`}
        >
          <Brain className="w-4 h-4 mb-0.5" />
          <span>{t.navBrainDump}</span>
        </button>

        <button
          onClick={() => onSelectSection('focus')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors relative ${
            activeSection === 'focus'
              ? 'text-stone-900 dark:text-white'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          }`}
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span>{t.navFocus}</span>
          {hasActiveTask && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1/4" />
          )}
        </button>

        <button
          onClick={() => onSelectSection('tools')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
            activeSection === 'tools'
              ? 'text-stone-900 dark:text-white'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>{t.navTools}</span>
        </button>

        <button
          onClick={() => onSelectSection('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-colors ${
            activeSection === 'history'
              ? 'text-stone-900 dark:text-white'
              : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
          }`}
        >
          <History className="w-4 h-4 mb-0.5" />
          <span>{t.navHistory}</span>
        </button>
      </div>
    </nav>
  );
};
