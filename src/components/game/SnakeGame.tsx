import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Flame, Volume2, VolumeX, X } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface SnakeGameProps {
  onExitGame: () => void;
  onDopamineEarned?: (amount: number) => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 18;
const INITIAL_SPEED = 130; // ms

export const SnakeGame: React.FC<SnakeGameProps> = ({ onExitGame, onDopamineEarned }) => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 9, y: 9 },
    { x: 9, y: 10 },
    { x: 9, y: 11 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('rakeez_snake_high') || 0);
    } catch {
      return 0;
    }
  });

  const dirRef = useRef<Direction>('UP');
  const gameLoopRef = useRef<any>(null);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const collision = currentSnake.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
      if (!collision) return newFood;
    }
  }, []);

  const changeDirection = (newDir: Direction) => {
    const cur = dirRef.current;
    if (newDir === 'UP' && cur === 'DOWN') return;
    if (newDir === 'DOWN' && cur === 'UP') return;
    if (newDir === 'LEFT' && cur === 'RIGHT') return;
    if (newDir === 'RIGHT' && cur === 'LEFT') return;

    dirRef.current = newDir;
    setDirection(newDir);
    playChime('pop');
  };

  const restartGame = () => {
    const initialSnake: Point[] = [
      { x: 9, y: 9 },
      { x: 9, y: 10 },
      { x: 9, y: 11 },
    ];
    setSnake(initialSnake);
    dirRef.current = 'UP';
    setDirection('UP');
    setFood(generateFood(initialSnake));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    playChime('step');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'w', 'ص'].includes(key)) changeDirection('UP');
      else if (['arrowdown', 's', 'س'].includes(key)) changeDirection('DOWN');
      else if (['arrowleft', 'a', 'ش'].includes(key)) changeDirection('LEFT');
      else if (['arrowright', 'd', 'ي'].includes(key)) changeDirection('RIGHT');
      else if (key === ' ' || key === 'escape') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main game tick
  useEffect(() => {
    if (isGameOver || isPaused) return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const curDir = dirRef.current;

        if (curDir === 'UP') head.y -= 1;
        if (curDir === 'DOWN') head.y += 1;
        if (curDir === 'LEFT') head.x -= 1;
        if (curDir === 'RIGHT') head.x += 1;

        // Wall wrap-around (gentle ADHD-friendly design - no instant punitive death!)
        if (head.x < 0) head.x = GRID_SIZE - 1;
        if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        if (head.y >= GRID_SIZE) head.y = 0;

        // Self collision check
        const selfHit = prevSnake.some((seg) => seg.x === head.x && seg.y === head.y);
        if (selfHit) {
          setIsGameOver(true);
          playChime('pop');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Food eaten check
        if (head.x === food.x && head.y === food.y) {
          playChime('success');
          setScore((s) => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              try {
                localStorage.setItem('rakeez_snake_high', String(nextScore));
              } catch {}
            }
            return nextScore;
          });
          onDopamineEarned?.(15);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, Math.max(INITIAL_SPEED - Math.min(score, 60), 75));

    return () => clearInterval(gameLoopRef.current);
  }, [food, isGameOver, isPaused, score, highScore, generateFood, onDopamineEarned]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[520px] max-w-md mx-auto p-4 bg-stone-950 text-white rounded-3xl border border-emerald-500/30 shadow-2xl relative select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-sm font-extrabold text-emerald-400">ثعبان التركيز النيون</h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-amber-400">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>النقاط: {score}</span>
          </div>
          <div className="flex items-center gap-1 text-stone-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>القياسي: {highScore}</span>
          </div>
          <button
            onClick={onExitGame}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            title="خروج"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Snake Canvas Grid */}
      <div className="relative my-3 p-1.5 bg-stone-900 border border-stone-800 rounded-2xl shadow-inner">
        <div
          className="grid gap-0.5 bg-black rounded-xl p-1"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: '280px',
            height: '280px',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);

            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some((s) => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;

            let cellClass = 'bg-stone-950/40 rounded-xs';
            if (isHead) {
              cellClass = 'bg-emerald-400 shadow-[0_0_8px_#34d399] rounded-sm';
            } else if (isBody) {
              cellClass = 'bg-emerald-600/80 rounded-xs';
            } else if (isFood) {
              cellClass = 'bg-amber-400 shadow-[0_0_10px_#fbbf24] rounded-full animate-pulse';
            }

            return <div key={index} className={`w-full h-full transition-colors ${cellClass}`} />;
          })}
        </div>

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 rounded-2xl space-y-3">
            <h4 className="text-base font-extrabold text-red-400">انتهت الجولة!</h4>
            <p className="text-xs text-stone-300">حققت {score} نقطة دوبامين في هذه الجولة.</p>
            <button
              onClick={restartGame}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>العب ثانيةً</span>
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Touch D-Pad (Strictly LTR calibrated) */}
      <div className="w-full flex flex-col items-center gap-1.5 py-1" dir="ltr">
        <span className="text-[10px] text-stone-500 font-mono">تحكم باللمس أو الأسهم (D-Pad)</span>
        <div className="flex flex-col items-center gap-1">
          <button
            onPointerDown={() => changeDirection('UP')}
            className="w-12 h-10 rounded-xl bg-stone-800 active:bg-emerald-500 active:text-black text-stone-200 flex items-center justify-center shadow-md cursor-pointer"
            title="Up"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onPointerDown={() => changeDirection('LEFT')}
              className="w-12 h-10 rounded-xl bg-stone-800 active:bg-emerald-500 active:text-black text-stone-200 flex items-center justify-center shadow-md cursor-pointer"
              title="Left (يسار)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 text-[10px] text-stone-400 font-bold"
            >
              {isPaused ? '▶' : '⏸'}
            </button>
            <button
              onPointerDown={() => changeDirection('RIGHT')}
              className="w-12 h-10 rounded-xl bg-stone-800 active:bg-emerald-500 active:text-black text-stone-200 flex items-center justify-center shadow-md cursor-pointer"
              title="Right (يمين)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onPointerDown={() => changeDirection('DOWN')}
            className="w-12 h-10 rounded-xl bg-stone-800 active:bg-emerald-500 active:text-black text-stone-200 flex items-center justify-center shadow-md cursor-pointer"
            title="Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
