import React, { useState } from 'react';
import { TowerId } from '../game/types';
import { TOWER_DEFINITIONS } from '../game/constants';
import {
  Crosshair,
  Zap,
  Wind,
  Orbit,
  Radio,
  ShieldAlert,
  Coins,
  Radar,
  Sparkles,
  Info,
} from 'lucide-react';

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

const TOWER_SPECIAL_TAGS: Record<TowerId, { tag: string; strongAgainst: string }> = {
  gatling: {
    tag: '3.2/s Schnellfeuer · Anti-Schwarm',
    strongAgainst: 'Schnelle & ungepanzerte Schwärme',
  },
  plasma: {
    tag: '52px Flächenschaden · Artillerie',
    strongAgainst: 'Dichte Gruppen & Infanterie',
  },
  cryo: {
    tag: '45% Verlangsamung · Frost-Debuff',
    strongAgainst: 'Schnelle Läufer & Phantome',
  },
  tesla: {
    tag: '3x Kettenblitz · Rüstungs-Bypass',
    strongAgainst: 'Mehrere Ziele & Schilde',
  },
  laser: {
    tag: '48 DPS Dauerstrahl · Boss-Schmelzer',
    strongAgainst: 'Schwere Mechs & Boss-Titanen',
  },
  railgun: {
    tag: '175 Dmg · Linien-Durchschlag',
    strongAgainst: 'Gepanzerte Kolonnen & Schilde',
  },
};

const TOWER_KEYS: TowerId[] = ['gatling', 'plasma', 'cryo', 'tesla', 'laser', 'railgun'];

export const TowerSelectionBar: React.FC<TowerSelectionBarProps> = ({
  credits,
  selectedTowerToBuild,
  onSelectTowerToBuild,
}) => {
  const [hoveredTower, setHoveredTower] = useState<TowerId | null>(null);

  return (
    <div className="relative flex flex-col bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md select-none z-20">
      {/* Floating Tactical Quick-Spec Tooltip on Hover or Selection */}
      {(hoveredTower || selectedTowerToBuild) && (
        <div className="hidden md:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[520px] bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none z-30">
          {(() => {
            const activeId = hoveredTower || selectedTowerToBuild!;
            const def = TOWER_DEFINITIONS[activeId];
            const meta = TOWER_SPECIAL_TAGS[activeId];
            if (!def) return null;

            const dps =
              activeId === 'laser'
                ? Math.round(def.damage * def.fireRate)
                : Math.round(def.damage * def.fireRate);

            return (
              <div className="w-full space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: def.color }}
                    />
                    <span className="text-sm font-bold text-white font-display">
                      {def.name}
                    </span>
                    <span className="text-[11px] text-sky-400 font-medium">
                      ({def.role})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-300">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{def.cost} Credits</span>
                  </div>
                </div>

                {/* Capability Description */}
                <p className="text-xs text-slate-300 leading-snug">
                  {def.description}
                </p>

                {/* Combat Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 py-1.5 px-2 bg-slate-950/60 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Schaden</span>
                    <span className="font-mono font-bold text-white">
                      {def.damage}
                      {activeId === 'laser' ? '/tick' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Feuerrate</span>
                    <span className="font-mono font-bold text-white">{def.fireRate}/s</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">DPS</span>
                    <span className="font-mono font-bold text-amber-300">{dps} DPS</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Reichweite</span>
                    <span className="font-mono font-bold text-sky-400">{def.range}px</span>
                  </div>
                </div>

                {/* Tactical Strengths & Specializations */}
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="text-slate-300 font-medium">Ideal gegen:</span>
                    <span className="text-amber-300 font-semibold">{meta.strongAgainst}</span>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    <span className="text-sky-400 font-medium">Spezialisierungen: </span>
                    <span>{def.specializations[0].name} · {def.specializations[1].name}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main Tower Selection Strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto w-full justify-start md:justify-center">
        <div className="hidden 2xl:flex flex-col text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-2 shrink-0">
          <span>Verteidigungs</span>
          <span>Batterie</span>
        </div>

        {TOWER_KEYS.map((id, index) => {
          const def = TOWER_DEFINITIONS[id];
          const meta = TOWER_SPECIAL_TAGS[id];
          if (!def) return null;

          const isSelected = selectedTowerToBuild === id;
          const canAfford = credits >= def.cost;
          const isHovered = hoveredTower === id;

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
              onMouseEnter={() => setHoveredTower(id)}
              onMouseLeave={() => setHoveredTower(null)}
              disabled={!canAfford && !isSelected}
              className={`relative flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all cursor-pointer shrink-0 text-left ${
                isSelected
                  ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10 ring-1 ring-sky-400'
                  : isHovered
                  ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-md'
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

              {/* Text & Quick Stats Info */}
              <div className="min-w-[125px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold leading-tight text-white truncate">
                    {def.name}
                  </span>
                </div>

                {/* Cost and Damage / Role line */}
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
                  <span className="font-mono text-slate-300 font-medium">
                    {def.damage} Dmg
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {def.range}px
                  </span>
                </div>

                {/* Special Trait Micro-Badge */}
                <div className="text-[10px] text-sky-400 font-medium truncate max-w-[140px] mt-0.5">
                  {meta.tag}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
