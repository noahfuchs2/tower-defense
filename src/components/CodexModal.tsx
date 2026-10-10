import React, { useState } from 'react';
import { X, Shield, Crosshair, Skull, Info, Coins, Heart, Zap, Wind, Radar, ShieldAlert } from 'lucide-react';
import { TOWER_DEFINITIONS, ENEMY_DEFINITIONS } from '../game/constants';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'towers' | 'enemies' | 'mechanics'>('towers');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Tactical Intelligence Codex
              </h2>
              <div className="text-xs text-slate-400">
                Specifications for defense structures, hostile archetypes, and damage mechanics
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-800/60 bg-slate-950/50 shrink-0">
          <button
            onClick={() => setTab('towers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              tab === 'towers'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Defensive Turrets</span>
          </button>
          <button
            onClick={() => setTab('enemies')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              tab === 'enemies'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Hostile Entities</span>
          </button>
          <button
            onClick={() => setTab('mechanics')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              tab === 'mechanics'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Combat Rules</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {tab === 'towers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(TOWER_DEFINITIONS).map((tower) => (
                <div
                  key={tower.id}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tower.color }}
                        />
                        <h4 className="text-sm font-bold text-white">{tower.name}</h4>
                      </div>
                      <div className="text-xs text-sky-400 mt-0.5">{tower.role}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-400">
                      <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{tower.cost}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tower.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-900/60 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                        <Crosshair className="w-2.5 h-2.5 text-sky-400" /> Damage
                      </span>
                      <span className="font-mono font-bold text-white">{tower.damage}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-400" /> Rate
                      </span>
                      <span className="font-mono font-bold text-white">{tower.fireRate}/s</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                        <Radar className="w-2.5 h-2.5 text-emerald-400" /> Range
                      </span>
                      <span className="font-mono font-bold text-white">{tower.range}px</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    <span className="text-amber-400 font-semibold block mb-1">
                      Elite Specializations:
                    </span>
                    <ul className="space-y-1 list-disc list-inside">
                      {tower.specializations.map((spec) => (
                        <li key={spec.id}>
                          <span className="text-slate-200 font-medium">{spec.name}</span>:{' '}
                          {spec.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'enemies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(ENEMY_DEFINITIONS).map((enemy) => (
                <div
                  key={enemy.type}
                  className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: enemy.color }}
                        />
                        <h4 className="text-sm font-bold text-white">{enemy.name}</h4>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {enemy.isBoss ? 'Elite Dreadnought Boss' : 'Combat Unit'}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-400">
                      <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>+{enemy.goldReward} Bounty</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {enemy.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-900/60 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                        <Heart className="w-2.5 h-2.5 text-rose-400" /> HP
                      </span>
                      <span className="font-mono font-bold text-rose-400">{enemy.maxHealth}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5 text-amber-400" /> Armor
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {Math.round(enemy.armor * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                        <Wind className="w-2.5 h-2.5 text-sky-400" /> Speed
                      </span>
                      <span className="font-mono font-bold text-white">{enemy.speed}px/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'mechanics' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-sky-400">Armor & Damage Types</h4>
                <p>
                  Armored units (like Siege Mechs and Dreadnoughts) reduce kinetic and explosive damage by their armor percentage.
                  Energy beams and Tesla electric arcs bypass 50% of armor ratings. Depleted Uranium rounds and Hyperion Railguns ignore armor completely.
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-sky-400">Shields vs Hull Hitpoints</h4>
                <p>
                  Shielded Colossi feature protective energy barriers that absorb 100% of incoming damage before hull penetration.
                  Tesla EMP arcs quickly collapse shields.
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-sky-400">Early Deployment Bonus</h4>
                <p>
                  Calling incoming waves before the countdown timer expires awards an early bonus proportional to remaining seconds.
                  Use this to build an aggressive economy!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
