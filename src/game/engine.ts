import {
  MapData,
  PlacedTower,
  ActiveEnemy,
  EnemyType,
  Projectile,
  Particle,
  FloatingText,
  TowerId,
  Difficulty,
  TacticalAbility,
  GameStats,
  SpecializationId,
  TargetingPriority,
} from './types';
import { TOWER_DEFINITIONS, ENEMY_DEFINITIONS, INITIAL_TACTICAL_ABILITIES } from './constants';
import { precomputePaths, getPositionAlongPath, PrecomputedPath } from './pathUtils';
import { generateWave, WaveInfo } from './waveManager';
import { soundManager } from './audio';
import { LaserBeamRender, LightningArcRender } from './renderer';

export type GameStatus = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER' | 'VICTORY';
export type WavePhase = 'WAITING_TO_START' | 'SPAWNING' | 'CLEARING' | 'COMPLETED';

export class TowerDefenseEngine {
  public map: MapData;
  public precomputedPaths: PrecomputedPath[];
  public status: GameStatus = 'TITLE_MENU';
  public difficulty: Difficulty = 'normal';
  public wavePhase: WavePhase = 'WAITING_TO_START';

  // Player stats & currency
  public lives: number = 20;
  public maxLives: number = 20;
  public credits: number = 350;
  public currentWave: number = 0;
  public totalWavesForVictory: number = 20;

