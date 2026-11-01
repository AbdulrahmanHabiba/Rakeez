/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Super Mario 2D Canvas Platformer for Rakeez
 * Authentic platformer: Mario movement, jumping, stomping Goombas,
 * hitting [?] blocks for coins, green pipes, flagpole level finish.
 * All controls are strictly LTR calibrated so Left is physical West and Right is physical East.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Sparkles, Heart } from 'lucide-react';

interface MarioGameProps {
  onBack: () => void;
  onReward: (points: number) => void;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'brick' | 'question' | 'empty' | 'pipe' | 'ground' | 'flagpole';
  hasCoin?: boolean;
  bouncing?: number;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  alive: boolean;
  squished?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text?: string;
  color: string;
  life: number;
  maxLife: number;
}

export function MarioGame({ onBack, onReward }: MarioGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'cleared'>('playing');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio synthesizers for authentic 8-bit sound
  const playSound = useCallback((type: 'jump' | 'coin' | 'stomp' | 'bump' | 'win' | 'die') => {
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
      if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'stomp') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'bump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {
      // Audio not permitted or supported
    }
  }, [soundEnabled]);

  // Keys active state
  const keysRef = useRef({
    left: false,
    right: false,
    jump: false,
  });

  // Game internal state
  const gameRef = useRef({
    mario: {
      x: 60,
      y: 200,
      w: 22,
      h: 30,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right' as 'left' | 'right',
      invulnerable: 0,
    },
    cameraX: 0,
    levelLength: 2600,
    blocks: [] as Block[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    flagpoleX: 2400,
  });

  // Level Generator
  const initLevel = useCallback(() => {
    const blocks: Block[] = [];
    const enemies: Enemy[] = [];

    // Continuous Ground with small pits
    const groundY = 280;
    const groundSegments = [
      { start: 0, end: 700 },
      { start: 780, end: 1400 },
      { start: 1470, end: 2600 },
    ];
    for (const seg of groundSegments) {
      blocks.push({
        x: seg.start,
        y: groundY,
        w: seg.end - seg.start,
        h: 40,
        type: 'ground',
      });
    }

    // Pipes (Green classic)
    const pipeLocations = [
      { x: 300, h: 48 },
      { x: 550, h: 64 },
      { x: 1050, h: 80 },
      { x: 1300, h: 48 },
      { x: 1800, h: 64 },
    ];
    for (const p of pipeLocations) {
      blocks.push({
        x: p.x,
        y: groundY - p.h,
        w: 42,
        h: p.h,
        type: 'pipe',
      });
    }

    // Platforms with [?] and Bricks
    const platforms = [
      // Section 1
      { x: 180, y: 190, type: 'question', hasCoin: true },
      { x: 210, y: 190, type: 'brick' },
      { x: 240, y: 190, type: 'question', hasCoin: true },
      { x: 270, y: 190, type: 'brick' },
      // Elevated high block
      { x: 240, y: 120, type: 'question', hasCoin: true },

      // Section 2
      { x: 620, y: 180, type: 'brick' },
      { x: 650, y: 180, type: 'question', hasCoin: true },
      { x: 680, y: 180, type: 'brick' },
      { x: 710, y: 180, type: 'question', hasCoin: true },
      { x: 740, y: 180, type: 'brick' },

      // Mid Section Steps
      { x: 880, y: 220, type: 'brick' },
      { x: 910, y: 190, type: 'brick' },
      { x: 940, y: 160, type: 'brick' },
      { x: 970, y: 160, type: 'question', hasCoin: true },

      // End Section Stairs & Castle approach
      { x: 1550, y: 190, type: 'brick' },
      { x: 1580, y: 190, type: 'question', hasCoin: true },
      { x: 1610, y: 190, type: 'brick' },
      { x: 1950, y: 220, type: 'brick' },
      { x: 1980, y: 190, type: 'brick' },
      { x: 2010, y: 160, type: 'brick' },
      { x: 2040, y: 130, type: 'brick' },
      { x: 2070, y: 100, type: 'brick' },
    ];

    for (const pf of platforms) {
      blocks.push({
        x: pf.x,
        y: pf.y,
        w: 28,
        h: 28,
        type: pf.type as Block['type'],
        hasCoin: pf.hasCoin,
      });
    }

    // Flagpole at the end
    const flagpoleX = 2400;
    blocks.push({
      x: flagpoleX,
      y: groundY - 180,
      w: 12,
      h: 180,
      type: 'flagpole',
    });

    // Goomba Enemies
    const enemySpawns = [420, 700, 1150, 1220, 1650, 1720, 2150];
    for (const ex of enemySpawns) {
      enemies.push({
        x: ex,
        y: groundY - 24,
        w: 24,
        h: 24,
        vx: -1.2,
        alive: true,
      });
    }

    gameRef.current = {
      mario: {
        x: 60,
        y: 200,
        w: 22,
        h: 30,
        vx: 0,
        vy: 0,
        isGrounded: false,
        facing: 'right',
        invulnerable: 0,
      },
      cameraX: 0,
      levelLength: 2600,
      blocks,
      enemies,
      particles: [],
      flagpoleX,
    };

    setGameState('playing');
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keysRef.current.jump = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keysRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start game
  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      const g = gameRef.current;
      const m = g.mario;

      if (gameState === 'playing') {
        // --- 1. Movement & Physics ---
        const ACCEL = 0.55;
        const FRICTION = 0.82;
        const MAX_SPEED = 4.2;
        const GRAVITY = 0.65;
        const JUMP_FORCE = -11.5;

        if (keysRef.current.left) {
          m.vx -= ACCEL;
          m.facing = 'left';
        } else if (keysRef.current.right) {
          m.vx += ACCEL;
          m.facing = 'right';
        } else {
          m.vx *= FRICTION;
        }

        m.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, m.vx));
        m.vy += GRAVITY;

        // Jump
        if (keysRef.current.jump && m.isGrounded) {
          m.vy = JUMP_FORCE;
          m.isGrounded = false;
          playSound('jump');
        }

        // Apply Horizontal Motion & Wall Collisions
        m.x += m.vx;
        if (m.x < 10) {
          m.x = 10;
          m.vx = 0;
        }

        for (const b of g.blocks) {
          if (b.type === 'flagpole') continue;
          if (
            m.x < b.x + b.w &&
            m.x + m.w > b.x &&
            m.y < b.y + b.h &&
            m.y + m.h > b.y
          ) {
            if (m.vx > 0) {
              m.x = b.x - m.w;
              m.vx = 0;
            } else if (m.vx < 0) {
              m.x = b.x + b.w;
              m.vx = 0;
            }
          }
        }

        // Apply Vertical Motion & Floor/Ceiling Collisions
        m.y += m.vy;
        m.isGrounded = false;

        for (const b of g.blocks) {
          if (b.type === 'flagpole') {
            // Check flagpole touch
            if (m.x + m.w >= b.x && m.x <= b.x + b.w && m.y + m.h >= b.y) {
              setGameState('cleared');
              playSound('win');
              onReward(250);
              return;
            }
            continue;
          }

          if (
            m.x < b.x + b.w &&
            m.x + m.w > b.x &&
            m.y < b.y + b.h &&
            m.y + m.h > b.y
          ) {
            // Falling down onto top of block
            if (m.vy > 0 && m.y + m.h - m.vy <= b.y + 6) {
              m.y = b.y - m.h;
              m.vy = 0;
              m.isGrounded = true;
            }
            // Hitting block from underneath
            else if (m.vy < 0 && m.y - m.vy >= b.y + b.h - 6) {
              m.y = b.y + b.h;
              m.vy = 1;
              b.bouncing = 6;

              if (b.type === 'question' && b.hasCoin) {
                b.hasCoin = false;
                b.type = 'empty';
                setCoins((c) => c + 1);
                setScore((s) => s + 200);
                playSound('coin');
                g.particles.push({
                  x: b.x + b.w / 2,
                  y: b.y - 10,
                  vx: 0,
                  vy: -4,
                  text: '🪙 +200',
                  color: '#fbbf24',
                  life: 30,
                  maxLife: 30,
                });
              } else if (b.type === 'brick') {
                playSound('bump');
                setScore((s) => s + 50);
              }
            }
          }
        }

        // Pit death
        if (m.y > 360) {
          playSound('die');
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setGameState('gameover');
            } else {
              // Respawn at checkpoint
              m.x = Math.max(60, g.cameraX + 40);
              m.y = 100;
              m.vy = 0;
              m.vx = 0;
            }
            return nextL;
          });
        }

        // Block bounce animation decay
        for (const b of g.blocks) {
          if (b.bouncing && b.bouncing > 0) {
            b.bouncing -= 1;
          }
        }

        // --- 2. Enemies Logic ---
        for (const e of g.enemies) {
          if (!e.alive) {
            if (e.squished !== undefined && e.squished > 0) e.squished--;
            continue;
          }

          // Move enemy
          e.x += e.vx;

          // Wall / pipe collision for enemy
          for (const b of g.blocks) {
            if (b.type === 'pipe' || b.type === 'ground') {
              if (
                e.x < b.x + b.w &&
                e.x + e.w > b.x &&
                e.y < b.y + b.h &&
                e.y + e.h > b.y
              ) {
                e.vx = -e.vx;
                if (e.vx > 0) e.x = b.x + b.w;
                else e.x = b.x - e.w;
              }
            }
          }

          // Mario vs Enemy Collision
          if (
            m.x < e.x + e.w &&
            m.x + m.w > e.x &&
            m.y < e.y + e.h &&
            m.y + m.h > e.y
          ) {
            // Stomp from above!
            if (m.vy > 0 && m.y + m.h - m.vy <= e.y + 10) {
              e.alive = false;
              e.squished = 20;
              m.vy = -7.5; // bounce Mario up
              playSound('stomp');
              setScore((s) => s + 100);
              g.particles.push({
                x: e.x + e.w / 2,
                y: e.y,
                vx: 0,
                vy: -2,
                text: '+100',
                color: '#22c55e',
                life: 25,
                maxLife: 25,
              });
            } else if (m.invulnerable <= 0) {
              // Mario hit by enemy
              playSound('die');
              setLives((l) => {
                const nextL = l - 1;
                if (nextL <= 0) {
                  setGameState('gameover');
                } else {
                  m.invulnerable = 60; // 1 second invulnerability
                  m.vy = -6;
                  m.vx = m.facing === 'right' ? -3 : 3;
                }
                return nextL;
              });
            }
          }
        }

        if (m.invulnerable > 0) m.invulnerable--;

        // Camera follow Mario horizontally
        const targetCamX = m.x - 160;
        g.cameraX = Math.max(0, Math.min(g.levelLength - canvas.width, targetCamX));

        // Update particles
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          if (p.life <= 0) g.particles.splice(i, 1);
        }
      }

      // --- 3. Rendering ---
      const cw = canvas.width;
      const ch = canvas.height;
      const cam = g.cameraX;

      // Sky Background
      ctx.fillStyle = '#5c94fc';
      ctx.fillRect(0, 0, cw, ch);

      // Distant retro clouds and bushes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const cloudPositions = [100, 380, 750, 1100, 1500, 1950, 2300];
      for (const cx of cloudPositions) {
        const drawCx = cx - cam * 0.3;
        if (drawCx > -80 && drawCx < cw + 80) {
          ctx.beginPath();
          ctx.arc(drawCx, 60, 22, 0, Math.PI * 2);
          ctx.arc(drawCx + 20, 50, 28, 0, Math.PI * 2);
          ctx.arc(drawCx + 45, 60, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Distant rolling green hills
      ctx.fillStyle = '#22c55e';
      const hillPositions = [0, 500, 1000, 1600, 2100];
      for (const hx of hillPositions) {
        const drawHx = hx - cam * 0.5;
        if (drawHx > -120 && drawHx < cw + 120) {
          ctx.beginPath();
          ctx.ellipse(drawHx + 60, 280, 80, 45, 0, Math.PI, 0, true);
          ctx.fill();
        }
      }

      // Render Blocks & Pipes
      for (const b of g.blocks) {
        const bx = b.x - cam;
        const by = b.y - (b.bouncing || 0);

        if (bx + b.w < 0 || bx > cw) continue;

        if (b.type === 'ground') {
          // Classic Mario ground pattern
          ctx.fillStyle = '#c84c0c';
          ctx.fillRect(bx, by, b.w, b.h);
          ctx.fillStyle = '#fcb474';
          ctx.fillRect(bx, by, b.w, 4);
          // brick grid lines
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          for (let step = 0; step < b.w; step += 16) {
            ctx.strokeRect(bx + step, by + 4, 16, b.h - 4);
          }
        } else if (b.type === 'pipe') {
          // Green Warp Pipe with rim
          ctx.fillStyle = '#00a800';
          ctx.fillRect(bx, by, b.w, b.h);
          ctx.fillStyle = '#00d800';
          ctx.fillRect(bx + 4, by, 6, b.h);
          ctx.strokeStyle = '#004800';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, b.w, b.h);
          // Pipe Lip Rim
          ctx.fillStyle = '#00a800';
          ctx.fillRect(bx - 3, by, b.w + 6, 12);
          ctx.strokeRect(bx - 3, by, b.w + 6, 12);
        } else if (b.type === 'question') {
          // Question mark box (Yellow-orange pulsating)
          ctx.fillStyle = '#fc9838';
          ctx.fillRect(bx, by, b.w, b.h);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, b.w, b.h);
          // Inner '?'
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('?', bx + b.w / 2, by + 20);
        } else if (b.type === 'empty') {
          // Empty brown block
          ctx.fillStyle = '#9c4a00';
          ctx.fillRect(bx, by, b.w, b.h);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, b.w, b.h);
        } else if (b.type === 'brick') {
          // Red-brown Brick
          ctx.fillStyle = '#b84418';
          ctx.fillRect(bx, by, b.w, b.h);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(bx, by, b.w, b.h);
          // Brick pattern
          ctx.strokeStyle = '#000000';
          ctx.beginPath();
          ctx.moveTo(bx, by + b.h / 2);
          ctx.lineTo(bx + b.w, by + b.h / 2);
          ctx.moveTo(bx + b.w / 2, by);
          ctx.lineTo(bx + b.w / 2, by + b.h / 2);
          ctx.stroke();
        } else if (b.type === 'flagpole') {
          // Flagpole
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx + 4, by, 4, b.h);
          // Ball on top
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(bx + 6, by, 7, 0, Math.PI * 2);
          ctx.fill();
          // Flag
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(bx + 4, by + 12);
          ctx.lineTo(bx - 26, by + 26);
          ctx.lineTo(bx + 4, by + 40);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Render Enemies (Goombas)
      for (const e of g.enemies) {
        const ex = e.x - cam;
        if (ex + e.w < 0 || ex > cw) continue;

        if (e.alive) {
          // Mushroom body
          ctx.fillStyle = '#b04a00';
          ctx.beginPath();
          ctx.arc(ex + e.w / 2, e.y + 10, 11, Math.PI, 0, false);
          ctx.lineTo(ex + e.w, e.y + e.h);
          ctx.lineTo(ex, e.y + e.h);
          ctx.closePath();
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ex + 4, e.y + 8, 4, 6);
          ctx.fillRect(ex + e.w - 8, e.y + 8, 4, 6);
          ctx.fillStyle = '#000000';
          ctx.fillRect(ex + 5, e.y + 10, 2, 4);
          ctx.fillRect(ex + e.w - 7, e.y + 10, 2, 4);
        } else if (e.squished && e.squished > 0) {
          // Squished Goomba flat pancake
          ctx.fillStyle = '#b04a00';
          ctx.fillRect(ex, e.y + e.h - 6, e.w, 6);
        }
      }

      // Render Mario
      const mx = m.x - cam;
      if (m.invulnerable % 4 < 2) {
        ctx.save();
        if (m.facing === 'left') {
          ctx.translate(mx + m.w, m.y);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(mx, m.y);
        }

        // Mario Red Cap & Shirt
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(4, 0, 14, 6); // Hat
        ctx.fillRect(8, 6, 12, 4); // Hat brim
        ctx.fillRect(4, 12, 14, 10); // Shirt

        // Face & Nose
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(8, 6, 8, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(12, 7, 2, 3); // Eye
        ctx.fillRect(10, 10, 6, 2); // Mustache

        // Blue Overalls
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(5, 16, 12, 9);
        // Yellow buttons
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, 18, 2, 2);
        ctx.fillRect(13, 18, 2, 2);

        // Brown Boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, 25, 6, 5);
        ctx.fillRect(12, 25, 6, 5);

        ctx.restore();
      }

      // Floating Score Particles
      for (const p of g.particles) {
        const px = p.x - cam;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        if (p.text) {
          ctx.fillText(p.text, px, p.y);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, playSound, onReward]);

  return (
    <div className="flex flex-col items-center justify-center p-3 w-full max-w-2xl mx-auto select-none" dir="ltr">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between mb-2 px-2 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title="رجوع للقائمة"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-red-500 font-bold text-sm tracking-wider">
            <span>🍄 SUPER MARIO</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <div className="flex items-center gap-1 text-yellow-400">
            <span>🪙</span>
            <span>{coins}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{lives}</span>
          </div>
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-1 rounded text-neutral-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-[#5c94fc] rounded-2xl overflow-hidden border-2 border-neutral-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={400}
          height={320}
          className="w-full h-full object-cover block"
        />

        {/* Cleared Overlay */}
        {gameState === 'cleared' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white z-20">
            <Sparkles className="w-14 h-14 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-2xl font-black text-yellow-400 mb-1">🎉 كفووو! أنجزت المرحلة!</h2>
            <p className="text-sm text-neutral-300 mb-4">
              فجرت طاقتك وركزت بنجاح وحصلت على +250 نقطة تركيز!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={initLevel}
                className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                العب مجددًا
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all"
              >
                خروج
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white z-20">
            <h2 className="text-2xl font-black text-red-500 mb-1">💀 GAME OVER</h2>
            <p className="text-sm text-neutral-300 mb-4">
              ولا تشيل هم! المحاولة جزء من التركيز. اضغط إعادة وجرّب تكسر رقمك!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLives(3);
                  setScore(0);
                  setCoins(0);
                  initLevel();
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة المحاولة
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all"
              >
                خروج
              </button>
            </div>
          </div>
        )}
      </div>

      {/* D-Pad & Controls (Explicitly Left-to-Right layout so Left is strictly Left) */}
      <div className="w-full flex items-center justify-between mt-4 px-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-2xl" dir="ltr">
        {/* Horizontal movement buttons */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.left = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.left = false; }}
            onMouseDown={() => { keysRef.current.left = true; }}
            onMouseUp={() => { keysRef.current.left = false; }}
            onMouseLeave={() => { keysRef.current.left = false; }}
            className="w-16 h-16 rounded-2xl bg-neutral-800 active:bg-red-600 text-white font-black text-2xl flex items-center justify-center border-2 border-neutral-700 active:scale-95 shadow-lg select-none touch-none"
            title="يسار (Left)"
          >
            ◀
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.right = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.right = false; }}
            onMouseDown={() => { keysRef.current.right = true; }}
            onMouseUp={() => { keysRef.current.right = false; }}
            onMouseLeave={() => { keysRef.current.right = false; }}
            className="w-16 h-16 rounded-2xl bg-neutral-800 active:bg-red-600 text-white font-black text-2xl flex items-center justify-center border-2 border-neutral-700 active:scale-95 shadow-lg select-none touch-none"
            title="يمين (Right)"
          >
            ▶
          </button>
        </div>

        {/* Jump Button (Right Side) */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={(e) => { e.preventDefault(); keysRef.current.jump = true; }}
            onTouchEnd={(e) => { e.preventDefault(); keysRef.current.jump = false; }}
            onMouseDown={() => { keysRef.current.jump = true; }}
            onMouseUp={() => { keysRef.current.jump = false; }}
            onMouseLeave={() => { keysRef.current.jump = false; }}
            className="w-20 h-16 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 active:brightness-125 text-white font-black text-lg flex items-center justify-center border-2 border-red-500 active:scale-95 shadow-lg select-none touch-none"
            title="قفز (Jump)"
          >
            JUMP 🅰️
          </button>
        </div>
      </div>
      <p className="text-[11px] text-neutral-400 mt-2 font-sans text-center">
        💡 يمكنك اللعب بأزرار الشاشة أو لوحة المفاتيح: (الأسهم ◀ ▶ أو A / D للمشي، Space أو W أو ▲ للقفز)
      </p>
    </div>
  );
}
