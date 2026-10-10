import { EnemyType, Difficulty } from './types';

export interface SpawnQueueItem {
  type: EnemyType;
  pathIndex: number;
  spawnTime: number; // in seconds relative to wave start
}

export interface WaveInfo {
  waveNumber: number;
  totalEnemies: number;
  spawns: SpawnQueueItem[];
  isBossWave: boolean;
  rewardGold: number;
  title: string;
}

export function generateWave(waveNumber: number, numPaths: number, difficulty: Difficulty): WaveInfo {
  const spawns: SpawnQueueItem[] = [];
  const isBossWave = waveNumber % 10 === 0;
  const isMiniBossWave = waveNumber % 5 === 0 && !isBossWave;

  // Difficulty multiplier
  const mult = difficulty === 'casual' ? 0.8 : difficulty === 'heroic' ? 1.3 : difficulty === 'endless' ? 1.0 + waveNumber * 0.05 : 1.0;

  let currentTime = 0.5;

  const addGroup = (type: EnemyType, count: number, interval: number) => {
    for (let i = 0; i < count; i++) {
      const chosenPath = Math.floor(Math.random() * numPaths);
      spawns.push({
        type,
        pathIndex: chosenPath,
        spawnTime: currentTime,
      });
      currentTime += interval;
    }
    currentTime += 1.2; // pause between enemy groups
  };

  let title = `Wave ${waveNumber}`;

  if (waveNumber === 1) {
    title = 'Infiltration Vanguard';
    addGroup('scout', Math.round(10 * mult), 0.9);
  } else if (waveNumber === 2) {
    title = 'Infantry Column';
    addGroup('scout', Math.round(8 * mult), 0.8);
    addGroup('infantry', Math.round(8 * mult), 1.0);
  } else if (waveNumber === 3) {
    title = 'Swarm Rush';
    addGroup('swarm', Math.round(20 * mult), 0.35);
    addGroup('infantry', Math.round(10 * mult), 0.9);
  } else if (waveNumber === 4) {
    title = 'Heavy Iron Division';
    addGroup('infantry', Math.round(12 * mult), 0.8);
    addGroup('mech', Math.round(4 * mult), 1.8);
  } else if (waveNumber === 5) {
    title = 'Bio-Armor Surge';
    addGroup('scout', Math.round(12 * mult), 0.6);
    addGroup('regenerator', Math.round(3 * mult), 2.2);
    addGroup('mech', Math.round(5 * mult), 1.5);
  } else if (waveNumber === 6) {
    title = 'Phase Sprinters';
    addGroup('phantom', Math.round(10 * mult), 0.7);
    addGroup('swarm', Math.round(25 * mult), 0.3);
  } else if (waveNumber === 7) {
    title = 'Stealth Incursion';
    addGroup('stalker', Math.round(12 * mult), 0.85);
    addGroup('infantry', Math.round(14 * mult), 0.75);
  } else if (waveNumber === 8) {
    title = 'Shielded Phalanx';
    addGroup('colossus', Math.round(5 * mult), 2.0);
    addGroup('regenerator', Math.round(4 * mult), 1.8);
  } else if (waveNumber === 9) {
    title = 'Combined Arms Blitz';
    addGroup('swarm', Math.round(25 * mult), 0.28);
    addGroup('phantom', Math.round(12 * mult), 0.6);
    addGroup('mech', Math.round(8 * mult), 1.4);
    addGroup('colossus', Math.round(6 * mult), 1.9);
  } else if (waveNumber === 10) {
    title = 'Goliath Dreadnought Awakening';
    addGroup('infantry', Math.round(15 * mult), 0.7);
    addGroup('dreadnought', 1, 3.0);
    addGroup('regenerator', Math.round(5 * mult), 1.8);
    addGroup('colossus', Math.round(4 * mult), 2.0);
  } else {
    // Wave 11+ Procedural Scaling
    const baseCount = Math.floor(12 + waveNumber * 1.8 * mult);
    if (isBossWave) {
      title = `Dreadnought Armada (Wave ${waveNumber})`;
      const bossCount = Math.max(1, Math.floor(waveNumber / 10));
      addGroup('mech', Math.round(10 * mult), 1.0);
      addGroup('dreadnought', bossCount, 3.5);
      addGroup('colossus', Math.round(8 * mult), 1.5);
      addGroup('regenerator', Math.round(6 * mult), 1.5);
    } else if (isMiniBossWave) {
      title = `Elite Vanguard (Wave ${waveNumber})`;
      addGroup('colossus', Math.round(8 * mult), 1.4);
      addGroup('phantom', Math.round(16 * mult), 0.5);
      addGroup('regenerator', Math.round(6 * mult), 1.2);
    } else {
      const roll = waveNumber % 4;
      if (roll === 0) {
        title = `Armored Heavy Assault (${waveNumber})`;
        addGroup('mech', Math.round(baseCount * 0.4), 1.2);
        addGroup('colossus', Math.round(baseCount * 0.3), 1.5);
        addGroup('regenerator', Math.round(baseCount * 0.2), 1.8);
      } else if (roll === 1) {
        title = `Hyper Swarm Cluster (${waveNumber})`;
        addGroup('swarm', Math.round(baseCount * 1.8), 0.25);
        addGroup('phantom', Math.round(baseCount * 0.5), 0.6);
      } else if (roll === 2) {
        title = `Ghost Infiltration Line (${waveNumber})`;
        addGroup('stalker', Math.round(baseCount * 0.6), 0.7);
        addGroup('infantry', Math.round(baseCount * 0.6), 0.6);
        addGroup('colossus', Math.round(baseCount * 0.3), 1.8);
      } else {
        title = `Mixed Annihilation Force (${waveNumber})`;
        addGroup('scout', Math.round(baseCount * 0.5), 0.5);
        addGroup('mech', Math.round(baseCount * 0.4), 1.2);
        addGroup('phantom', Math.round(baseCount * 0.4), 0.7);
        addGroup('regenerator', Math.round(baseCount * 0.2), 1.5);
      }
    }
  }

  // Base wave clear reward
  const rewardGold = Math.round(45 + waveNumber * 12);

  return {
    waveNumber,
    totalEnemies: spawns.length,
    spawns,
    isBossWave: isBossWave || isMiniBossWave,
    rewardGold,
    title,
  };
}

export function getWavePreviewSummary(waveNumber: number, difficulty: Difficulty): { type: EnemyType; count: number }[] {
  const wave = generateWave(waveNumber, 1, difficulty);
  const counts: Record<string, number> = {};
  wave.spawns.forEach((s) => {
    counts[s.type] = (counts[s.type] || 0) + 1;
  });
  return Object.entries(counts).map(([type, count]) => ({
    type: type as EnemyType,
    count,
  }));
}

