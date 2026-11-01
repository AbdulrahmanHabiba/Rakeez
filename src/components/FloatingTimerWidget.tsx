/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Floating Timer / Picture-in-Picture (PIP) Corner Widget
 * Stays visible in bottom corner when a timer/clock/pomodoro is running in background.
 * Provides live time readout, play/pause, stop, and maximize.
 */

import { Play, Pause, Square, Maximize2, Timer } from 'lucide-react';

interface FloatingTimerWidgetProps {
  type: 'pomodoro' | 'seconds' | 'visual' | 'clock';
  timeDisplay: string;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onMaximize: () => void;
}

export function FloatingTimerWidget({
  type,
  timeDisplay,
  isRunning,
  onTogglePlay,
  onStop,
  onMaximize,
}: FloatingTimerWidgetProps) {
  const titles = {
    pomodoro: '🍅 بومودورو',
    seconds: '⏱ عداد الثواني',
    visual: '⏳ قرص الوقت',
    clock: '🕒 ساعة زن',
  };

  return (
    <div
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 p-2 px-3 bg-neutral-900/95 border border-cyan-500/50 rounded-2xl shadow-2xl backdrop-blur-md text-white animate-fade-in select-none"
      dir="ltr"
    >
      <div className="flex items-center gap-2 pr-2 border-r border-neutral-700">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
          <Timer className="w-4 h-4 animate-spin-slow" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-cyan-400 font-bold leading-none">{titles[type]}</span>
          <span className="text-sm font-mono font-black tracking-wider leading-tight text-white">{timeDisplay}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePlay}
          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          title={isRunning ? 'إيقاف مؤقت' : 'استئناف'}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          onClick={onMaximize}
          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-cyan-500 hover:text-black text-neutral-200 transition-colors"
          title="تكبير للشاشة الكاملة"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onStop}
          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500 text-neutral-200 transition-colors"
          title="إغلاق المؤقت"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