  // Entities
  public towers: PlacedTower[] = [];
  public enemies: ActiveEnemy[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public lasers: LaserBeamRender[] = [];
  public lightningArcs: LightningArcRender[] = [];
  public tacticalAbilities: TacticalAbility[] = [];

  // Wave runtime
  public currentWaveInfo: WaveInfo | null = null;
  public waveElapsedTime: number = 0;
  public autoStartNextWave: boolean = false;
  public autoStartCountdown: number = 0;

  // Game loop controls
  public speedMultiplier: number = 1; // 1, 2, 4
  public gameTime: number = 0;
  public screenShakeAmount: number = 0;

  // Selected state
  public selectedTower: PlacedTower | null = null;
  public selectedTowerToBuild: TowerId | null = null;
  public activeTargetingAbility: TacticalAbility | null = null;

  // Statistics
  public stats: GameStats = {
    score: 0,
    wavesCleared: 0,
    totalKills: 0,
    goldEarned: 350,
    damageDealt: 0,
    towersBuilt: 0,
    abilitiesUsed: 0,
  };

  private idCounter: number = 0;

  constructor(map: MapData, difficulty: Difficulty = 'normal') {
    this.map = map;
    this.difficulty = difficulty;
    this.precomputedPaths = precomputePaths(map);
    this.reset(map, difficulty);
  }

  public reset(map: MapData, difficulty: Difficulty = 'normal') {
    this.map = map;
    this.difficulty = difficulty;
    this.precomputedPaths = precomputePaths(map);
    this.status = 'PLAYING';
    this.wavePhase = 'WAITING_TO_START';

    const baseLives = difficulty === 'casual' ? 30 : difficulty === 'heroic' ? 12 : 20;
    this.lives = baseLives;
    this.maxLives = baseLives;
    this.credits = difficulty === 'casual' ? 450 : difficulty === 'heroic' ? 300 : 350;
    this.currentWave = 0;
    this.totalWavesForVictory = difficulty === 'endless' ? 999 : 20;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.lasers = [];
    this.lightningArcs = [];
    this.tacticalAbilities = JSON.parse(JSON.stringify(INITIAL_TACTICAL_ABILITIES));

    this.currentWaveInfo = null;
    this.waveElapsedTime = 0;
    this.autoStartCountdown = 0;
    this.gameTime = 0;
    this.screenShakeAmount = 0;
    this.selectedTower = null;
    this.selectedTowerToBuild = null;
    this.activeTargetingAbility = null;

    this.stats = {
      score: 0,
      wavesCleared: 0,
      totalKills: 0,
      goldEarned: this.credits,
      damageDealt: 0,
      towersBuilt: 0,
      abilitiesUsed: 0,
    };
  }

  public startNextWave(): boolean {
    if (this.wavePhase !== 'WAITING_TO_START' && this.wavePhase !== 'COMPLETED') {
      return false;
    }

    // Early start bonus if timer was counting down
    if (this.autoStartCountdown > 0) {
      const earlyBonus = Math.round(this.autoStartCountdown * 3);
      if (earlyBonus > 0) {
        this.credits += earlyBonus;
        this.stats.goldEarned += earlyBonus;
        this.addFloatingText(this.map.cellSize * 3, 40, `+${earlyBonus} Early Bonus!`, '#fbbf24');
      }
    }

    this.currentWave += 1;
    this.currentWaveInfo = generateWave(this.currentWave, this.precomputedPaths.length, this.difficulty);
    this.waveElapsedTime = 0;
    this.wavePhase = 'SPAWNING';
    this.autoStartCountdown = 0;

    soundManager.playWaveStart();
    return true;
  }

  public tick(deltaTime: number) {
    if (this.status !== 'PLAYING') return;

    // Apply speed multiplier
    const dt = deltaTime * this.speedMultiplier;
    this.gameTime += dt;

    if (this.screenShakeAmount > 0) {
      this.screenShakeAmount = Math.max(0, this.screenShakeAmount - dt * 25);
    }

    // 1. Update Abilities Cooldowns
    this.updateAbilities(dt);

    // 2. Wave Spawning & Progression
    this.updateWave(dt);

    // 3. Update Enemies
    this.updateEnemies(dt);

    // 4. Update Towers & Firing
    this.updateTowers(dt);

    // 5. Update Projectiles
    this.updateProjectiles(dt);

    // 6. Update Particles & Floating Text
    this.updateParticles(dt);
  }

  private updateAbilities(dt: number) {
    this.tacticalAbilities.forEach((ability) => {
      if (ability.currentCooldown > 0) {
        ability.currentCooldown = Math.max(0, ability.currentCooldown - dt);
      }
      if (ability.activeRemaining && ability.activeRemaining > 0) {
        ability.activeRemaining = Math.max(0, ability.activeRemaining - dt);
      }
    });
  }

  public triggerAbility(id: string, targetPos?: { x: number; y: number }): boolean {
    const ability = this.tacticalAbilities.find((a) => a.id === id);
    if (!ability || ability.currentCooldown > 0) return false;

    if (ability.id === 'orbital_strike') {
      if (!targetPos) return false;
      // Strike blast
      const blastRadius = ability.radius || 90;
      this.screenShakeAmount = 14;
      soundManager.playTacticalAbility('orbital_strike');

      // Explode particles
      this.createExplosionParticles(targetPos.x, targetPos.y, '#ef4444', 35);
      this.particles.push({
        id: `ring-${this.nextId()}`,
        x: targetPos.x,
        y: targetPos.y,
        vx: 0,
        vy: 0,
        color: '#ef4444',
        size: blastRadius,
        life: 1,
        decay: 1.5,
        alpha: 1,
        shape: 'ring',
      });

      // Damage enemies in radius
      this.enemies.forEach((enemy) => {
        const dist = Math.hypot(enemy.x - targetPos.x, enemy.y - targetPos.y);
        if (dist <= blastRadius) {
          this.applyDamageToEnemy(enemy, 500, 'explosive');
        }
      });

      this.addFloatingText(targetPos.x, targetPos.y - 20, 'ORBITAL IMPACT', '#ef4444');
    } else if (ability.id === 'cryo_stasis') {
      soundManager.playTacticalAbility('cryo_stasis');
      this.enemies.forEach((enemy) => {
        enemy.statusEffects.push({
          type: 'freeze',
          magnitude: 1.0,
          expiresAt: this.gameTime + 4.0,
        });
        this.createExplosionParticles(enemy.x, enemy.y, '#22d3ee', 6);
      });
      this.addFloatingText(this.map.cellSize * 12, this.map.cellSize * 7, 'CRYO STASIS ACTIVATED', '#22d3ee');
    } else if (ability.id === 'overcharge') {
      soundManager.playTacticalAbility('overcharge');
      ability.activeRemaining = ability.durationSeconds || 8;
      this.towers.forEach((tower) => {
        this.createExplosionParticles(tower.x, tower.y, '#f59e0b', 8);
      });
      this.addFloatingText(this.map.cellSize * 12, this.map.cellSize * 7, 'TOWERS OVERCHARGED (+45% HASTE)', '#f59e0b');
    } else if (ability.id === 'supply_drop') {
      soundManager.playTacticalAbility('supply_drop');
      this.credits += 150;
      this.stats.goldEarned += 150;
      this.lives = Math.min(this.maxLives, this.lives + 2);
      this.addFloatingText(this.map.cellSize * 12, this.map.cellSize * 7, '+150 CREDITS · +2 LIVES REPAIRED', '#22c55e');
    }

    ability.currentCooldown = ability.cooldownSeconds;
    this.stats.abilitiesUsed += 1;
    this.activeTargetingAbility = null;
    return true;
  }

  private updateWave(dt: number) {
    if (this.wavePhase === 'SPAWNING' && this.currentWaveInfo) {
      this.waveElapsedTime += dt;

      // Check spawns
      const pendingSpawns = this.currentWaveInfo.spawns.filter(
        (s) => s.spawnTime <= this.waveElapsedTime
      );

      pendingSpawns.forEach((spawn) => {
        this.spawnEnemy(spawn.type, spawn.pathIndex);
      });

      // Remove spawned
      this.currentWaveInfo.spawns = this.currentWaveInfo.spawns.filter(
        (s) => s.spawnTime > this.waveElapsedTime
      );

      if (this.currentWaveInfo.spawns.length === 0) {
        this.wavePhase = 'CLEARING';
      }
    } else if (this.wavePhase === 'CLEARING') {
      if (this.enemies.length === 0) {
        this.handleWaveCompleted();
      }
    } else if (this.wavePhase === 'COMPLETED' && this.autoStartNextWave) {
      this.autoStartCountdown -= dt;
      if (this.autoStartCountdown <= 0) {
        this.startNextWave();
      }
    }
  }

  private handleWaveCompleted() {
    this.wavePhase = 'COMPLETED';
    this.stats.wavesCleared += 1;

    // Award wave clear bonus
    const waveReward = this.currentWaveInfo?.rewardGold || 50;
    this.credits += waveReward;
    this.stats.goldEarned += waveReward;
    soundManager.playWaveVictory();

    this.addFloatingText(
      this.map.cellSize * 12,
      this.map.cellSize * 6,
      `WAVE ${this.currentWave} CLEARED! +${waveReward} CREDITS`,
      '#22c55e'
    );

    // Check Victory
    if (this.currentWave >= this.totalWavesForVictory && this.difficulty !== 'endless') {
      this.status = 'VICTORY';
      return;
    }

    if (this.autoStartNextWave) {
      this.autoStartCountdown = 5.0; // 5 seconds until next wave
    }
  }

  private spawnEnemy(type: EnemyType, pathIndex: number) {
    const def = ENEMY_DEFINITIONS[type];
    if (!def) return;

    const path = this.precomputedPaths[pathIndex] || this.precomputedPaths[0];
    const initialPos = getPositionAlongPath(path, 0);

    // Difficulty and wave scaling
    const hpScale = 1.0 + (this.currentWave - 1) * 0.12;

    const enemy: ActiveEnemy = {
      id: `enemy-${this.nextId()}`,
      type,
      pathIndex,
      distanceTravelled: 0,
      x: initialPos.x,
      y: initialPos.y,
      vx: initialPos.vx,
      vy: initialPos.vy,
      health: Math.round(def.maxHealth * hpScale),
      maxHealth: Math.round(def.maxHealth * hpScale),
      shield: def.shield ? Math.round(def.shield * hpScale) : 0,
      maxShield: def.shield ? Math.round(def.shield * hpScale) : 0,
      baseSpeed: def.speed,
      armor: def.armor,
      goldReward: def.goldReward,
      scoreReward: def.scoreReward,
      size: def.size,
      color: def.color,
      borderColor: def.borderColor,
      statusEffects: [],
      isBoss: def.isBoss,
      isCloaked: def.canCloak,
      lastRegenAt: this.gameTime,
    };

    this.enemies.push(enemy);
  }

  private updateEnemies(dt: number) {
    const toRemoveIds = new Set<string>();

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const path = this.precomputedPaths[enemy.pathIndex] || this.precomputedPaths[0];

      // Update status effects (slow, freeze, burn)
      enemy.statusEffects = enemy.statusEffects.filter((s) => s.expiresAt > this.gameTime);

      let currentSpeed = enemy.baseSpeed;
      let isFrozen = false;

      enemy.statusEffects.forEach((status) => {
        if (status.type === 'freeze') {
          isFrozen = true;
        } else if (status.type === 'slow') {
          currentSpeed *= 1 - status.magnitude;
        } else if (status.type === 'burn') {
          // Burn DoT
          const burnDamage = status.magnitude * dt;
          enemy.health -= burnDamage;
          this.stats.damageDealt += burnDamage;
        }
      });

      // Regenerator ability: regenerates and heals nearby creeps
      if (enemy.type === 'regenerator' && this.gameTime - enemy.lastRegenAt >= 1.0) {
        enemy.lastRegenAt = this.gameTime;
        enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.maxHealth * 0.05);

        // Heal nearby allies within 80px
        this.enemies.forEach((other) => {
          if (other.id !== enemy.id && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 80) {
            other.health = Math.min(other.maxHealth, other.health + other.maxHealth * 0.04);
            this.createExplosionParticles(other.x, other.y, '#22c55e', 2);
          }
        });
      }

      // Check cloaking reveal
      if (enemy.isCloaked && enemy.distanceTravelled > path.totalLength * 0.45) {
        enemy.isCloaked = false;
      }

      if (!isFrozen) {
        enemy.distanceTravelled += currentSpeed * dt;
      }

      // Check if dead from burn or prior attacks
      if (enemy.health <= 0) {
        this.handleEnemyDefeated(enemy);
        toRemoveIds.add(enemy.id);
        continue;
      }

      // Check if enemy reached Base Core
      const pos = getPositionAlongPath(path, enemy.distanceTravelled);
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.vx = pos.vx;
      enemy.vy = pos.vy;

      if (pos.finished) {
        // Base damage
        const damageToLives = enemy.isBoss ? 5 : 1;
        this.lives -= damageToLives;
        this.screenShakeAmount = enemy.isBoss ? 16 : 8;
        soundManager.playExplosion('small');
        this.addFloatingText(enemy.x, enemy.y, `-${damageToLives} HP`, '#ef4444');

        toRemoveIds.add(enemy.id);

        if (this.lives <= 0) {
          this.lives = 0;
          this.status = 'GAME_OVER';
          soundManager.playGameOver();
          return;
        }
      }
    }

