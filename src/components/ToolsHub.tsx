import React from 'react';
import {
  Clock,
  FileImage,
  MessageSquare,
  Radio,
  Gamepad2,
  Lightbulb,
  ArrowRight,
  Compass,
  Timer,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';

export type ToolId = 'time' | 'declutter' | 'chat' | 'live' | 'game' | 'ideas' | 'extensions';

interface ToolsHubProps {
  onSelectTool: (id: ToolId) => void;
  parkedIdeasCount: number;
  timePlansCount: number;
  declutterItemsCount: number;
  lang: Language;
}

export const ToolsHub: React.FC<ToolsHubProps> = ({
  onSelectTool,
  parkedIdeasCount,
  timePlansCount,
  declutterItemsCount,
  lang,
}) => {
  const t = translations[lang];

  const tools = [
    {
      id: 'extensions' as ToolId,
      title: 'ملحقات وإكستنشنز الوقت (Extensions)',
      desc: 'ساعة التركيز العملاقة، عداد الثواني الدقيق (1, 2, 3...)، وقرص الوقت البصري المنكمش.',
      icon: Compass,
      badge: 'Zen & Timers',
    },
    {
      id: 'game' as ToolId,
      title: 'صالة ألعاب الدوبامين (Dopamine Arcade)',
      desc: '5 ألعاب ممتعة (فضائي التشتت 3D، الثعبان باللمس، ركض ماريو، نيون XO، كاسف القنابل).',
      icon: Gamepad2,
      badge: '5 Mini Games',
    },
    {
      id: 'time' as ToolId,
      title: t.toolTimeTitle,
      desc: t.toolTimeDesc,
      icon: Clock,
      count: timePlansCount,
      badge: 'Anti-Lateness',
    },
    {
      id: 'declutter' as ToolId,
      title: t.toolDeclutterTitle,
      desc: t.toolDeclutterDesc,
      icon: FileImage,
      count: declutterItemsCount,
      badge: 'gemini-4-argon',
    },
    {
      id: 'chat' as ToolId,
      title: t.toolCoachTitle,
      desc: t.toolCoachDesc,
      icon: MessageSquare,
      badge: 'Coach & Body Double',
    },
    {
      id: 'live' as ToolId,
      title: t.toolLiveTitle,
      desc: t.toolLiveDesc,
      icon: Radio,
      badge: 'gemini-3.8-live',
    },
    {
      id: 'ideas' as ToolId,
      title: t.toolIdeasTitle,
      desc: t.toolIdeasDesc,
      icon: Lightbulb,
      count: parkedIdeasCount,
      badge: 'Vault',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t.toolsTitle}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          {t.toolsSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group bg-white dark:bg-[#121212] border border-stone-200 dark:border-[#262626] rounded-2xl p-5 hover:border-stone-400 dark:hover:border-stone-600 transition-all cursor-pointer shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-[#202020] text-stone-800 dark:text-stone-200 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tool.count !== undefined && tool.count > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-stone-100 dark:bg-[#202020] px-2 py-0.5 rounded-full text-stone-600 dark:text-stone-400">
                        {tool.count}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-stone-400 border border-stone-200 dark:border-[#2a2a2a] px-2 py-0.5 rounded-full">
                      {tool.badge}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="flex items-center justify-end text-xs font-bold text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                <span>فتح الأداة</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 ml-1 rtl:mr-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
