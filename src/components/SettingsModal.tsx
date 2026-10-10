import React from 'react';
import { X, Volume2, Sliders, Monitor } from 'lucide-react';
import { GameSettings } from '../game/types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Settings & Audio
              </h2>
              <div className="text-xs text-slate-400">
                Audio volume and battlefield visuals
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

        <div className="p-6 space-y-5">
          {/* Audio Sliders */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Audio Synthesis</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Sound Effects (SFX)</span>
                <span className="font-mono tabular-nums text-slate-400">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Ambient Synth Atmosphere</span>
                <span className="font-mono tabular-nums text-slate-400">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Visual Options */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Monitor className="w-3.5 h-3.5 text-sky-400" />
              <span>Combat Visuals</span>
            </div>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1">
              <span>Floating Damage Indicators</span>
              <input
                type="checkbox"
                checked={settings.showDamageNumbers}
                onChange={(e) => onUpdateSettings({ showDamageNumbers: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1">
              <span>Explosive Screen Shake</span>
              <input
                type="checkbox"
                checked={settings.screenShake}
                onChange={(e) => onUpdateSettings({ screenShake: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer py-1">
              <span>Tactical Grid Overlay Lines</span>
              <input
                type="checkbox"
                checked={settings.showGridLines}
                onChange={(e) => onUpdateSettings({ showGridLines: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Close button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
