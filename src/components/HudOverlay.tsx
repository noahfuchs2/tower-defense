import React from 'react';
import { Heart, Coins, Trophy, FastForward, Pause, Play, Flame } from 'lucide-react';
import { WavePhase } from '../game/engine';

interface HudOverlayProps {
  lives: number;
  maxLives: number;
  credits: number;
  score: number;
  currentWave: number;
  totalWaves: number;
  isEndless: boolean;
  wavePhase: WavePhase;
  waveTitle?: string;
  speedMultiplier: number;
  autoStartNextWave: boolean;
  autoStartCountdown: number;
  onSetSpeed: (speed: number) => void;
  onTogglePause: () => void;
  onStartNextWave: () => void;
  onToggleAutoStart: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  lives,
  maxLives,
  credits,
  score,
  currentWave,
  totalWaves,
  isEndless,
  wavePhase,
  waveTitle,
  speedMultiplier,
  autoStartNextWave,
  autoStartCountdown,
  onSetSpeed,
  onTogglePause,
  onStartNextWave,
  onToggleAutoStart,
}) => {
  const isPlaying = speedMultiplier > 0;
  const isSpawning = wavePhase === 'SPAWNING';
  const isClearing = wavePhase === 'CLEARING';
  const canStartNext = wavePhase === 'WAITING_TO_START' || wavePhase === 'COMPLETED';

  const lifeStatus = lives > maxLives * 0.5 ? 'OPTIMAL' : lives > maxLives * 0.25 ? 'CAUTION' : 'CRITICAL';
  const lifeColor =
    lives > maxLives * 0.5
      ? 'text-emerald-400'
      : lives > maxLives * 0.25
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm select-none z-20">
      {/* Tactical Resources Block */}
      <div className="flex items-center gap-6">
        {/* Base Core Health */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Heart className="w-4 h-4 fill-rose-500/30" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 leading-none">Core Hull</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {lives}/{maxLives}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">·</span>
              <span className={`text-[10px] font-semibold tracking-wider ${lifeColor}`}>
                {lifeStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Credits */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 leading-none">Credits</div>
            <div className="font-mono text-base font-bold tabular-nums text-amber-300 mt-0.5">
              {credits.toLocaleString()}g
            </div>
          </div>
        </div>

        {/* Wave Tracker */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 leading-none">Wave Tracker</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {currentWave}
              </span>
              <span className="text-xs text-slate-400">
                / {isEndless ? '∞' : totalWaves}
              </span>
              {waveTitle && (
                <>
                  <span className="text-[10px] text-slate-500 font-medium">·</span>
                  <span className="text-[11px] text-slate-400 max-w-[130px] truncate">
                    {waveTitle}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Score */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 leading-none">Score</div>
            <div className="font-mono text-base font-bold tabular-nums text-purple-300 mt-0.5">
              {score.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Control & Next Wave Actions Block */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Simulation Speed Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              !isPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="Pause / Resume (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onSetSpeed(1)}
            className={`px-2 py-1 rounded text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
              isPlaying && speedMultiplier === 1 ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            className={`px-2 py-1 rounded text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
              isPlaying && speedMultiplier === 2 ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            2x
          </button>
          <button
            onClick={() => onSetSpeed(4)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
              isPlaying && speedMultiplier === 4 ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FastForward className="w-3 h-3" />
            4x
          </button>
        </div>

        {/* Auto Next Wave Checkbox */}
        <label className="hidden sm:flex items-center gap-2 text-xs text-slate-400 cursor-pointer px-2 py-1 hover:text-slate-300">
          <input
            type="checkbox"
            checked={autoStartNextWave}
            onChange={onToggleAutoStart}
            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="whitespace-nowrap">Auto-Deploy</span>
        </label>

        {/* Launch Next Wave Button */}
        <button
          onClick={onStartNextWave}
          disabled={!canStartNext}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-sm ${
            canStartNext
              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 hover:from-sky-400 hover:to-cyan-400 shadow-sky-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
          title="Hotkey: N"
        >
          {isSpawning ? (
            <span>Hostiles Incoming...</span>
          ) : isClearing ? (
            <span>Neutralizing Hostiles...</span>
          ) : (
            <>
              <span>Deploy Wave {currentWave + 1}</span>
              {autoStartCountdown > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-slate-950/40 rounded text-slate-900 font-mono">
                  {Math.ceil(autoStartCountdown)}s
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
