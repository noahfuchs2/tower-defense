import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TowerDefenseEngine } from './game/engine';
import { MAPS } from './game/maps';
import { getWavePreviewSummary } from './game/waveManager';
import { MapData, Difficulty, TowerId, PlacedTower, TacticalAbility, GameSettings, SpecializationId, TargetingPriority } from './game/types';
import { soundManager } from './game/audio';
import { TopHeader } from './components/TopHeader';
import { HudOverlay } from './components/HudOverlay';
import { GameCanvas } from './components/GameCanvas';
import { TowerSelectionBar } from './components/TowerSelectionBar';
import { TacticalAbilitiesBar } from './components/TacticalAbilitiesBar';
import { TowerInspectorModal } from './components/TowerInspectorModal';
import { CodexModal } from './components/CodexModal';
import { MapSelectModal } from './components/MapSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';

const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.7,
  musicVolume: 0.25,
  showDamageNumbers: true,
  screenShake: true,
  showGridLines: false,
  autoStartNextWave: false,
};

export default function App() {
  const [currentMap, setCurrentMap] = useState<MapData>(MAPS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // Load saved settings from localStorage
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('aegis_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [isMuted, setIsMuted] = useState(false);

  // Engine instance
  const engine = useMemo(() => {
    return new TowerDefenseEngine(currentMap, difficulty);
  }, [currentMap, difficulty]);

  // Synchronized state for React UI triggers
  const [, setTickCounter] = useState(0);
  const [selectedTowerToBuild, setSelectedTowerToBuild] = useState<TowerId | null>(null);
  const [selectedTower, setSelectedTower] = useState<PlacedTower | null>(null);
  const [activeTargetingAbility, setActiveTargetingAbility] = useState<TacticalAbility | null>(null);

  // Modal open states
  const [showCodex, setShowCodex] = useState(false);
  const [showMapSelect, setShowMapSelect] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Periodic UI sync (10 times a second is plenty for credit/wave counters)
  useEffect(() => {
    const timer = setInterval(() => {
      setTickCounter((prev) => prev + 1);
      // Sync selected tower reference if it was modified or removed
      if (engine.selectedTower !== selectedTower) {
        setSelectedTower(engine.selectedTower);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [engine, selectedTower]);

  // Sound settings initialization
  useEffect(() => {
    soundManager.setSfxVolume(settings.sfxVolume);
    soundManager.setMusicVolume(settings.musicVolume);
    if (settings.musicVolume > 0 && !isMuted) {
      soundManager.startAmbient();
    } else {
      soundManager.stopAmbient();
    }
  }, [settings.sfxVolume, settings.musicVolume, isMuted]);

  const handleUpdateSettings = (updated: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('aegis_settings', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or modal is open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();

      // 1-6: Tower selection
      if (key === '1') setSelectedTowerToBuild('gatling');
      else if (key === '2') setSelectedTowerToBuild('plasma');
      else if (key === '3') setSelectedTowerToBuild('cryo');
      else if (key === '4') setSelectedTowerToBuild('tesla');
      else if (key === '5') setSelectedTowerToBuild('laser');
      else if (key === '6') setSelectedTowerToBuild('railgun');
      // Tactical powers
      else if (key === 'q') {
        const ability = engine.tacticalAbilities.find((a) => a.id === 'orbital_strike');
        if (ability && ability.currentCooldown === 0) setActiveTargetingAbility(ability);
      } else if (key === 'w') {
        engine.triggerAbility('cryo_stasis');
      } else if (key === 'e') {
        engine.triggerAbility('overcharge');
      } else if (key === 'r') {
        engine.triggerAbility('supply_drop');
      }
      // Speed / Pause
      else if (key === ' ') {
        e.preventDefault();
        engine.speedMultiplier = engine.speedMultiplier > 0 ? 0 : 1;
      }
      // Next wave
      else if (key === 'n') {
        engine.startNextWave();
      }
      // Upgrade selected tower
      else if (key === 'u' && engine.selectedTower) {
        engine.upgradeTower(engine.selectedTower);
      }
      // Sell selected tower
      else if (key === 's' && engine.selectedTower) {
        engine.sellTower(engine.selectedTower);
        setSelectedTower(null);
      }
      // Escape
      else if (key === 'escape') {
        setSelectedTowerToBuild(null);
        setActiveTargetingAbility(null);
        engine.selectedTower = null;
        setSelectedTower(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  // Deployment resets
  const handleRestartGame = useCallback(() => {
    engine.reset(currentMap, difficulty);
    setSelectedTower(null);
    setSelectedTowerToBuild(null);
    setActiveTargetingAbility(null);
  }, [engine, currentMap, difficulty]);

  const handleSelectMapAndDifficulty = (map: MapData, diff: Difficulty) => {
    setCurrentMap(map);
    setDifficulty(diff);
    engine.reset(map, diff);
    setSelectedTower(null);
    setSelectedTowerToBuild(null);
    setActiveTargetingAbility(null);
  };

  const handleActivateAbility = (ability: TacticalAbility) => {
    soundManager.resume();
    if (ability.targetType === 'targeted') {
      setActiveTargetingAbility(ability);
      setSelectedTowerToBuild(null);
    } else {
      engine.triggerAbility(ability.id);
    }
  };

  const handleTriggerTargetedAbility = (abilityId: string, pos: { x: number; y: number }) => {
    engine.triggerAbility(abilityId, pos);
    setActiveTargetingAbility(null);
  };

  const isGameOver = engine.status === 'GAME_OVER' || engine.status === 'VICTORY';

  const nextWavePreview = useMemo(() => {
    return getWavePreviewSummary(engine.currentWave + 1, difficulty);
  }, [engine.currentWave, difficulty]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Header strictly compliant with Top Bar Contract */}
      <TopHeader
        onOpenCodex={() => setShowCodex(true)}
        onOpenMapSelect={() => setShowMapSelect(true)}
        onOpenSettings={() => setShowSettings(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onRestartGame={handleRestartGame}
      />

      {/* Main Tactical HUD Bar */}
      <HudOverlay
        lives={engine.lives}
        maxLives={engine.maxLives}
        credits={engine.credits}
        score={engine.stats.score}
        currentWave={engine.currentWave}
        totalWaves={engine.totalWavesForVictory}
        isEndless={difficulty === 'endless'}
        wavePhase={engine.wavePhase}
        waveTitle={engine.currentWaveInfo?.title}
        nextWavePreview={nextWavePreview}
        speedMultiplier={engine.speedMultiplier}
        autoStartNextWave={engine.autoStartNextWave}
        autoStartCountdown={engine.autoStartCountdown}
        onSetSpeed={(spd) => {
          engine.speedMultiplier = spd;
        }}
        onTogglePause={() => {
          engine.speedMultiplier = engine.speedMultiplier > 0 ? 0 : 1;
        }}
        onStartNextWave={() => {
          soundManager.resume();
          engine.startNextWave();
        }}
        onToggleAutoStart={() => {
          engine.autoStartNextWave = !engine.autoStartNextWave;
        }}
      />

      {/* Battlefield Interactive Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Floating Abilities Dock */}
        <div className="absolute left-4 top-4 z-20 pointer-events-auto">
          <TacticalAbilitiesBar
            abilities={engine.tacticalAbilities}
            activeTargetingAbility={activeTargetingAbility}
            onActivateAbility={handleActivateAbility}
            onCancelTargeting={() => setActiveTargetingAbility(null)}
          />
        </div>

        {/* Central Game Canvas Viewport */}
        <div className="flex-1 w-full h-full">
          <GameCanvas
            engine={engine}
            selectedTowerToBuild={selectedTowerToBuild}
            activeTargetingAbility={activeTargetingAbility}
            onSelectTower={(t) => setSelectedTower(t)}
            onTowerBuilt={() => setSelectedTowerToBuild(null)}
            onTriggerTargetedAbility={handleTriggerTargetedAbility}
            showGridLines={settings.showGridLines}
            showDamageNumbers={settings.showDamageNumbers}
            screenShake={settings.screenShake}
          />
        </div>

        {/* Right Floating Tower Inspector Modal */}
        {selectedTower && (
          <TowerInspectorModal
            tower={selectedTower}
            credits={engine.credits}
            onClose={() => {
              engine.selectedTower = null;
              setSelectedTower(null);
            }}
            onUpgrade={(t) => engine.upgradeTower(t)}
            onSpecialize={(t, specId: SpecializationId) => engine.specializeTower(t, specId)}
            onSell={(t) => {
              engine.sellTower(t);
              setSelectedTower(null);
            }}
            onSetTargeting={(t, priority: TargetingPriority) => engine.setTowerTargeting(t, priority)}
          />
        )}
      </div>

      {/* Bottom Tower Deployment Dock */}
      <TowerSelectionBar
        credits={engine.credits}
        selectedTowerToBuild={selectedTowerToBuild}
        onSelectTowerToBuild={(id) => {
          soundManager.resume();
          setSelectedTowerToBuild(id);
          setActiveTargetingAbility(null);
          engine.selectedTower = null;
          setSelectedTower(null);
        }}
      />

      {/* Modals */}
      {showCodex && <CodexModal onClose={() => setShowCodex(false)} />}

      {showMapSelect && (
        <MapSelectModal
          currentMap={currentMap}
          currentDifficulty={difficulty}
          onSelect={handleSelectMapAndDifficulty}
          onClose={() => setShowMapSelect(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {isGameOver && (
        <GameOverModal
          isVictory={engine.status === 'VICTORY'}
          stats={engine.stats}
          currentWave={engine.currentWave}
          onRestart={handleRestartGame}
          onOpenMapSelect={() => {
            setShowMapSelect(true);
          }}
        />
      )}
    </div>
  );
}
