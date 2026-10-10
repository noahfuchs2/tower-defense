import React from 'react';
import { GameStats } from '../game/types';
import { Trophy, Skull, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  stats: GameStats;
  currentWave: number;
  onRestart: () => void;
  onOpenMapSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  stats,
  currentWave,
  onRestart,
  onOpenMapSelect,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center select-none">
        {/* Victory/Defeat Icon */}
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 border ${
            isVictory
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {isVictory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-extrabold text-white font-display tracking-tight">
          {isVictory ? 'Sector Secured · Victory' : 'Base Core Breached · Defeat'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          {isVictory
            ? 'All hostile attack waves neutralized. The orbital command core remains operational.'
            : `Defenses collapsed on Wave ${currentWave}. Reorganize turret placement and retry.`}
        </p>

        {/* Post-Battle Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 my-5 text-left">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Final Score</div>
            <div className="font-mono text-base font-bold tabular-nums text-purple-300 mt-0.5">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Waves Cleared</div>
            <div className="font-mono text-base font-bold tabular-nums text-sky-400 mt-0.5">
              {stats.wavesCleared} Waves
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Hostiles Defeated</div>
            <div className="font-mono text-base font-bold tabular-nums text-white mt-0.5">
              {stats.totalKills.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Damage Output</div>
            <div className="font-mono text-base font-bold tabular-nums text-amber-300 mt-0.5">
              {Math.round(stats.damageDealt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Redeploy Sector</span>
          </button>

          <button
            onClick={onOpenMapSelect}
            className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Change Sector or Difficulty
          </button>
        </div>
      </div>
    </div>
  );
};
