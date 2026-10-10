import {
  MapData,
  PlacedTower,
  ActiveEnemy,
  Projectile,
  Particle,
  FloatingText,
  TowerId,
  TowerDef,
} from './types';
import { TOWER_DEFINITIONS } from './constants';
import { PrecomputedPath } from './pathUtils';

export interface LaserBeamRender {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  width: number;
}

export interface LightningArcRender {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  map: MapData;
  precomputedPaths: PrecomputedPath[];
  pathTiles: Set<string>;
  towers: PlacedTower[];
  enemies: ActiveEnemy[];
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  lasers: LaserBeamRender[];
  lightningArcs: LightningArcRender[];
  selectedTower: PlacedTower | null;
  hoveredCell: { x: number; y: number } | null;
  selectedTowerToBuild: TowerId | null;
  canBuildAtHover: boolean;
  targetingAbilityRadius: number | null;
  mousePos: { x: number; y: number };
  gameTime: number;
  showGridLines: boolean;
  showDamageNumbers: boolean;
}

export function renderGame(rc: RenderContext) {
  const { ctx, map } = rc;
  const width = map.gridCols * map.cellSize;
  const height = map.gridRows * map.cellSize;

  // Clear canvas
  ctx.fillStyle = map.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 1. Draw Map Terrain & Paths
  renderTerrain(rc);

  // 2. Draw Obstacles
  renderObstacles(rc);

  // 3. Draw Path Portals & Core Base
  renderEndpoints(rc);

  // 4. Draw Grid Lines
  if (rc.showGridLines) {
    renderGridLines(rc);
  }

  // 5. Draw Range Indicator for Selected Tower
  if (rc.selectedTower) {
    renderTowerRange(rc, rc.selectedTower.x, rc.selectedTower.y, rc.selectedTower);
  }

  // 6. Draw Placed Towers
  rc.towers.forEach((tower) => {
    renderTower(rc, tower);
  });

  // 7. Draw Lightning Arcs & Laser Beams
  renderEnergyBeams(rc);

  // 8. Draw Projectiles
  renderProjectiles(rc);

  // 9. Draw Enemies & Health Bars
  rc.enemies.forEach((enemy) => {
    renderEnemy(rc, enemy);
  });

  // 10. Draw Particles
  renderParticles(rc);

  // 11. Draw Floating Numbers
  if (rc.showDamageNumbers) {
    renderFloatingTexts(rc);
  }

  // 12. Draw Build Preview / Hover Cursor
  renderBuildPreview(rc);

  // 13. Draw Tactical Ability Reticle
  renderAbilityReticle(rc);
}

