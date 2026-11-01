import React from 'react';
import { X, Sun, Moon, Monitor, Globe, Clock, Volume2, Code2, Trash2 } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  themeMode: 'light' | 'dark' | 'system';
  onSelectThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  appTheme?: 'amoled' | 'neon' | 'synth' | 'forest' | 'solar' | 'nordic';
  onSelectAppTheme?: (theme: 'amoled' | 'neon' | 'synth' | 'forest' | 'solar' | 'nordic') => void;
  defaultDuration: number;
  onSelectDefaultDuration: (mins: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenDevGuide: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectLang,
  themeMode,
  onSelectThemeMode,
  appTheme = 'amoled',
  onSelectAppTheme,
  defaultDuration,
  onSelectDefaultDuration,
  soundEnabled,
  onToggleSound,
  onOpenDevGuide,
  onClearAllData,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const themesList: Array<{
    id: 'amoled' | 'neon' | 'synth' | 'forest' | 'solar' | 'nordic';
    nameAr: string;
    type: 'dark' | 'light';
    accentColor: string;
    bgColor: string;
  }> = [
    { id: 'amoled', nameAr: 'سواد نقي (AMOLED)', type: 'dark', accentColor: '#ffffff', bgColor: '#000000' },
    { id: 'neon', nameAr: 'نيون سايبر (Cyberpunk)', type: 'dark', accentColor: '#00f5d4', bgColor: '#07080d' },
    { id: 'synth', nameAr: 'سينثويف ليل (Synthwave)', type: 'dark', accentColor: '#f43f5e', bgColor: '#0a0818' },
    { id: 'forest', nameAr: 'غابة الهدوء (Forest)', type: 'dark', accentColor: '#10b981', bgColor: '#05130e' },
    { id: 'solar', nameAr: 'شمس دافئة (Solar Citrus)', type: 'light', accentColor: '#ea580c', bgColor: '#fbf8f3' },
    { id: 'nordic', nameAr: 'جليد ناصع (Nordic Sky)', type: 'light', accentColor: '#0284c7', bgColor: '#f8fafc' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#101010] border border-stone-200 dark:border-[#262626] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#262626] pb-3">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {t.settingsTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ADHD Themes Selection (Dark & Light Lists) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>مظهر وثيمات التطبيق (ADHD Themes)</span>
            </span>
            <span className="text-[11px] text-amber-500 font-mono font-bold uppercase">
              {appTheme}
            </span>
          </div>

          {/* Row 1: Dark Themes (قائمة الثيمات الداكنة) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-400 font-mono block">
              🌙 الثيمات الداكنة (Dark Themes)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {themesList.filter((th) => th.type === 'dark').map((th) => {
                const isSelected = appTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      onSelectAppTheme?.(th.id);
                      onSelectThemeMode('dark');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1.5 transition-all cursor-pointer text-start ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-xs ring-1 ring-amber-500/50 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-[#262626] text-stone-600 dark:text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: th.accentColor }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: th.bgColor }}
                      />
                      {isSelected && (
                        <span className="text-[10px] text-amber-400 font-bold ms-auto">مُفَعّل ✓</span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold leading-tight">{th.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Light Themes (قائمة الثيمات الفاتحة) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-400 font-mono block">
              ☀️ الثيمات الفاتحة (Light Themes)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {themesList.filter((th) => th.type === 'light').map((th) => {
                const isSelected = appTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      onSelectAppTheme?.(th.id);
                      onSelectThemeMode('light');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1.5 transition-all cursor-pointer text-start ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-xs ring-1 ring-amber-500/50 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-[#262626] text-stone-600 dark:text-stone-400 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: th.accentColor }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: th.bgColor }}
                      />
                      {isSelected && (
                        <span className="text-[10px] text-amber-500 font-bold ms-auto">مُفَعّل ✓</span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold leading-tight">{th.nameAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Language Settings (Arabic & English) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-stone-500" />
            <span>{t.settingsLang}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectLang('ar')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                lang === 'ar'
                  ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-[#202020] text-stone-900 dark:text-white'
                  : 'border-stone-200 dark:border-[#262626] text-stone-500 hover:bg-stone-50 dark:hover:bg-[#161616]'
              }`}
            >
              <span>العربية (Arabic)</span>
            </button>
            <button
              onClick={() => onSelectLang('en')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                lang === 'en'
                  ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-[#202020] text-stone-900 dark:text-white'
                  : 'border-stone-200 dark:border-[#262626] text-stone-500 hover:bg-stone-50 dark:hover:bg-[#161616]'
              }`}
            >
              <span>English (LTR)</span>
            </button>
          </div>
        </div>

        {/* Focus Duration Preferences */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-stone-500" />
            <span>{t.settingsFocusDuration}</span>
          </label>
          <div className="grid grid-cols-4 gap-2 text-xs font-mono font-bold">
            {[15, 20, 25, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => onSelectDefaultDuration(mins)}
                className={`py-2 rounded-xl border text-center transition-all ${
                  defaultDuration === mins
                    ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-[#202020] text-stone-900 dark:text-white'
                    : 'border-stone-200 dark:border-[#262626] text-stone-500 hover:bg-stone-50 dark:hover:bg-[#161616]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Audio Feedback Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-[#262626]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-stone-500" />
            <div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{t.settingsSounds}</p>
              <p className="text-[11px] text-stone-400">{t.settingsSoundsEnabled}</p>
            </div>
          </div>
          <button
            onClick={onToggleSound}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              soundEnabled ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                soundEnabled ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* React Native Dev Architecture Guide */}
        <div className="pt-2 border-t border-stone-100 dark:border-[#262626] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenDevGuide();
            }}
            className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Code2 className="w-4 h-4" />
            <span>{t.settingsDevAdvice}</span>
          </button>

          <button
            onClick={onClearAllData}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>إعادة تعيين البيانات</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs"
        >
          {t.settingsClose}
        </button>
      </div>
    </div>
  );
};