    if (toRemoveIds.size > 0) {
      this.enemies = this.enemies.filter((e) => !toRemoveIds.has(e.id));
    }
  }

  private handleEnemyDefeated(enemy: ActiveEnemy) {
    this.credits += enemy.goldReward;
    this.stats.goldEarned += enemy.goldReward;
    this.stats.score += enemy.scoreReward;
    this.stats.totalKills += 1;

    soundManager.playEnemyDeath();
    this.createExplosionParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 40 : 14);
    this.addFloatingText(enemy.x, enemy.y - 10, `+${enemy.goldReward}`, '#38bdf8');
  }

  private updateTowers(dt: number) {
    this.lasers = [];
    this.lightningArcs = [];

    const isOvercharged = (this.tacticalAbilities.find((a) => a.id === 'overcharge')?.activeRemaining || 0) > 0;
    const overchargeHaste = isOvercharged ? 1.45 : 1.0;
    const overchargeRange = isOvercharged ? 1.25 : 1.0;

    this.towers.forEach((tower) => {
      const def = TOWER_DEFINITIONS[tower.towerId];
      if (!def) return;

      // Visual recoil reduction
      if (tower.recoil > 0) {
        tower.recoil = Math.max(0, tower.recoil - dt * 6);
      }

      // Effective stats with upgrades
      let effectiveRange = def.range * (1 + (tower.level - 1) * 0.15) * overchargeRange;
      let effectiveFireRate = def.fireRate * (1 + (tower.level - 1) * 0.2) * overchargeHaste;
      let effectiveDamage = def.damage * (1 + (tower.level - 1) * 0.35);

      if (tower.specialization === 'hyper_velocity') {
        effectiveFireRate *= 1.6;
        effectiveRange += 20;
      } else if (tower.specialization === 'armor_piercing') {
        effectiveDamage += 18;
      } else if (tower.specialization === 'napalm_core') {
        effectiveDamage += 25;
      } else if (tower.specialization === 'shockwave_mortar') {
        effectiveRange += 25;
      } else if (tower.specialization === 'chain_overload') {
        effectiveRange += 35;
      } else if (tower.specialization === 'critical_overdrive') {
        effectiveDamage += 95;
      }

      // Find targets in range
      const validTargets = this.enemies.filter((enemy) => {
        if (enemy.isCloaked) return false;
        const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
        return dist <= effectiveRange;
      });

      if (validTargets.length === 0) {
        tower.targetEnemyId = undefined;
        return;
      }

      // Sort targets based on priority
      const primaryTarget = this.pickTarget(validTargets, tower);
      if (!primaryTarget) return;

      // Aim turret towards target
      const targetAngle = Math.atan2(primaryTarget.y - tower.y, primaryTarget.x - tower.x);
      tower.currentAngle = targetAngle;
      tower.targetEnemyId = primaryTarget.id;

      // Laser Sentinel: Continuous focused beam
      if (tower.towerId === 'laser') {
        const tickInterval = 1 / effectiveFireRate;
        if (this.gameTime - tower.lastFiredAt >= tickInterval) {
          tower.lastFiredAt = this.gameTime;
          this.applyDamageToEnemy(primaryTarget, effectiveDamage, 'energy', tower);
          soundManager.playLaserPulse();
        }

        // Render primary beam
        this.lasers.push({
          startX: tower.x + Math.cos(targetAngle) * 12,
          startY: tower.y + Math.sin(targetAngle) * 12,
          targetX: primaryTarget.x,
          targetY: primaryTarget.y,
          color: def.color,
          width: 2.5,
        });

        // Prismatic Splinter: Split to 2 additional nearby targets
        if (tower.specialization === 'prismatic_splinter') {
          const secondaries = validTargets.filter((e) => e.id !== primaryTarget.id).slice(0, 2);
          secondaries.forEach((sec) => {
            this.lasers.push({
              startX: tower.x + Math.cos(targetAngle) * 12,
              startY: tower.y + Math.sin(targetAngle) * 12,
              targetX: sec.x,
              targetY: sec.y,
              color: '#f472b6',
              width: 1.5,
            });
            this.applyDamageToEnemy(sec, effectiveDamage * 0.6, 'energy', tower);
          });
        }
        return;
      }

      // Discharging Weapons (Gatling, Plasma, Cryo, Tesla, Railgun)
      const fireCooldown = 1 / effectiveFireRate;
      if (this.gameTime - tower.lastFiredAt >= fireCooldown) {
        tower.lastFiredAt = this.gameTime;
        tower.recoil = 1.0;

        if (tower.towerId === 'gatling') {
          soundManager.playGatlingShot();
          this.spawnProjectile(tower, primaryTarget, effectiveDamage, def.bulletSpeed, 0, 'kinetic');
        } else if (tower.towerId === 'plasma') {
          soundManager.playPlasmaMortar();
          this.spawnProjectile(
            tower,
            primaryTarget,
            effectiveDamage,
            def.bulletSpeed,
            def.splashRadius + (tower.specialization === 'shockwave_mortar' ? 16 : 0),
            'explosive',
            undefined,
            tower.specialization === 'napalm_core'
          );
        } else if (tower.towerId === 'cryo') {
          soundManager.playCryoChime();
          const slowFactor = tower.specialization === 'deep_freeze' ? 0.65 : 0.45;
          this.spawnProjectile(
            tower,
            primaryTarget,
            effectiveDamage,
            def.bulletSpeed,
            def.splashRadius,
            'cryo',
            { factor: slowFactor, duration: 2.5 }
          );
        } else if (tower.towerId === 'tesla') {
          soundManager.playTeslaArc();
          this.fireTeslaLightning(tower, primaryTarget, effectiveDamage, validTargets);
        } else if (tower.towerId === 'railgun') {
          soundManager.playRailgun();
          this.fireRailgunBeam(tower, primaryTarget, effectiveDamage, effectiveRange);
        }
      }
    });
  }

  private pickTarget(targets: ActiveEnemy[], tower: PlacedTower): ActiveEnemy {
    switch (tower.targeting) {
      case 'FIRST':
        return targets.reduce((best, curr) => (curr.distanceTravelled > best.distanceTravelled ? curr : best), targets[0]);
      case 'LAST':
        return targets.reduce((best, curr) => (curr.distanceTravelled < best.distanceTravelled ? curr : best), targets[0]);
      case 'STRONGEST':
        return targets.reduce((best, curr) => (curr.health > best.health ? curr : best), targets[0]);
      case 'WEAKEST':
        return targets.reduce((best, curr) => (curr.health < best.health ? curr : best), targets[0]);
      case 'FASTEST':
        return targets.reduce((best, curr) => (curr.baseSpeed > best.baseSpeed ? curr : best), targets[0]);
      case 'CLOSEST':
      default:
        return targets.reduce((best, curr) => {
          const distCurr = Math.hypot(curr.x - tower.x, curr.y - tower.y);
          const distBest = Math.hypot(best.x - tower.x, best.y - tower.y);
          return distCurr < distBest ? curr : best;
        }, targets[0]);
    }
  }

  private spawnProjectile(
    tower: PlacedTower,
    target: ActiveEnemy,
    damage: number,
    speed: number,
    splashRadius: number,
    damageType: 'kinetic' | 'explosive' | 'energy' | 'cryo' | 'electric',
    slowEffect?: { factor: number; duration: number },
    burnDoT?: boolean
  ) {
    const def = TOWER_DEFINITIONS[tower.towerId];
    this.projectiles.push({
      id: `proj-${this.nextId()}`,
      sourceTowerId: tower.id,
      towerType: tower.towerId,
      x: tower.x,
      y: tower.y,
      startX: tower.x,
      startY: tower.y,
      targetX: target.x,
      targetY: target.y,
      targetEnemyId: target.id,
      speed,
      damage,
      splashRadius,
      damageType,
      slowEffect,
      color: def?.color || '#38bdf8',
      burnDoT,
      armorShred: tower.specialization === 'armor_piercing',
    });
  }

  private fireTeslaLightning(
    tower: PlacedTower,
    primaryTarget: ActiveEnemy,
    damage: number,
    allValidTargets: ActiveEnemy[]
  ) {
    const maxChains = tower.specialization === 'chain_overload' ? 6 : 3;
    const hitEnemies: ActiveEnemy[] = [primaryTarget];
    let lastPoint = { x: tower.x, y: tower.y };

    this.lightningArcs.push({
      startX: lastPoint.x,
      startY: lastPoint.y,
      targetX: primaryTarget.x,
      targetY: primaryTarget.y,
      color: '#c084fc',
    });

    this.applyDamageToEnemy(primaryTarget, damage, 'electric', tower);
    lastPoint = { x: primaryTarget.x, y: primaryTarget.y };

    // Chain to subsequent enemies
    while (hitEnemies.length < maxChains) {
      const remaining = allValidTargets.filter((e) => !hitEnemies.includes(e));
      if (remaining.length === 0) break;

      // Find closest enemy to lastPoint
      let closest: ActiveEnemy | null = null;
      let closestDist = Infinity;
      remaining.forEach((e) => {
        const d = Math.hypot(e.x - lastPoint.x, e.y - lastPoint.y);
        if (d < 120 && d < closestDist) {
          closestDist = d;
          closest = e;
        }
      });

      if (!closest) break;

      hitEnemies.push(closest);
      this.lightningArcs.push({
        startX: lastPoint.x,
        startY: lastPoint.y,
        targetX: (closest as ActiveEnemy).x,
        targetY: (closest as ActiveEnemy).y,
        color: '#e9d5ff',
      });

      const chainFalloff = Math.pow(0.85, hitEnemies.length - 1);
      this.applyDamageToEnemy(closest, damage * chainFalloff, 'electric', tower);
      lastPoint = { x: (closest as ActiveEnemy).x, y: (closest as ActiveEnemy).y };
    }
  }

  private fireRailgunBeam(
    tower: PlacedTower,
    primaryTarget: ActiveEnemy,
    damage: number,
    range: number
  ) {
    const angle = Math.atan2(primaryTarget.y - tower.y, primaryTarget.x - tower.x);
    const endX = tower.x + Math.cos(angle) * range;
    const endY = tower.y + Math.sin(angle) * range;

    this.lasers.push({
      startX: tower.x,
      startY: tower.y,
      targetX: endX,
      targetY: endY,
      color: '#fbbf24',
      width: 4.5,
    });

    // Check all enemies that intersect the beam line
    this.enemies.forEach((enemy) => {
      const distToLine = this.distancePointToSegment(enemy.x, enemy.y, tower.x, tower.y, endX, endY);
      if (distToLine <= enemy.size + 8) {
        let railDamage = damage;
        if (tower.specialization === 'critical_overdrive' && (enemy.health >= enemy.maxHealth * 0.8 || enemy.isBoss)) {
          railDamage *= 2.5;
          this.addFloatingText(enemy.x, enemy.y - 12, 'CRIT!', '#facc15');
        }
        this.applyDamageToEnemy(enemy, railDamage, 'kinetic', tower);
      }
    });

    this.screenShakeAmount = 5;
  }

  private distancePointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  private updateProjectiles(dt: number) {
    const toRemove = new Set<string>();

    this.projectiles.forEach((p) => {
      // Find current position of target if tracked
      const targetEnemy = this.enemies.find((e) => e.id === p.targetEnemyId);
      if (targetEnemy) {
        p.targetX = targetEnemy.x;
        p.targetY = targetEnemy.y;
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);
      const step = p.speed * dt;

      if (dist <= step || dist < 6) {
        // Projectile Impact!
        this.handleProjectileImpact(p);
        toRemove.add(p.id);
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    });

    if (toRemove.size > 0) {
      this.projectiles = this.projectiles.filter((p) => !toRemove.has(p.id));
    }
  }

  private handleProjectileImpact(p: Projectile) {
    const sourceTower = this.towers.find((t) => t.id === p.sourceTowerId);

    if (p.splashRadius > 0) {
      // Area of Effect Blast
      soundManager.playExplosion('small');
      this.createExplosionParticles(p.x, p.y, p.color, 18);

      this.particles.push({
        id: `blast-${this.nextId()}`,
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        color: p.color,
        size: p.splashRadius,
        life: 1,
        decay: 3.5,
        alpha: 0.6,
        shape: 'ring',
      });

      this.enemies.forEach((enemy) => {
        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (d <= p.splashRadius) {
          const falloff = 1 - (d / p.splashRadius) * 0.4;
          this.applyDamageToEnemy(enemy, p.damage * falloff, p.damageType, sourceTower);

          if (p.slowEffect) {
            this.applySlowToEnemy(enemy, p.slowEffect.factor, p.slowEffect.duration);
          }
          if (p.burnDoT) {
            enemy.statusEffects.push({
              type: 'burn',
              magnitude: 10,
              expiresAt: this.gameTime + 3.0,
            });
          }
        }
      });
    } else {
      // Direct Single-Target Hit
      const target = this.enemies.find((e) => e.id === p.targetEnemyId);
      if (target) {
        this.applyDamageToEnemy(target, p.damage, p.damageType, sourceTower);
        this.createExplosionParticles(target.x, target.y, p.color, 6);

        if (p.slowEffect) {
          this.applySlowToEnemy(target, p.slowEffect.factor, p.slowEffect.duration);
        }
      }
    }
  }

  private applyDamageToEnemy(
    enemy: ActiveEnemy,
    rawDamage: number,
    damageType: string,
    sourceTower?: PlacedTower
  ) {
    let finalDamage = rawDamage;

    // Cryo vulnerability bonus
    const isVulnerable = enemy.statusEffects.some((s) => s.type === 'vulnerable');
    if (isVulnerable) {
      finalDamage *= 1.3;
    }

    // Armor mitigation (kinetic/explosive reduced by armor, energy/electric bypass half armor)
    let effectiveArmor = enemy.armor;
    if (sourceTower?.specialization === 'armor_piercing' || sourceTower?.specialization === 'hyper_pierce') {
      effectiveArmor = 0;
    } else if (damageType === 'energy' || damageType === 'electric') {
      effectiveArmor *= 0.5;
    }

    finalDamage = Math.max(1, finalDamage * (1 - effectiveArmor));

    // Shield absorbs damage first
    if (enemy.shield > 0) {
      if (enemy.shield >= finalDamage) {
        enemy.shield -= finalDamage;
        finalDamage = 0;
      } else {
        finalDamage -= enemy.shield;
        enemy.shield = 0;
      }
    }

    enemy.health -= finalDamage;
    this.stats.damageDealt += finalDamage;

    if (sourceTower) {
      sourceTower.totalDamageDealt += finalDamage;
    }

    // Floating damage numbers
    if (finalDamage > 2) {
      this.addFloatingText(
        enemy.x + (Math.random() - 0.5) * 10,
        enemy.y - 10,
        Math.round(finalDamage).toString(),
        damageType === 'energy' ? '#f472b6' : damageType === 'cryo' ? '#67e8f9' : '#ffffff'
      );
    }

    // Thermal Meltdown check: Explodes on target death
    if (enemy.health <= 0 && sourceTower?.specialization === 'thermal_meltdown') {
      this.createExplosionParticles(enemy.x, enemy.y, '#f97316', 25);
      this.enemies.forEach((other) => {
        if (other.id !== enemy.id && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 70) {
          this.applyDamageToEnemy(other, 120, 'explosive', sourceTower);
        }
      });
    }

    if (enemy.health <= 0 && sourceTower) {
      sourceTower.kills += 1;
    }
  }

  private applySlowToEnemy(enemy: ActiveEnemy, factor: number, duration: number) {
    const existing = enemy.statusEffects.find((s) => s.type === 'slow');
    if (existing) {
      existing.magnitude = Math.max(existing.magnitude, factor);
      existing.expiresAt = Math.max(existing.expiresAt, this.gameTime + duration);
    } else {
      enemy.statusEffects.push({
        type: 'slow',
        magnitude: factor,
        expiresAt: this.gameTime + duration,
      });
    }
  }

  private updateParticles(dt: number) {
    this.particles.forEach((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= pt.decay * dt;
    });
    this.particles = this.particles.filter((pt) => pt.life > 0);

    this.floatingTexts.forEach((ft) => {
      ft.y += ft.vy * dt;
      ft.life -= dt * 1.5;
    });
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  private createExplosionParticles(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 90;
      this.particles.push({
        id: `pt-${this.nextId()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 3.5,
        life: 1.0,
        decay: 1.8 + Math.random() * 1.5,
        alpha: 0.9,
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: `ft-${this.nextId()}`,
      x,
      y,
      text,
      color,
      life: 1.0,
      vy: -25,
    });
  }

  // --- Tower Construction & Management ---

  public buildTower(gridX: number, gridY: number, towerId: TowerId): boolean {
    const def = TOWER_DEFINITIONS[towerId];
    if (!def) return false;
    if (this.credits < def.cost) return false;

    // Deduct cost
    this.credits -= def.cost;
    this.stats.towersBuilt += 1;

    const cellSize = this.map.cellSize;
    const tower: PlacedTower = {
      id: `tower-${this.nextId()}`,
      towerId,
      gridX,
      gridY,
      x: (gridX + 0.5) * cellSize,
      y: (gridY + 0.5) * cellSize,
      level: 1,
      targeting: 'FIRST',
      totalDamageDealt: 0,
      kills: 0,
      lastFiredAt: 0,
      currentAngle: -Math.PI / 2,
      recoil: 0,
      totalInvestedCost: def.cost,
    };

    this.towers.push(tower);
    this.selectedTower = tower;
    this.selectedTowerToBuild = null;
    soundManager.playBuild();
    this.createExplosionParticles(tower.x, tower.y, def.color, 12);

    return true;
  }

  public upgradeTower(tower: PlacedTower): boolean {
    if (tower.level >= 3) return false;
    const def = TOWER_DEFINITIONS[tower.towerId];
    if (!def) return false;

    const upgradeCost = def.upgradeCosts[tower.level - 1];
    if (this.credits < upgradeCost) return false;

    this.credits -= upgradeCost;
    tower.totalInvestedCost += upgradeCost;
    tower.level = (tower.level + 1) as 2 | 3;

    soundManager.playUpgrade();
    this.createExplosionParticles(tower.x, tower.y, '#38bdf8', 16);
    this.addFloatingText(tower.x, tower.y - 15, `LVL ${tower.level} UPGRADE!`, '#38bdf8');

    return true;
  }

  public specializeTower(tower: PlacedTower, specId: SpecializationId): boolean {
    if (tower.level < 3 || tower.specialization) return false;
    const def = TOWER_DEFINITIONS[tower.towerId];
    const spec = def.specializations.find((s) => s.id === specId);
    if (!spec || this.credits < spec.cost) return false;

    this.credits -= spec.cost;
    tower.totalInvestedCost += spec.cost;
    tower.specialization = specId;

    soundManager.playUpgrade();
    this.createExplosionParticles(tower.x, tower.y, '#fbbf24', 24);
    this.addFloatingText(tower.x, tower.y - 15, spec.name.toUpperCase(), '#fbbf24');

    return true;
  }

  public sellTower(tower: PlacedTower): boolean {
    const refund = Math.round(tower.totalInvestedCost * 0.75);
    this.credits += refund;
    this.towers = this.towers.filter((t) => t.id !== tower.id);
    if (this.selectedTower?.id === tower.id) {
      this.selectedTower = null;
    }

    soundManager.playSell();
    this.createExplosionParticles(tower.x, tower.y, '#94a3b8', 12);
    this.addFloatingText(tower.x, tower.y - 10, `+${refund} REFUND`, '#94a3b8');

    return true;
  }

  public setTowerTargeting(tower: PlacedTower, targeting: TargetingPriority) {
    tower.targeting = targeting;
  }

  private nextId(): number {
    this.idCounter += 1;
    return this.idCounter;
  }
}