function renderTerrain(rc: RenderContext) {
  const { ctx, map, precomputedPaths } = rc;
  const cellSize = map.cellSize;

  // Draw path ribbons
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  precomputedPaths.forEach((path) => {
    if (path.points.length < 2) return;

    // Path Outer Glow/Border
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.lineWidth = cellSize * 0.85;
    ctx.strokeStyle = map.pathBorderColor;
    ctx.stroke();

    // Path Center Fill
    ctx.lineWidth = cellSize * 0.72;
    ctx.strokeStyle = map.pathColor;
    ctx.stroke();

    // Inner Lane Guideline
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -rc.gameTime * 25;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function renderObstacles(rc: RenderContext) {
  const { ctx, map } = rc;
  const cellSize = map.cellSize;

  map.obstacles.forEach((obs) => {
    const x = obs.x * cellSize;
    const y = obs.y * cellSize;

    // Draw stylized rock/barrier block
    ctx.fillStyle = map.obstacleColor;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, cellSize - 8, cellSize - 8, 6);
    ctx.fill();

    // Highlight edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner detail cross hatch
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 10);
    ctx.lineTo(x + cellSize - 10, y + cellSize - 10);
    ctx.stroke();
  });
}

function renderEndpoints(rc: RenderContext) {
  const { ctx, precomputedPaths, gameTime } = rc;

  precomputedPaths.forEach((path) => {
    if (path.points.length < 2) return;
    const start = path.points[0];
    const end = path.points[path.points.length - 1];

    // 1. Spawn Portal (Start)
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(gameTime * 1.5);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444'; // Red portal
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pulse core
    const pulse = Math.sin(gameTime * 4) * 3;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fill();
    ctx.restore();

    // 2. Command Bunker / Base Core (End)
    ctx.save();
    ctx.translate(end.x, end.y);

    // Core protective shield ring
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.strokeStyle = '#06b6d4'; // Cyan shield
    ctx.lineWidth = 2;
    ctx.stroke();

    // Core Bunker Base
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 4);
    ctx.fillStyle = '#0e7490';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Core Reactor Light
    const reactorGlow = Math.sin(gameTime * 5) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${reactorGlow})`;
    ctx.fill();

    ctx.restore();
  });
}

function renderGridLines(rc: RenderContext) {
  const { ctx, map } = rc;
  const cellSize = map.cellSize;
  const width = map.gridCols * cellSize;
  const height = map.gridRows * cellSize;

  ctx.strokeStyle = map.gridLineColor;
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = 0; x <= width; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
}

function renderTower(rc: RenderContext, tower: PlacedTower) {
  const { ctx, map } = rc;
  const def = TOWER_DEFINITIONS[tower.towerId];
  if (!def) return;

  const isSelected = rc.selectedTower?.id === tower.id;
  const size = map.cellSize * 0.42;

  ctx.save();
  ctx.translate(tower.x, tower.y);

  // Tower Base Platform (Hexagon / Rounded Octagon)
  ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();

  // Platform Rim Ring
  ctx.lineWidth = isSelected ? 2.5 : 1.5;
  ctx.strokeStyle = isSelected ? '#38bdf8' : def.color;
  ctx.stroke();

  // Level Indicators (Dots/Chevrons at top of base)
  for (let i = 0; i < tower.level; i++) {
    const angle = -Math.PI / 2 + (i - (tower.level - 1) / 2) * 0.45;
    const px = Math.cos(angle) * (size - 4);
    const py = Math.sin(angle) * (size - 4);
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = tower.specialization ? '#fbbf24' : '#38bdf8';
    ctx.fill();
  }

  // Turret Weapon Mount (Rotates to aim at target)
  ctx.rotate(tower.currentAngle);

  // Recoil offset
  const recoilOffset = tower.recoil * 4;

  switch (tower.towerId) {
    case 'gatling':
      // Twin barrels
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-recoilOffset + 2, -5, 14, 3);
      ctx.fillRect(-recoilOffset + 2, 2, 14, 3);
      // Central gun housing
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      break;

    case 'plasma':
      // Heavy wide cannon barrel
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-recoilOffset + 2, -4.5, 15, 9);
      // Muzzle brake shroud
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(-recoilOffset + 13, -6, 4, 12);
      // Central dome
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      break;

    case 'cryo':
      // Central spinning crystal
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -6);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Frost emitter vents
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0891b2';
      ctx.fill();
      break;

    case 'tesla':
      // Electric coil spheres
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#9333ea';
      ctx.fill();
      // Tesla antenna rod
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
      // Tip emitter node
      ctx.beginPath();
      ctx.arc(13, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#f3e8ff';
      ctx.fill();
      break;

    case 'laser':
      // Sleek angular emitter shroud
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(12, -2);
      ctx.lineTo(12, 2);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fill();
      // Ruby focus lens
      ctx.beginPath();
      ctx.arc(13, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f472b6';
      ctx.fill();
      break;

    case 'railgun':
      // Extended magnetic rails
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-recoilOffset + 2, -4, 20, 2);
      ctx.fillRect(-recoilOffset + 2, 2, 20, 2);
      // Capacitor rings
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-recoilOffset + 6, -5, 3, 10);
      ctx.fillRect(-recoilOffset + 12, -5, 3, 10);
      // Housing
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      break;
  }

  ctx.restore();
}

function renderTowerRange(
  rc: RenderContext,
  x: number,
  y: number,
  towerOrDef: PlacedTower | TowerDef,
  isValid: boolean = true
) {
  const { ctx } = rc;
  let range = 120;

  if ('range' in towerOrDef) {
    range = towerOrDef.range;
  } else {
    const def = TOWER_DEFINITIONS[towerOrDef.towerId];
    if (def) {
      range = def.range * (1 + (towerOrDef.level - 1) * 0.15);
      if (towerOrDef.specialization === 'hyper_velocity' || towerOrDef.specialization === 'shockwave_mortar' || towerOrDef.specialization === 'chain_overload') {
        range += 20;
      }
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);

  // Fill
  ctx.fillStyle = isValid ? 'rgba(56, 189, 248, 0.08)' : 'rgba(239, 68, 68, 0.12)';
  ctx.fill();

  // Border
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = isValid ? 'rgba(56, 189, 248, 0.5)' : 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function renderEnemy(rc: RenderContext, enemy: ActiveEnemy) {
  const { ctx, gameTime } = rc;

  // Stalker cloaking transparency
  if (enemy.isCloaked) {
    ctx.globalAlpha = 0.25;
  }

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Status effect aura (Frozen or Burning)
  const isFrozen = enemy.statusEffects.some((s) => s.type === 'freeze' || s.type === 'slow');
  const isBurning = enemy.statusEffects.some((s) => s.type === 'burn');

  if (isFrozen) {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (isBurning) {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw Shield Bubble if active
  if (enemy.shield > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fill();
  }

  // Draw Enemy Body according to archetype
  ctx.fillStyle = enemy.color;
  ctx.strokeStyle = enemy.borderColor;
  ctx.lineWidth = 1.5;

  if (enemy.type === 'scout') {
    // Aerodynamic wedge
    const angle = Math.atan2(enemy.vy, enemy.vx);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(enemy.size + 2, 0);
    ctx.lineTo(-enemy.size, -enemy.size * 0.7);
    ctx.lineTo(-enemy.size * 0.5, 0);
    ctx.lineTo(-enemy.size, enemy.size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.type === 'swarm') {
    // Spiky insectoid
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.type === 'mech') {
    // Heavy square chassis
    ctx.beginPath();
    ctx.roundRect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2, 4);
    ctx.fill();
    ctx.stroke();
    // Inner plating
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-enemy.size * 0.5, -enemy.size * 0.5, enemy.size, enemy.size);
  } else if (enemy.type === 'regenerator') {
    // Green bio-pod with cross
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Healing pulse cross
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, -enemy.size * 0.6, 3, enemy.size * 1.2);
    ctx.fillRect(-enemy.size * 0.6, -1.5, enemy.size * 1.2, 3);
  } else if (enemy.type === 'dreadnought') {
    // Massive multi-angle boss dreadnought
    ctx.beginPath();
    ctx.roundRect(-enemy.size, -enemy.size * 0.8, enemy.size * 2, enemy.size * 1.6, 6);
    ctx.fill();
    ctx.stroke();

    // Warning hazard stripes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-enemy.size * 0.7, -4, enemy.size * 1.4, 8);

    // Glowing core
    const bossGlow = Math.sin(gameTime * 6) * 0.2 + 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${bossGlow})`;
    ctx.fill();
  } else {
    // Standard circular body
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalAlpha = 1.0;

  // Render Health Bar Above Enemy
  const barWidth = Math.max(22, enemy.size * 2);
  const barHeight = 4;
  const barX = enemy.x - barWidth / 2;
  const barY = enemy.y - enemy.size - 8;

  // Background track
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Health fill
  const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
  ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  // Shield bar above health bar if shielded
  if (enemy.shield > 0 && enemy.maxShield > 0) {
    const shieldPercent = Math.min(1, enemy.shield / enemy.maxShield);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(barX, barY - 3, barWidth * shieldPercent, 2);
  }
}

function renderEnergyBeams(rc: RenderContext) {
  const { ctx, lasers, lightningArcs } = rc;

  // 1. Continuous Laser Beams
  lasers.forEach((beam) => {
    ctx.save();
    // Outer colored glow
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = beam.width * 2.2;
    ctx.beginPath();
    ctx.moveTo(beam.startX, beam.startY);
    ctx.lineTo(beam.targetX, beam.targetY);
    ctx.stroke();

    // Inner bright white beam core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = beam.width * 0.8;
    ctx.beginPath();
    ctx.moveTo(beam.startX, beam.startY);
    ctx.lineTo(beam.targetX, beam.targetY);
    ctx.stroke();

    // Target impact flare
    ctx.beginPath();
    ctx.arc(beam.targetX, beam.targetY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  });

  // 2. Procedural Lightning Arcs (Tesla Coil)
  lightningArcs.forEach((arc) => {
    ctx.save();
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 2.5;

    const dx = arc.targetX - arc.startX;
    const dy = arc.targetY - arc.startY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(dist / 16));

    ctx.beginPath();
    ctx.moveTo(arc.startX, arc.startY);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const normalX = -dy / dist;
      const normalY = dx / dist;
      const jitter = (Math.random() - 0.5) * 14;

      const px = arc.startX + dx * t + normalX * jitter;
      const py = arc.startY + dy * t + normalY * jitter;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(arc.targetX, arc.targetY);
    ctx.stroke();

    // White core line
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });
}

function renderProjectiles(rc: RenderContext) {
  const { ctx, projectiles } = rc;

  projectiles.forEach((p) => {
    ctx.save();
    if (p.towerType === 'plasma') {
      // Glowing plasma energy orb
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = '#ffedd5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (p.towerType === 'gatling') {
      // Kinetic tracer bullet
      const angle = Math.atan2(p.targetY - p.startY, p.targetX - p.startX);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-5, -1.5, 10, 3);
    } else if (p.towerType === 'cryo') {
      // Ice crystal bolt
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fill();
    }
    ctx.restore();
  });
}

