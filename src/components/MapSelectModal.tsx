import React, { useState } from 'react';
import { X, Map, ShieldCheck, Flame, Infinity as InfinityIcon, Coins } from 'lucide-react';
import { MAPS } from '../game/maps';
import { MapData, Difficulty } from '../game/types';

interface MapSelectModalProps {
  currentMap: MapData;
  currentDifficulty: Difficulty;
  onSelect: (map: MapData, difficulty: Difficulty) => void;
  onClose: () => void;
}

export const MapSelectModal: React.FC<MapSelectModalProps> = ({
  currentMap,
  currentDifficulty,
  onSelect,
  onClose,
}) => {
  const [selectedMapId, setSelectedMapId] = useState<string>(currentMap.id);
  const [difficulty, setDifficulty] = useState<Difficulty>(currentDifficulty);

  const selectedMap = MAPS.find((m) => m.id === selectedMapId) || MAPS[0];

  const handleStart = () => {
    onSelect(selectedMap, difficulty);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Map className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Sector Deployment
              </h2>
              <div className="text-xs text-slate-400">
                Select theater of operations and engagement intensity
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Map Cards */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Select Combat Sector
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MAPS.map((map) => {
                const isSelected = selectedMapId === map.id;
                return (
                  <button
                    key={map.id}
                    onClick={() => setSelectedMapId(map.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 shadow-md ring-1 ring-sky-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{map.name}</div>
                    <div className="text-[10px] text-sky-400 mt-0.5">{map.subtitle}</div>
                    <div className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-snug">
                      {map.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Engagement Difficulty
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setDifficulty('casual')}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  difficulty === 'casual'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <div className="text-xs font-semibold">Casual</div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  <span>30 Lives ·</span>
                  <Coins className="w-2.5 h-2.5 text-amber-400" />
                  <span>450</span>
                </div>
              </button>

              <button
                onClick={() => setDifficulty('normal')}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  difficulty === 'normal'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-semibold">Normal</div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  <span>20 Lives ·</span>
                  <Coins className="w-2.5 h-2.5 text-amber-400" />
                  <span>350</span>
                </div>
              </button>

              <button
                onClick={() => setDifficulty('heroic')}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  difficulty === 'heroic'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                <div className="text-xs font-semibold">Heroic</div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  <span>12 Lives ·</span>
                  <Coins className="w-2.5 h-2.5 text-amber-400" />
                  <span>300</span>
                </div>
              </button>

              <button
                onClick={() => setDifficulty('endless')}
                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  difficulty === 'endless'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <InfinityIcon className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-xs font-semibold">Endless</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Infinite Waves</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              Confirm Deployment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
