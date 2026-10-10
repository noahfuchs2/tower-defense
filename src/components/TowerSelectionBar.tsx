import React from 'react';
import { TowerId } from '../game/types';
import { TOWER_DEFINITIONS } from '../game/constants';
import { Crosshair, Zap, Wind, Orbit, Radio, ShieldAlert, Coins } from 'lucide-react';

interface TowerSelectionBarProps {
  credits: number;
  selectedTowerToBuild: TowerId | null;
  onSelectTowerToBuild: (id: TowerId | null) => void;
}

const TOWER_ICONS: Record<TowerId, React.ReactNode> = {
  gatling: <Crosshair className="w-4 h-4" />,
  plasma: <Orbit className="w-4 h-4" />,
  cryo: <Wind className="w-4 h-4" />,
  tesla: <Zap className="w-4 h-4" />,
  laser: <Radio className="w-4 h-4" />,
  railgun: <ShieldAlert className="w-4 h-4" />,
};

const TOWER_KEYS: TowerId[] = ['gatling', 'plasma', 'cryo', 'tesla', 'laser', 'railgun'];

export const TowerSelectionBar: React.FC<TowerSelectionBarProps> = ({
  credits,
  selectedTowerToBuild,
  onSelectTowerToBuild,
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md overflow-x-auto select-none z-20">
      <div className="hidden xl:flex flex-col text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-2 shrink-0">
        <span>Defensive</span>
        <span>Array</span>
      </div>

      <div className="flex items-center gap-2 w-full justify-start md:justify-center">
        {TOWER_KEYS.map((id, index) => {
          const def = TOWER_DEFINITIONS[id];
          if (!def) return null;

          const isSelected = selectedTowerToBuild === id;
          const canAfford = credits >= def.cost;

          return (
            <button
              key={id}
              onClick={() => {
                if (isSelected) {
                  onSelectTowerToBuild(null);
                } else if (canAfford) {
                  onSelectTowerToBuild(id);
                }
              }}
              disabled={!canAfford && !isSelected}
              className={`relative flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all cursor-pointer shrink-0 text-left ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-400'
                  : canAfford
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/90'
                  : 'bg-slate-950/60 border-slate-900/80 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Hotkey Tag */}
              <span className="absolute top-1 right-2 text-[10px] font-mono font-bold text-slate-400">
                [{index + 1}]
              </span>

              {/* Tower Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${def.color}15`,
                  borderColor: `${def.color}40`,
                  color: def.color,
                }}
              >
                {TOWER_ICONS[id]}
              </div>

              {/* Text Info */}
              <div className="min-w-[85px]">
                <div className="text-xs font-semibold leading-tight text-white truncate">
                  {def.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-0.5 font-mono font-bold tabular-nums ${
                      canAfford ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{def.cost}</span>
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[65px]">{def.role}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
