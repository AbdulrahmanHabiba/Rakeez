import React, { useState } from 'react';
import { RotateCcw, Trophy, Zap, X as CloseIcon, Bot, User, Sparkles } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface XOGameProps {
  onExitGame: () => void;
  onDopamineEarned?: (amount: number) => void;
}

type Player = 'X' | 'O';
type Board = (Player | null)[];

export const XOGame: React.FC<XOGameProps> = ({ onExitGame, onDopamineEarned }) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [vsAI, setVsAI] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const WINNING_COMBOS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const checkWinner = (currentBoard: Board): { winner: Player | 'DRAW' | null; line: number[] | null } => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'DRAW', line: null };
    }
    return { winner: null, line: null };
  };

  const findBestAIMove = (currentBoard: Board): number => {
    // 1. Check if AI can win on next move
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      const vals = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (vals.filter((v) => v === 'O').length === 2 && vals.includes(null)) {
        if (currentBoard[a] === null) return a;
        if (currentBoard[b] === null) return b;
        if (currentBoard[c] === null) return c;
      }
    }

    // 2. Block user 'X' from winning
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      const vals = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (vals.filter((v) => v === 'X').length === 2 && vals.includes(null)) {
        if (currentBoard[a] === null) return a;
        if (currentBoard[b] === null) return b;
        if (currentBoard[c] === null) return c;
      }
    }

    // 3. Take center if free
    if (currentBoard[4] === null) return 4;

    // 4. Take random available spot
    const emptyIndices = currentBoard.map((val, idx) => (val === null ? idx : null)).filter((idx) => idx !== null) as number[];
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    playChime('pop');

    const result = checkWinner(newBoard);
    if (result.winner) {
      finalizeGame(result.winner, result.line, newBoard);
      return;
    }

    setBoard(newBoard);

    // If vs AI and next turn is O
    if (vsAI && isXNext) {
      setIsXNext(false);
      setTimeout(() => {
        const aiMove = findBestAIMove(newBoard);
        if (aiMove !== undefined && newBoard[aiMove] === null) {
          newBoard[aiMove] = 'O';
          playChime('step');
          const aiResult = checkWinner(newBoard);
          if (aiResult.winner) {
            finalizeGame(aiResult.winner, aiResult.line, newBoard);
          } else {
            setBoard([...newBoard]);
            setIsXNext(true);
          }
        }
      }, 350);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const finalizeGame = (winResult: Player | 'DRAW', line: number[] | null, currentBoard: Board) => {
    setBoard(currentBoard);
    setWinner(winResult);
    setWinningLine(line);

    if (winResult === 'X') {
      playChime('success');
      onDopamineEarned?.(25);
      setScores((s) => ({ ...s, X: s.X + 1 }));
    } else if (winResult === 'O') {
      playChime('pop');
      setScores((s) => ({ ...s, O: s.O + 1 }));
    } else {
      playChime('pop');
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    }
  };

  const restartRound = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    playChime('step');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[490px] max-w-md mx-auto p-4 bg-stone-950 text-white rounded-3xl border border-violet-500/30 shadow-2xl relative select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
          <h3 className="text-sm font-extrabold text-violet-400">نيون XO (تنشيط ذهني سريع)</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVsAI(!vsAI);
              restartRound();
            }}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white"
          >
            {vsAI ? <Bot className="w-3.5 h-3.5 text-violet-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{vsAI ? 'ضد الكمبيوتر' : 'شخصين'}</span>
          </button>
          <button
            onClick={onExitGame}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            title="خروج"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Score Tracker */}
      <div className="flex items-center gap-6 my-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <span className="font-extrabold text-sm">X:</span>
          <span>{scores.X}</span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-500">
          <span>تعادل:</span>
          <span>{scores.draws}</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="font-extrabold text-sm">O:</span>
          <span>{scores.O}</span>
        </div>
      </div>

      {/* 3x3 Neon Grid */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-stone-900/90 border border-stone-800 rounded-3xl shadow-inner w-72 h-72">
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`rounded-2xl flex items-center justify-center text-4xl font-black font-mono transition-all cursor-pointer ${
                isWinningCell
                  ? 'bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_15px_#fbbf24] animate-pulse'
                  : 'bg-black/60 hover:bg-stone-800 border border-stone-800/80 active:scale-95'
              }`}
            >
              {cell === 'X' && (
                <span className="text-cyan-400 filter drop-shadow-[0_0_8px_#38bdf8]">X</span>
              )}
              {cell === 'O' && (
                <span className="text-rose-400 filter drop-shadow-[0_0_8px_#f43f5e]">O</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status & Restart */}
      <div className="w-full flex items-center justify-between pt-2">
        <span className="text-xs font-bold text-stone-300">
          {winner === 'X'
            ? '🏆 فوز X الباهر!'
            : winner === 'O'
            ? '🤖 فاز O!'
            : winner === 'DRAW'
            ? '🤝 تعادل ممتاز!'
            : `الدور الحالي: ${isXNext ? 'X (أنت)' : 'O'}`}
        </span>

        <button
          onClick={restartRound}
          className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>جولة جديدة</span>
        </button>
      </div>
    </div>
  );
};
