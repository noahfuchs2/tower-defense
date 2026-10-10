export type TargetingPriority = 'FIRST' | 'LAST' | 'STRONGEST' | 'WEAKEST' | 'FASTEST' | 'CLOSEST';

export type TowerId = 'gatling' | 'plasma' | 'cryo' | 'tesla' | 'laser' | 'railgun';

export type SpecializationId = 
  | 'hyper_velocity' 
  | 'armor_piercing' 
  | 'napalm_core' 
  | 'shockwave_mortar'
  | 'deep_freeze' 
  | 'cryo_vulnerability'
  | 'chain_overload' 
  | 'emp_discharge'
  | 'prismatic_splinter' 
  | 'thermal_meltdown'
  | 'hyper_pierce' 
  | 'critical_overdrive';

export interface SpecializationDef {
  id: SpecializationId;
  name: string;
  description: string;
  cost: number;
  bonusDamage?: number;
  bonusRange?: number;
  bonusFireRate?: number;
}

export interface TowerDef {
  id: TowerId;
  name: string;
  role: string;
  description: string;
  cost: number;
  range: number; // in pixels
  fireRate: number; // attacks per second
  damage: number;
  damageType: 'kinetic' | 'explosive' | 'energy' | 'cryo' | 'electric';
  color: string;
  accentColor: string;
  bulletSpeed: number; // 0 for instant hit (laser/railgun)
  splashRadius: number; // 0 for single target
  chainCount?: number;
  slowEffect?: { factor: number; duration: number };
  upgradeCosts: [number, number]; // cost for Lvl 2 and Lvl 3
  specializations: [SpecializationDef, SpecializationDef];
}

export interface PlacedTower {
  id: string;
  towerId: TowerId;
  gridX: number;
  gridY: number;
  x: number; // pixel center x
  y: number; // pixel center y
  level: 1 | 2 | 3;
  specialization?: SpecializationId;
  targeting: TargetingPriority;
  totalDamageDealt: number;
  kills: number;
  lastFiredAt: number;
  currentAngle: number; // turret rotation in radians
  recoil: number; // visual recoil animation 0..1
  targetEnemyId?: string; // for continuous beams like laser
  totalInvestedCost: number;
}

export type EnemyType = 
  | 'scout' 
  | 'infantry' 
  | 'mech' 
  | 'swarm' 
  | 'regenerator' 
  | 'phantom' 
  | 'colossus' 
  | 'dreadnought' 
  | 'stalker';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  description: string;
  maxHealth: number;
  speed: number; // pixels per second
  armor: number; // damage reduction percentage 0..0.7
  shield: number; // temporary extra hit points
  maxShield?: number;
  goldReward: number;
  scoreReward: number;
  size: number; // radius in pixels
  color: string;
  borderColor: string;
  isBoss?: boolean;
  canCloak?: boolean;
  healsAllies?: boolean;
}

export interface StatusEffect {
  type: 'slow' | 'freeze' | 'burn' | 'armor_shred' | 'vulnerable';
  magnitude: number;
  expiresAt: number;
}

export interface ActiveEnemy {
  id: string;
  type: EnemyType;
  pathIndex: number; // which path branch (for split maps)
  distanceTravelled: number; // along path
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  baseSpeed: number;
  armor: number;
  goldReward: number;
  scoreReward: number;
  size: number;
  color: string;
  borderColor: string;
  statusEffects: StatusEffect[];
  isBoss?: boolean;
  isCloaked?: boolean;
  lastRegenAt: number;
}

export interface Projectile {
  id: string;
  sourceTowerId: string;
  towerType: TowerId;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetEnemyId?: string;
  speed: number;
  damage: number;
  splashRadius: number;
  damageType: 'kinetic' | 'explosive' | 'energy' | 'cryo' | 'electric';
  slowEffect?: { factor: number; duration: number };
  color: string;
  burnDoT?: boolean;
  armorShred?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0..1 remaining
  decay: number; // reduction per second
  alpha: number;
  shape?: 'circle' | 'square' | 'line' | 'ring';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface MapData {
  id: string;
  name: string;
  subtitle: string;
  difficultyRating: string;
  description: string;
  gridCols: number;
  gridRows: number;
  cellSize: number;
  paths: PathPoint[][]; // array of waypoints in grid coordinates
  obstacles: { x: number; y: number }[]; // grid coordinates
  buildableOverrides?: { x: number; y: number }[];
  backgroundColor: string;
  pathColor: string;
  pathBorderColor: string;
  gridLineColor: string;
  obstacleColor: string;
  theme: 'canyon' | 'nexus' | 'obsidian';
}

export type AbilityId = 'orbital_strike' | 'cryo_stasis' | 'overcharge' | 'supply_drop';

export interface TacticalAbility {
  id: AbilityId;
  name: string;
  description: string;
  hotkey: string;
  cooldownSeconds: number;
  currentCooldown: number; // 0 when ready
  durationSeconds?: number;
  activeRemaining?: number;
  targetType: 'targeted' | 'instant';
  radius?: number; // for targeted
}

export type Difficulty = 'casual' | 'normal' | 'heroic' | 'endless';

export interface GameSettings {
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
  showDamageNumbers: boolean;
  screenShake: boolean;
  showGridLines: boolean;
  autoStartNextWave: boolean;
}

export interface GameStats {
  score: number;
  wavesCleared: number;
  totalKills: number;
  goldEarned: number;
  damageDealt: number;
  towersBuilt: number;
  abilitiesUsed: number;
}
