import React from 'react';
import { TacticalAbility } from '../game/types';
import { Crosshair, Snowflake, Gauge, Box } from 'lucide-react';

interface TacticalAbilitiesBarProps {
  abilities: TacticalAbility[];
  activeTargetingAbility: TacticalAbility | null;
  onActivateAbility: (ability: TacticalAbility) => void;
  onCancelTargeting: () => void;
}

const ABILITY_ICONS: Record<string, React.ReactNode> = {
  orbital_strike: <Crosshair className="w-4 h-4 text-rose-400" />,
  cryo_stasis: <Snowflake className="w-4 h-4 text-cyan-400" />,
  overcharge: <Gauge className="w-4 h-4 text-amber-400" />,
  supply_drop: <Box className="w-4 h-4 text-emerald-400" />,
};

export const TacticalAbilitiesBar: React.FC<TacticalAbilitiesBarProps> = ({
  abilities,
  activeTargetingAbility,
  onActivateAbility,
  onCancelTargeting,
}) => {
  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-xl backdrop-blur-md select-none">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
        Commander Powers
      </div>

      <div className="flex sm:flex-col gap-2">
        {abilities.map((ability) => {
          const isOnCooldown = ability.currentCooldown > 0;
          const isActive = (ability.activeRemaining || 0) > 0;
          const isTargeting = activeTargetingAbility?.id === ability.id;
          const cooldownPct = isOnCooldown
            ? Math.round((ability.currentCooldown / ability.cooldownSeconds) * 100)
            : 0;

          return (
            <button
              key={ability.id}
              onClick={() => {
                if (isTargeting) {
                  onCancelTargeting();
                } else if (!isOnCooldown) {
                  onActivateAbility(ability);
                }
              }}
              disabled={isOnCooldown}
              className={`relative flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                isTargeting
                  ? 'bg-rose-500/20 border-rose-400 text-white ring-1 ring-rose-400'
                  : isActive
                  ? 'bg-amber-500/20 border-amber-400 text-white animate-pulse'
                  : isOnCooldown
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
              }`}
              title={`${ability.name} (${ability.description}) - Hotkey [${ability.hotkey}]`}
            >
              {/* Cooldown Mask Overlay */}
              {isOnCooldown && (
                <div
                  className="absolute inset-0 bg-slate-950/70 rounded-lg pointer-events-none"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${cooldownPct}%, 0 ${cooldownPct}%)`,
                  }}
                />
              )}

              {/* Icon */}
              <div className="w-8 h-8 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                {ABILITY_ICONS[ability.id]}
              </div>

              {/* Details */}
              <div className="hidden sm:block min-w-[110px]">
                <div className="flex items-center justify-between text-xs font-semibold leading-tight text-white">
                  <span className="truncate max-w-[90px]">{ability.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">[{ability.hotkey}]</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono tabular-nums">
                  {isOnCooldown
                    ? `${Math.ceil(ability.currentCooldown)}s recharge`
                    : isActive
                    ? `${Math.ceil(ability.activeRemaining!)}s active`
                    : isTargeting
                    ? 'Click on map...'
                    : 'Ready'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
