import React from 'react';
import { Volume2, VolumeX, Shield, BookOpen, Map, Settings } from 'lucide-react';
import { soundManager } from '../game/audio';

interface TopHeaderProps {
  onOpenCodex: () => void;
  onOpenMapSelect: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestartGame: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenCodex,
  onOpenMapSelect,
  onOpenSettings,
  isMuted,
  onToggleMute,
  onRestartGame,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md select-none shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white font-display">
          Aegis Vanguard
        </span>
      </div>

      {/* Zone 2: 4-5 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenMapSelect}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Sectors & Maps</span>
        </button>
        <button
          onClick={onOpenCodex}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tactical Codex</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Audio & Graphics</span>
        </button>
        <button
          onClick={() => {
            soundManager.resume();
            onToggleMute();
          }}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Toggle Audio Mute"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
          <span>{isMuted ? 'Muted' : 'Audio Active'}</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRestartGame}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
        >
          New Deployment
        </button>
      </div>
    </header>
  );
};
