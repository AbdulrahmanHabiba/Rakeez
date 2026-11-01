import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, Flag, Bomb, Zap, X, ShieldAlert } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface BombGameProps {
  onExitGame: () => void;
  onDopamineEarned?: (amount: number) => void;
}

interface Cell {
  r: number;
  c: number;
  isBomb: boolean;
  revealed: boolean;
  flagged: boolean;
  count: number;
}

const ROWS = 7;
const COLS = 7;
const BOMBS_COUNT = 6;

export const BombGame: React.FC<BombGameProps> = ({ onExitGame, onDopamineEarned }) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [flagMode, setFlagMode] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [flagsLeft, setFlagsLeft] = useState<number>(BOMBS_COUNT);

  const initGame = () => {
    // 1. Create empty board
    const newGrid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          r,
          c,
          isBomb: false,
          revealed: false,
          flagged: false,
          count: 0,
        });
      }
      newGrid.push(row);
    }

    // 2. Place bombs randomly
    let placed = 0;
    while (placed < BOMBS_COUNT) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!newGrid[r][c].isBomb) {
        newGrid[r][c].isBomb = true;
        placed++;
      }
    }

    // 3. Calculate numbers
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c].isBomb) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isBomb) {
                count++;
              }
            }
          }
          newGrid[r][c].count = count;
        }
      }
    }

    setGrid(newGrid);
    setIsGameOver(false);
    setIsVictory(false);
    setFlagsLeft(BOMBS_COUNT);
    playChime('step');
  };

  useEffect(() => {
    initGame();
  }, []);

  const revealCell = (r: number, c: number) => {
    if (isGameOver || isVictory || grid[r][c].revealed || grid[r][c].flagged) return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    if (newGrid[r][c].isBomb) {
      // Hit bomb
      newGrid.forEach((row) =>
        row.forEach((cell) => {
          if (cell.isBomb) cell.revealed = true;
        })
      );
      setGrid(newGrid);
      setIsGameOver(true);
      playChime('pop');
      return;
    }

    // Flood fill empty cells
    const queue = [[r, c]];
    newGrid[r][c].revealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      if (newGrid[currR][currC].count === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              const neighbor = newGrid[nr][nc];
              if (!neighbor.revealed && !neighbor.isBomb && !neighbor.flagged) {
                neighbor.revealed = true;
                if (neighbor.count === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    // Check Victory condition (all non-bomb revealed)
    let unrevealedNonBombs = 0;
    newGrid.forEach((row) =>
      row.forEach((cell) => {
        if (!cell.isBomb && !cell.revealed) unrevealedNonBombs++;
      })
    );

    setGrid(newGrid);
    playChime('pop');

    if (unrevealedNonBombs === 0) {
      setIsVictory(true);
      playChime('success');
      onDopamineEarned?.(35);
    }
  };

  const toggleFlag = (r: number, c: number) => {
    if (grid[r][c].revealed || isGameOver || isVictory) return;

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const cell = newGrid[r][c];

    if (!cell.flagged && flagsLeft <= 0) return;

    cell.flagged = !cell.flagged;
    setFlagsLeft((prev) => (cell.flagged ? prev - 1 : prev + 1));
    setGrid(newGrid);
    playChime('step');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[500px] max-w-md mx-auto p-4 bg-stone-950 text-white rounded-3xl border border-rose-500/30 shadow-2xl relative select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
          <h3 className="text-sm font-extrabold text-rose-400">كاسف قنابل التشتت</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl transition-all ${
              flagMode ? 'bg-amber-500 text-black shadow-md' : 'bg-stone-900 border border-stone-800 text-stone-300'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{flagMode ? 'وضع الأعلام (مفعّل)' : 'وضع الكشف'}</span>
          </button>

          <button
            onClick={onExitGame}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            title="خروج"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Bar */}
      <div className="w-full flex items-center justify-between px-2 py-1 text-xs font-mono text-stone-400">
        <span className="flex items-center gap-1 text-rose-400 font-bold">
          <Bomb className="w-3.5 h-3.5" />
          <span>الأعلام المتبقية: {flagsLeft}</span>
        </span>
        <span className="text-[11px]">اضغط مطولاً أو بدّل زر العلم</span>
      </div>

      {/* 7x7 Grid */}
      <div className="p-2 bg-stone-900 border border-stone-800 rounded-2xl shadow-inner my-2">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              let content = null;
              let bg = 'bg-stone-800 hover:bg-stone-700 active:scale-95';

              if (cell.revealed) {
                if (cell.isBomb) {
                  bg = 'bg-rose-950 border border-rose-500/60 shadow-[0_0_10px_#f43f5e]';
                  content = <Bomb className="w-4 h-4 text-rose-400" />;
                } else if (cell.count > 0) {
                  bg = 'bg-stone-950 border border-stone-800';
                  const colors = ['', 'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400'];
                  content = (
                    <span className={`font-mono font-bold text-sm ${colors[cell.count] || 'text-purple-400'}`}>
                      {cell.count}
                    </span>
                  );
                } else {
                  bg = 'bg-stone-950/80 border border-stone-900';
                }
              } else if (cell.flagged) {
                bg = 'bg-amber-950/60 border border-amber-500/60';
                content = <Flag className="w-4 h-4 text-amber-400" />;
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleFlag(r, c);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer font-bold ${bg}`}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Game Over / Victory Modal */}
      {(isGameOver || isVictory) && (
        <div className="w-full p-3 rounded-2xl bg-black/80 border border-stone-800 flex items-center justify-between animate-in zoom-in-95">
          <div>
            <h4 className={`text-sm font-extrabold ${isVictory ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isVictory ? '🎉 برافو! أزلت كل الألغام بنجاح!' : '💥 انفجر لغم التشتت!'}
            </h4>
            <p className="text-[11px] text-stone-400">
              {isVictory ? 'عقلك في قمة الانتباه الآن' : 'لا تقلق، جرب مجدداً'}
            </p>
          </div>
          <button
            onClick={initGame}
            className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-white text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة</span>
          </button>
        </div>
      )}

      {/* Footer Restart */}
      {!isGameOver && !isVictory && (
        <button
          onClick={initGame}
          className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ترتيب اللوحة</span>
        </button>
      )}
    </div>
  );
};
