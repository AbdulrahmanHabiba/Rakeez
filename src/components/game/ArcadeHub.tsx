import React, { useState } from 'react';
import { Gamepad2, Play, Sparkles, X, ChevronRight, Zap } from 'lucide-react';
import { TabBuster3DGame } from './TabBuster3DGame';
import { SnakeGame } from './SnakeGame';
import { MarioGame } from './MarioGame';
import { BombermanGame } from './BombermanGame';
import { XOGame } from './XOGame';
import { playChime } from '../../utils/sound';

interface ArcadeHubProps {
  onExitHub: () => void;
  onDopamineEarned?: (amount: number) => void;
}

type SelectedGame = 'menu' | 'tabbuster' | 'snake' | 'mario' | 'bomberman' | 'xo';

export const ArcadeHub: React.FC<ArcadeHubProps> = ({ onExitHub, onDopamineEarned }) => {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>('menu');

  const games = [
    {
      id: 'mario' as const,
      title: 'سوبر ماريو الأصلي (Super Mario Canvas)',
      desc: 'اقفز واجمع العملات من صناديق [?]، ادهس الغومبا، واركب الأنابيب لتصل لسارية النهاية! تحكم LTR دقيق.',
      badge: 'Classic Mario',
      icon: '🍄',
      tagColor: 'from-red-500/20 to-rose-500/20 border-red-500/40 text-red-400',
    },
    {
      id: 'bomberman' as const,
      title: 'بومبرمان مفجر المشتتات (Bomberman 4-Way)',
      desc: 'ضع قنابل بمؤقت تفجير صليبي، دمّر الصناديق واقضِ على كائنات التشتت الطفيلية!',
      badge: 'Bomberman Maze',
      icon: '💣',
      tagColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
    },
    {
      id: 'snake' as const,
      title: 'ثعبان التركيز النيون (Neon Snake)',
      desc: 'لعبة الثعبان الكلاسيكية مع أزرار تحكم D-Pad دقيقة ومعايرة اتجاهات LTR تضمن دقة اليمين واليسار!',
      badge: 'Touch D-Pad',
      icon: '🐍',
      tagColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
    },
    {
      id: 'tabbuster' as const,
      title: 'فضائي التشتت 3D (Tab Buster)',
      desc: 'قُد مركبتك ثلاثية الأبعاد بلمس الشاشة أو الأسهم ودمر تابات المتصفح المتراكمة!',
      badge: 'Three.js 3D',
      icon: '🚀',
      tagColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
    },
    {
      id: 'xo' as const,
      title: 'نيون XO الذكي (Cyber Tic-Tac-Toe)',
      desc: 'تحدَّ الذكاء الاصطناعي أو نافس صديقك على شبكة نيون مشعة لتنشيط العقل سريعاً!',
      badge: 'AI Smart',
      icon: '⚡',
      tagColor: 'from-violet-500/20 to-purple-500/20 border-violet-500/40 text-violet-400',
    },
  ];

  if (selectedGame === 'mario') {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 overflow-y-auto">
        <MarioGame
          onBack={() => setSelectedGame('menu')}
          onReward={(pts) => onDopamineEarned?.(pts)}
        />
      </div>
    );
  }

  if (selectedGame === 'bomberman') {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 overflow-y-auto">
        <BombermanGame
          onBack={() => setSelectedGame('menu')}
          onReward={(pts) => onDopamineEarned?.(pts)}
        />
      </div>
    );
  }

  if (selectedGame === 'tabbuster') {
    return (
      <TabBuster3DGame
        onExitGame={() => setSelectedGame('menu')}
        onDopamineEarned={onDopamineEarned}
      />
    );
  }

  if (selectedGame === 'snake') {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3">
        <SnakeGame
          onExitGame={() => setSelectedGame('menu')}
          onDopamineEarned={onDopamineEarned}
        />
      </div>
    );
  }

  if (selectedGame === 'xo') {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3">
        <XOGame
          onExitGame={() => setSelectedGame('menu')}
          onDopamineEarned={onDopamineEarned}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-stone-100 flex items-center gap-2">
                <span>صالة ألعاب الدوبامين للـ ADHD</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold">
                  5 ألعاب معتمدة
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                ألعاب سريعة مصممة لتحفيز التركيز، تفريغ الشحنات العصبية، وتحفيز الدوبامين السليم!
              </p>
            </div>
          </div>
          <button
            onClick={onExitHub}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="إغلاق صالة الألعاب"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game List */}
        <div className="grid grid-cols-1 gap-3">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => {
                playChime('step');
                setSelectedGame(game.id);
              }}
              className="group p-4 rounded-2xl bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800/80 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="text-2xl p-2.5 rounded-xl bg-stone-950 border border-stone-800 group-hover:scale-110 transition-transform flex-shrink-0">
                  {game.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-bold text-sm text-stone-100 group-hover:text-amber-400 transition-colors">
                      {game.title}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border bg-gradient-to-r font-mono ${game.tagColor}`}
                    >
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed truncate sm:whitespace-normal">
                    {game.desc}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-stone-800 group-hover:bg-amber-500 group-hover:text-black text-stone-400 flex items-center justify-center transition-all flex-shrink-0">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Footer */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300/90">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>اللعب لمدة دقيقتين يعيد ضبط الناقلات العصبية ويمنحك دفعة للعودة لمهمتك!</span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-md font-bold">
            +50XP
          </span>
        </div>
      </div>
    </div>
  );
};
