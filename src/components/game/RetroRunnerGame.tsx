import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Zap, X, ArrowUp, Sparkles } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface RetroRunnerGameProps {
  onExitGame: () => void;
  onDopamineEarned?: (amount: number) => void;
}

interface Obstacle {
  id: number;
  x: number;
  type: 'tab' | 'bug' | 'phone';
}

interface Star {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export const RetroRunnerGame: React.FC<RetroRunnerGameProps> = ({ onExitGame, onDopamineEarned }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [starsCount, setStarsCount] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('rakeez_runner_high') || 0);
    } catch {
      return 0;
    }
  });

  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // References for pure 60fps loop
  const yRef = useRef(0);
  const vYRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);
  const scoreRef = useRef(0);

  const jump = () => {
    if (yRef.current <= 5) {
      vYRef.current = 13; // initial jump impulse
      setIsJumping(true);
      playChime('pop');
    }
  };

  const startGame = () => {
    yRef.current = 0;
    vYRef.current = 0;
    obstaclesRef.current = [];
    starsRef.current = [];
    scoreRef.current = 0;
    lastSpawnRef.current = Date.now();
    setScore(0);
    setStarsCount(0);
    setPlayerY(0);
    setIsGameOver(false);
    setIsPlaying(true);
    playChime('step');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'arrowup', 'w', 'ص', 'enter'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (!isPlaying || isGameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Jump gravity physics
      if (yRef.current > 0 || vYRef.current > 0) {
        yRef.current += vYRef.current;
        vYRef.current -= 0.65; // gravity
        if (yRef.current <= 0) {
          yRef.current = 0;
          vYRef.current = 0;
          setIsJumping(false);
        }
        setPlayerY(Math.round(yRef.current));
      }

      // Move obstacles and stars leftwards
      const speed = 240 + Math.min(scoreRef.current * 2, 160); // pixels per sec
      const moveDistance = speed * dt;

      // Update obstacles
      const nextObstacles: Obstacle[] = [];
      for (const obs of obstaclesRef.current) {
        const nextX = obs.x - moveDistance;
        // Collision check: player box around x: 40-70, y: 0-40
        if (nextX > 25 && nextX < 65 && yRef.current < 28) {
          // Collision with distraction!
          setIsGameOver(true);
          playChime('pop');
          return;
        }
        if (nextX > -50) {
          nextObstacles.push({ ...obs, x: nextX });
        }
      }
      obstaclesRef.current = nextObstacles;

      // Update stars
      const nextStars: Star[] = [];
      for (const star of starsRef.current) {
        const nextX = star.x - moveDistance;
        // Star collection check
        if (!star.collected && nextX > 25 && nextX < 65 && Math.abs(yRef.current - star.y) < 30) {
          star.collected = true;
          setStarsCount((sc) => sc + 1);
          scoreRef.current += 30;
          onDopamineEarned?.(10);
          playChime('success');
        }
        if (nextX > -50 && !star.collected) {
          nextStars.push({ ...star, x: nextX });
        }
      }
      starsRef.current = nextStars;

      // Spawning new obstacles & stars
      const now = Date.now();
      if (now - lastSpawnRef.current > 1400) {
        lastSpawnRef.current = now;
        const types: Array<'tab' | 'bug' | 'phone'> = ['tab', 'bug', 'phone'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        obstaclesRef.current.push({
          id: Math.random(),
          x: 480,
          type: chosen,
        });

        // Chance to spawn star
        if (Math.random() > 0.4) {
          starsRef.current.push({
            id: Math.random(),
            x: 520,
            y: 40 + Math.floor(Math.random() * 40),
            collected: false,
          });
        }
      }

      // Increment score
      scoreRef.current += 1;
      setScore(Math.floor(scoreRef.current));
      if (scoreRef.current > highScore) {
        setHighScore(Math.floor(scoreRef.current));
        try {
          localStorage.setItem('rakeez_runner_high', String(Math.floor(scoreRef.current)));
        } catch {}
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isGameOver, highScore, onDopamineEarned]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[480px] max-w-lg mx-auto p-4 bg-stone-950 text-white rounded-3xl border border-cyan-500/30 shadow-2xl relative select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-extrabold text-cyan-400">مغامر التركيز (Mario Runner)</h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>النجوم: {starsCount}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>النقاط: {score}</span>
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

      {/* Runner Stage Arena */}
      <div
        onClick={isPlaying && !isGameOver ? jump : startGame}
        className="w-full h-56 bg-gradient-to-b from-[#060814] to-[#0d1326] border border-cyan-900/60 rounded-2xl relative overflow-hidden my-3 cursor-pointer shadow-inner"
      >
        {/* Sky Stars background */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-4 left-10 w-1 h-1 bg-white rounded-full animate-ping" />
          <div className="absolute top-12 left-48 w-1 h-1 bg-cyan-300 rounded-full" />
          <div className="absolute top-8 right-24 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" />
        </div>

        {/* Runner Character (Pixel-style Hero) */}
        <div
          className="absolute left-10 transition-transform duration-75 flex flex-col items-center"
          style={{
            bottom: `${playerY + 24}px`,
            transform: isJumping ? 'rotate(-10deg)' : 'none',
          }}
        >
          <div className="text-2xl filter drop-shadow-[0_0_8px_#38bdf8]">
            {isJumping ? '🚀' : '🏃‍♂️'}
          </div>
        </div>

        {/* Obstacles (Distractions) */}
        {obstaclesRef.current.map((obs) => (
          <div
            key={obs.id}
            className="absolute bottom-6 flex flex-col items-center"
            style={{ left: `${obs.x}px` }}
          >
            <span className="text-2xl filter drop-shadow-[0_0_6px_#f43f5e]">
              {obs.type === 'tab' ? '📑' : obs.type === 'bug' ? '👾' : '📱'}
            </span>
            <span className="text-[9px] font-mono text-red-400 font-bold bg-black/60 px-1 rounded">
              {obs.type === 'tab' ? 'تاب زائد' : obs.type === 'bug' ? 'مشتت' : 'إشعار'}
            </span>
          </div>
        ))}

        {/* Floating Dopamine Stars */}
        {starsRef.current.map((star) => (
          <div
            key={star.id}
            className="absolute text-xl filter drop-shadow-[0_0_8px_#fbbf24] animate-spin"
            style={{
              left: `${star.x}px`,
              bottom: `${star.y + 24}px`,
              animationDuration: '3s',
            }}
          >
            ⭐
          </div>
        ))}

        {/* Ground Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-r from-cyan-950 via-cyan-800 to-cyan-950 border-t-2 border-cyan-400 flex items-center justify-around">
          <div className="w-full h-1 bg-cyan-400/40" />
        </div>

        {/* Title Screen Overlay */}
        {!isPlaying && !isGameOver && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-3">
            <h4 className="text-lg font-black text-cyan-400 tracking-wide">القفز فوق مشتتات الـ ADHD</h4>
            <p className="text-xs text-stone-300 max-w-xs text-center">
              اضغط المسطرة (Space) أو المس الشاشة للقفز فوق التابات المتراكمة والإشعارات، واجمع نجوم الدوبامين!
            </p>
            <button
              onClick={startGame}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ابدأ الركض الآن</span>
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-3">
            <h4 className="text-lg font-black text-rose-400">اصطدمت بمشتت!</h4>
            <p className="text-xs text-stone-300">
              صمدت وجمعت {starsCount} نجمة وحققت {score} نقطة!
            </p>
            <button
              onClick={startGame}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المحاولة فوراً</span>
            </button>
          </div>
        )}
      </div>

      {/* Large Touch Tap-To-Jump Trigger Button */}
      <div className="w-full">
        <button
          onClick={isPlaying && !isGameOver ? jump : startGame}
          className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-98 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform"
        >
          <ArrowUp className="w-5 h-5" />
          <span>المس هنا للقفز (TAP TO JUMP) 🚀</span>
        </button>
      </div>
    </div>
  );
};
