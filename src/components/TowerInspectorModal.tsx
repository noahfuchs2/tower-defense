import React from 'react';
import { PlacedTower, TargetingPriority, SpecializationId } from '../game/types';
import { TOWER_DEFINITIONS } from '../game/constants';
import { X, ArrowUpCircle, Trash2, Crosshair, Award, Zap, Coins, FastForward, Rewind, Shield, HeartCrack, Wind, LocateFixed } from 'lucide-react';

interface TowerInspectorModalProps {
  tower: PlacedTower;
  credits: number;
  onClose: () => void;
  onUpgrade: (tower: PlacedTower) => void;
  onSpecialize: (tower: PlacedTower, specId: SpecializationId) => void;
  onSell: (tower: PlacedTower) => void;
  onSetTargeting: (tower: PlacedTower, target: TargetingPriority) => void;
}

const TARGETING_OPTIONS: TargetingPriority[] = ['FIRST', 'LAST', 'STRONGEST', 'WEAKEST', 'FASTEST', 'CLOSEST'];

export const TowerInspectorModal: React.FC<TowerInspectorModalProps> = ({
  tower,
  credits,
  onClose,
  onUpgrade,
  onSpecialize,
  onSell,
  onSetTargeting,
}) => {
  const def = TOWER_DEFINITIONS[tower.towerId];
  if (!def) return null;

  const isMaxLevel = tower.level >= 3;
  const upgradeCost = !isMaxLevel ? def.upgradeCosts[tower.level - 1] : 0;
  const canAffordUpgrade = !isMaxLevel && credits >= upgradeCost;
  const sellValue = Math.round(tower.totalInvestedCost * 0.75);

  const activeSpec = def.specializations.find((s) => s.id === tower.specialization);

  return (
    <div className="absolute right-4 top-16 w-80 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl p-4 select-none z-30 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: def.color }}
            />
            <h3 className="text-sm font-bold text-white font-display">
              {def.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
            <span>Level {tower.level}</span>
            <span>·</span>
            <span>{def.role}</span>
            {activeSpec && (
              <>
                <span>·</span>
                <span className="text-amber-400 font-medium">{activeSpec.name}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Combat Metrics */}
      <div className="grid grid-cols-2 gap-2 my-3 py-2 px-3 bg-slate-900/60 rounded-lg border border-slate-800/80">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Damage Dealt</div>
          <div className="font-mono text-sm font-bold tabular-nums text-sky-400">
            {Math.round(tower.totalDamageDealt).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Eliminations</div>
          <div className="font-mono text-sm font-bold tabular-nums text-white">
            {tower.kills} kills
          </div>
        </div>
      </div>

      {/* Targeting Priority Selector */}
      <div className="mb-3">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          <Crosshair className="w-3 h-3 text-sky-400" />
          <span>Targeting Protocol</span>
        </label>
        <div className="grid grid-cols-3 gap-1">
          {TARGETING_OPTIONS.map((priority) => {
            const isCurrent = tower.targeting === priority;
            const icon =
              priority === 'FIRST' ? (
                <FastForward className="w-3 h-3" />
              ) : priority === 'LAST' ? (
                <Rewind className="w-3 h-3" />
              ) : priority === 'STRONGEST' ? (
                <Shield className="w-3 h-3" />
              ) : priority === 'WEAKEST' ? (
                <HeartCrack className="w-3 h-3" />
              ) : priority === 'FASTEST' ? (
                <Wind className="w-3 h-3" />
              ) : (
                <LocateFixed className="w-3 h-3" />
              );

            return (
              <button
                key={priority}
                onClick={() => onSetTargeting(tower, priority)}
                className={`flex items-center justify-center gap-1 py-1 text-[10px] font-semibold rounded transition-colors cursor-pointer capitalize ${
                  isCurrent
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {icon}
                <span>{priority.toLowerCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upgrades or Elite Specialization */}
      <div className="mb-3">
        {!isMaxLevel ? (
          <button
            onClick={() => onUpgrade(tower)}
            disabled={!canAffordUpgrade}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              canAffordUpgrade
                ? 'bg-sky-500/15 border-sky-400 text-white hover:bg-sky-500/25 active:scale-98'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-sky-400" />
              <span>Upgrade to Level {tower.level + 1}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${
                canAffordUpgrade ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{upgradeCost}</span>
            </span>
          </button>
        ) : !tower.specialization ? (
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              <Award className="w-3 h-3" />
              <span>Choose Elite Specialization</span>
            </div>
            <div className="space-y-1.5">
              {def.specializations.map((spec) => {
                const canAfford = credits >= spec.cost;
                return (
                  <button
                    key={spec.id}
                    onClick={() => onSpecialize(tower, spec.id)}
                    disabled={!canAfford}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>{spec.name}</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{spec.cost}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {spec.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold">{activeSpec?.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{activeSpec?.description}</div>
            </div>
          </div>
        )}
      </div>

      {/* Decommission / Sell Button */}
      <button
        onClick={() => onSell(tower)}
        className="w-full flex items-center justify-between px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Decommission & Sell</span>
        </div>
        <span className="inline-flex items-center gap-1 font-mono font-bold tabular-nums">
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>+{sellValue}</span>
        </span>
      </button>
    </div>
  );
};
