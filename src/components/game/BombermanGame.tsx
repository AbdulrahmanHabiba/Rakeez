/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bomberman (مفجر القنابل ومشتتات الانتباه) for Rakeez
 * Authentic Bomberman arcade: Grid maze, placing bombs with fuse timer,
 * 4-way cross blast physics, destructible crates, wandering distraction creeps.
 * All controls are strictly LTR calibrated so Left/Right/Up/Down match physical coordinates.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';

interface BombermanGameProps {
  onBack: () => void;
  onReward: (points: number) => void;
}

// 0: empty, 1: indestructible wall, 2: destructible crate, 3: exit door (hidden or revealed)
const GRID_W = 11;
const GRID_H = 9;
const TILE_SIZE = 36;

interface Bomb {
  x: number;
  y: number;
  fuse: number; // frames until explosion
  radius: number;
}

interface Explosion {
  cells: { x: number; y: number }[];
  life: number;
}

interface Enemy {
  x: number;
  y: number;
  dx: number;
  dy: number;
  alive: boolean;
}

export function BombermanGame({ onBack, onReward }: BombermanGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'cleared'>('playing');

  // Audio synthesizer
  const playSound = useCallback((type: 'place' | 'boom' | 'die' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'place') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'boom') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Game internal state
  const gameRef = useRef({
    grid: [] as number[][],
    player: { x: 1, y: 1, px: 1 * TILE_SIZE, py: 1 * TILE_SIZE, speed: 2.5, invulnerable: 120 },
    bombs: [] as Bomb[],
    explosions: [] as Explosion[],
    enemies: [] as Enemy[],
    keys: { up: false, down: false, left: false, right: false },
    door: { x: 9, y: 7 },
  });

  const initGame = useCallback(() => {
    // 0: Floor, 1: Solid Pillar, 2: Destructible Crate
    const grid: number[][] = [];
    for (let y = 0; y < GRID_H; y++) {
      const row: number[] = [];
      for (let x = 0; x < GRID_W; x++) {
        if (x === 0 || x === GRID_W - 1 || y === 0 || y === GRID_H - 1) {
          row.push(1); // Border wall
        } else if (x % 2 === 0 && y % 2 === 0) {
          row.push(1); // Permanent pillar
        } else if ((x <= 2 && y <= 2) || (x === 1 && y === 3) || (x === 3 && y === 1)) {
          row.push(0); // Safe starting area for player
        } else {
          // 65% chance of crate
          row.push(Math.random() < 0.65 ? 2 : 0);
        }
      }
      grid.push(row);
    }

    // Distraction Enemies placed in distant corners
    const enemies: Enemy[] = [
      { x: 9 * TILE_SIZE, y: 1 * TILE_SIZE, dx: -1.0, dy: 0, alive: true },
      { x: 9 * TILE_SIZE, y: 7 * TILE_SIZE, dx: 0, dy: -1.0, alive: true },
      { x: 7 * TILE_SIZE, y: 7 * TILE_SIZE, dx: -1.0, dy: 0, alive: true },
    ];

    gameRef.current = {
      grid,
      player: { x: 1, y: 1, px: 1 * TILE_SIZE, py: 1 * TILE_SIZE, speed: 2.5, invulnerable: 120 },
      bombs: [],
      explosions: [],
      enemies,
      keys: { up: false, down: false, left: false, right: false },
      door: { x: 9, y: 7 },
    };

    setGameState('playing');
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      const k = gameRef.current.keys;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = true;
      if (e.code === 'Space') placeBomb();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = gameRef.current.keys;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const placeBomb = () => {
    const g = gameRef.current;
    if (gameState !== 'playing') return;
    const tileX = Math.round(g.player.px / TILE_SIZE);
    const tileY = Math.round(g.player.py / TILE_SIZE);

    // Can't place if bomb already at this tile or max 2 active bombs
    if (g.bombs.length >= 2) return;
    if (g.bombs.some((b) => b.x === tileX && b.y === tileY)) return;

    g.bombs.push({
      x: tileX,
      y: tileY,
      fuse: 90, // ~1.5s at 60fps
      radius: 2,
    });
    playSound('place');
  };

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const g = gameRef.current;

      if (gameState === 'playing') {
        const { keys, player, grid, bombs, explosions, enemies } = g;

        // Player Movement with smooth axis sliding
        let moveX = 0;
        let moveY = 0;
        if (keys.left) moveX -= player.speed;
        if (keys.right) moveX += player.speed;
        if (keys.up) moveY -= player.speed;
        if (keys.down) moveY += player.speed;

        // Check horizontal collision
        const newPx = player.px + moveX;
        const pBox = 8; // collision padding
        const leftTile = Math.floor((newPx + pBox) / TILE_SIZE);
        const rightTile = Math.floor((newPx + TILE_SIZE - 1 - pBox) / TILE_SIZE);
        const topTile = Math.floor((player.py + pBox) / TILE_SIZE);
        const bottomTile = Math.floor((player.py + TILE_SIZE - 1 - pBox) / TILE_SIZE);

        let canMoveX = true;
        for (let ty = topTile; ty <= bottomTile; ty++) {
          for (let tx = leftTile; tx <= rightTile; tx++) {
            if (grid[ty] && (grid[ty][tx] === 1 || grid[ty][tx] === 2)) {
              canMoveX = false;
            }
          }
        }
        if (canMoveX) player.px = newPx;

        // Check vertical collision
        const newPy = player.py + moveY;
        const curLeftTile = Math.floor((player.px + pBox) / TILE_SIZE);
        const curRightTile = Math.floor((player.px + TILE_SIZE - 1 - pBox) / TILE_SIZE);
        const newTopTile = Math.floor((newPy + pBox) / TILE_SIZE);
        const newBottomTile = Math.floor((newPy + TILE_SIZE - 1 - pBox) / TILE_SIZE);

        let canMoveY = true;
        for (let ty = newTopTile; ty <= newBottomTile; ty++) {
          for (let tx = curLeftTile; tx <= curRightTile; tx++) {
            if (grid[ty] && (grid[ty][tx] === 1 || grid[ty][tx] === 2)) {
              canMoveY = false;
            }
          }
        }
        if (canMoveY) player.py = newPy;

        // Update Bombs
        for (let i = bombs.length - 1; i >= 0; i--) {
          const b = bombs[i];
          b.fuse--;
          if (b.fuse <= 0) {
            // Explode!
            bombs.splice(i, 1);
            playSound('boom');
            const blastCells = [{ x: b.x, y: b.y }];
            const dirs = [
              { dx: 1, dy: 0 },
              { dx: -1, dy: 0 },
              { dx: 0, dy: 1 },
              { dx: 0, dy: -1 },
            ];

            for (const d of dirs) {
              for (let step = 1; step <= b.radius; step++) {
                const cx = b.x + d.dx * step;
                const cy = b.y + d.dy * step;
                if (cx < 0 || cx >= GRID_W || cy < 0 || cy >= GRID_H) break;
                if (grid[cy][cx] === 1) break; // Pillar stops blast

                blastCells.push({ x: cx, y: cy });

                if (grid[cy][cx] === 2) {
                  // Destructible crate destroyed!
                  grid[cy][cx] = 0;
                  setScore((s) => s + 50);
                  break; // Crate absorbs rest of beam
                }
              }
            }

            explosions.push({ cells: blastCells, life: 18 });
          }
        }

        // Update Explosions & Damage
        for (let i = explosions.length - 1; i >= 0; i--) {
          const exp = explosions[i];
          exp.life--;

          // Check if player hit by blast
          const playerTileX = Math.round(player.px / TILE_SIZE);
          const playerTileY = Math.round(player.py / TILE_SIZE);
          for (const cell of exp.cells) {
            if (cell.x === playerTileX && cell.y === playerTileY) {
              playSound('die');
              setGameState('gameover');
              return;
            }
            // Check if enemies hit by blast
            for (const enemy of enemies) {
              if (enemy.alive) {
                const exTile = Math.round(enemy.x / TILE_SIZE);
                const eyTile = Math.round(enemy.y / TILE_SIZE);
                if (cell.x === exTile && cell.y === eyTile) {
                  enemy.alive = false;
                  setScore((s) => s + 150);
                }
              }
            }
          }

          if (exp.life <= 0) explosions.splice(i, 1);
        }

        // Update Enemies
        for (const e of enemies) {
          if (!e.alive) continue;
          e.x += e.dx;
          e.y += e.dy;

          const eTileX = Math.floor((e.x + 4) / TILE_SIZE);
          const eTileY = Math.floor((e.y + 4) / TILE_SIZE);

          // Bounce if hits wall or crate
          if (
            grid[eTileY] &&
            (grid[eTileY][eTileX] === 1 || grid[eTileY][eTileX] === 2)
          ) {
            e.dx = -e.dx;
            e.dy = -e.dy;
            if (Math.random() < 0.5) {
              const temp = e.dx;
              e.dx = e.dy;
              e.dy = temp;
            }
          }

          // Check collision with player
          const dist = Math.hypot(e.x - player.px, e.y - player.py);
          if (dist < TILE_SIZE * 0.7 && player.invulnerable <= 0) {
            playSound('die');
            setGameState('gameover');
            return;
          }
        }

        if (player.invulnerable > 0) player.invulnerable--;

        // Win Condition: All enemies destroyed or reached exit door
        const allEnemiesDefeated = enemies.length > 0 && enemies.every((e) => !e.alive);
        if (allEnemiesDefeated) {
          playSound('win');
          onReward(250);
          setGameState('cleared');
          return;
        }
      }

      // --- RENDERING ---
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cw, ch);

      // 1. Grid
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const type = g.grid[y][x];
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;

          if (type === 1) {
            // Indestructible pillar
            ctx.fillStyle = '#334155';
            ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
          } else if (type === 2) {
            // Destructible Crate (Wood/Neon Box)
            ctx.fillStyle = '#b45309';
            ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            // Cross straps
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE - 4);
            ctx.moveTo(px + TILE_SIZE - 4, py + 4);
            ctx.lineTo(px + 4, py + TILE_SIZE - 4);
            ctx.stroke();
          } else {
            // Floor tile
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          }
        }
      }

      // 2. Bombs
      for (const b of g.bombs) {
        const bx = b.x * TILE_SIZE + TILE_SIZE / 2;
        const by = b.y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(b.fuse * 0.3) * 3;

        // Bomb body
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(bx, by, 12 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fuse spark
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(bx - 2, by - 16, 4, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bx, by - 17, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Explosions
      for (const exp of g.explosions) {
        const alpha = exp.life / 18;
        ctx.fillStyle = `rgba(249, 115, 22, ${alpha * 0.8})`;
        for (const c of exp.cells) {
          const ex = c.x * TILE_SIZE;
          const ey = c.y * TILE_SIZE;
          ctx.fillRect(ex + 2, ey + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Core flame
          ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
          ctx.fillRect(ex + 8, ey + 8, TILE_SIZE - 16, TILE_SIZE - 16);
          ctx.fillStyle = `rgba(249, 115, 22, ${alpha * 0.8})`;
        }
      }

      // 4. Enemies (Distraction Monsters)
      for (const e of g.enemies) {
        if (!e.alive) continue;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(e.x + TILE_SIZE / 2, e.y + TILE_SIZE / 2, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bug Antennae
        ctx.strokeStyle = '#e9d5ff';
        ctx.beginPath();
        ctx.moveTo(e.x + 12, e.y + 10);
        ctx.lineTo(e.x + 6, e.y + 4);
        ctx.moveTo(e.x + 24, e.y + 10);
        ctx.lineTo(e.x + 30, e.y + 4);
        ctx.stroke();

        // Evil Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(e.x + 11, e.y + 14, 4, 4);
        ctx.fillRect(e.x + 21, e.y + 14, 4, 4);
      }

      // 5. Bomber Player
      const { px, py } = g.player;
      // Head
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2 - 3, 10, 0, Math.PI * 2);
      ctx.fill();
      // Visor
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px + TILE_SIZE / 2 - 6, py + TILE_SIZE / 2 - 5, 12, 5);
      // Body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + TILE_SIZE / 2 - 7, py + TILE_SIZE / 2 + 5, 14, 10);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, playSound, onReward]);

  return (
    <div className="flex flex-col items-center justify-center p-3 w-full max-w-xl mx-auto select-none" dir="ltr">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-amber-500 font-bold text-sm tracking-wider">
            💣 BOMBERMAN (نسف المشتتات)
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <div className="flex items-center gap-1 text-emerald-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score}</span>
          </div>
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-1 rounded text-neutral-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-[#0f172a] rounded-2xl overflow-hidden border-2 border-neutral-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={GRID_W * TILE_SIZE}
          height={GRID_H * TILE_SIZE}
          className="block"
        />

        {gameState === 'cleared' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white z-20">
            <Sparkles className="w-14 h-14 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-2xl font-black text-amber-400 mb-1">🔥 كفو! فجرت كل المشتتات!</h2>
            <p className="text-sm text-neutral-300 mb-4">
              نظفت عقلك ومسحت كل الأفكار الطفيلية! حصلت على +250 نقطة تركيز.
            </p>
            <button
              onClick={initGame}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              العب جولة جديدة
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white z-20">
            <h2 className="text-2xl font-black text-red-500 mb-1">💥 لمستك مشتتة أو طالك الانفجار!</h2>
            <p className="text-sm text-neutral-300 mb-4">
              تراجع خطوتين دائمًا بعد وضع القنبلة!
            </p>
            <button
              onClick={initGame}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>

      {/* D-Pad & Bomb Button (Strictly LTR calibrated) */}
      <div className="w-full flex items-center justify-between mt-4 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-2xl" dir="ltr">
        {/* D-PAD Cross */}
        <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys.up = true; }}
            onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys.up = false; }}
            onMouseDown={() => { gameRef.current.keys.up = true; }}
            onMouseUp={() => { gameRef.current.keys.up = false; }}
            onMouseLeave={() => { gameRef.current.keys.up = false; }}
            className="rounded-xl bg-neutral-800 active:bg-amber-500 text-white font-black text-xl flex items-center justify-center border border-neutral-700 shadow touch-none select-none"
            title="فوق (Up)"
          >
            ▲
          </button>
          <div />

          <button
            onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys.left = true; }}
            onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys.left = false; }}
            onMouseDown={() => { gameRef.current.keys.left = true; }}
            onMouseUp={() => { gameRef.current.keys.left = false; }}
            onMouseLeave={() => { gameRef.current.keys.left = false; }}
            className="rounded-xl bg-neutral-800 active:bg-amber-500 text-white font-black text-xl flex items-center justify-center border border-neutral-700 shadow touch-none select-none"
            title="يسار (Left)"
          >
            ◀
          </button>
          <div className="bg-neutral-950/60 rounded-lg flex items-center justify-center text-neutral-600 text-[10px]">
            🎮
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys.right = true; }}
            onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys.right = false; }}
            onMouseDown={() => { gameRef.current.keys.right = true; }}
            onMouseUp={() => { gameRef.current.keys.right = false; }}
            onMouseLeave={() => { gameRef.current.keys.right = false; }}
            className="rounded-xl bg-neutral-800 active:bg-amber-500 text-white font-black text-xl flex items-center justify-center border border-neutral-700 shadow touch-none select-none"
            title="يمين (Right)"
          >
            ▶
          </button>

          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys.down = true; }}
            onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys.down = false; }}
            onMouseDown={() => { gameRef.current.keys.down = true; }}
            onMouseUp={() => { gameRef.current.keys.down = false; }}
            onMouseLeave={() => { gameRef.current.keys.down = false; }}
            className="rounded-xl bg-neutral-800 active:bg-amber-500 text-white font-black text-xl flex items-center justify-center border border-neutral-700 shadow touch-none select-none"
            title="تحت (Down)"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Place Bomb Button */}
        <button
          onClick={placeBomb}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 active:scale-95 text-white font-black flex flex-col items-center justify-center shadow-lg border-2 border-amber-400 select-none touch-none"
          title="ضع قنبلة"
        >
          <span className="text-3xl">💣</span>
          <span className="text-xs font-bold mt-1">نسف</span>
        </button>
      </div>

      <p className="text-[11px] text-neutral-400 mt-2 font-sans text-center">
        💡 دمر الصناديق لتفتح ممرات واقضِ على الكائنات الطفيلية، وانتبه لا يقف في وجهك انفجار قنبلتك!
      </p>
    </div>
  );
}