function renderParticles(rc: RenderContext) {
  const { ctx, particles } = rc;

  particles.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.alpha * pt.life);
    ctx.fillStyle = pt.color;

    if (pt.shape === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (1 - pt.life + 0.2), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(1, pt.size * pt.life), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
  ctx.globalAlpha = 1.0;
}

function renderFloatingTexts(rc: RenderContext) {
  const { ctx, floatingTexts } = rc;

  ctx.save();
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  floatingTexts.forEach((ft) => {
    ctx.globalAlpha = Math.max(0, ft.life);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  });

  ctx.restore();
  ctx.globalAlpha = 1.0;
}

function renderBuildPreview(rc: RenderContext) {
  const { ctx, map, hoveredCell, selectedTowerToBuild, canBuildAtHover } = rc;
  if (!selectedTowerToBuild || !hoveredCell) return;

  const def = TOWER_DEFINITIONS[selectedTowerToBuild];
  if (!def) return;

  const cellSize = map.cellSize;
  const px = (hoveredCell.x + 0.5) * cellSize;
  const py = (hoveredCell.y + 0.5) * cellSize;

  // Range preview
  renderTowerRange(rc, px, py, def, canBuildAtHover);

  // Cell highlight box
  ctx.save();
  ctx.fillStyle = canBuildAtHover ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.35)';
  ctx.strokeStyle = canBuildAtHover ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(hoveredCell.x * cellSize + 2, hoveredCell.y * cellSize + 2, cellSize - 4, cellSize - 4, 4);
  ctx.fill();
  ctx.stroke();

  // Ghost tower icon
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(px, py, cellSize * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = def.color;
  ctx.fill();
  ctx.restore();
}

function renderAbilityReticle(rc: RenderContext) {
  const { ctx, targetingAbilityRadius, mousePos, gameTime } = rc;
  if (!targetingAbilityRadius) return;

  ctx.save();
  ctx.translate(mousePos.x, mousePos.y);

  // Outer crosshair circle
  ctx.beginPath();
  ctx.arc(0, 0, targetingAbilityRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.lineDashOffset = gameTime * 30;
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair lines
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-targetingAbilityRadius - 10, 0);
  ctx.lineTo(targetingAbilityRadius + 10, 0);
  ctx.moveTo(0, -targetingAbilityRadius - 10);
  ctx.lineTo(0, targetingAbilityRadius + 10);
  ctx.stroke();

  // Center target pip
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  ctx.restore();
}
