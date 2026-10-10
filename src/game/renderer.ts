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

  // Clear canvas with subtle radial backdrop gradient
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
  bgGrad.addColorStop(0, '#111827');
  bgGrad.addColorStop(1, map.backgroundColor);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 1. Draw Tactical Grid Background
  renderBackgroundGrid(rc);

  // 2. Draw Map Terrain & Stylized Paths with Energy Flow Arrows
  renderTerrain(rc);

  // 3. Draw Tactical Obstacles / Crags
  renderObstacles(rc);

  // 4. Draw Path Portals & Command Base Core
  renderEndpoints(rc);

  // 5. Draw Range Indicator for Selected Tower
  if (rc.selectedTower) {
    renderTowerRange(rc, rc.selectedTower.x, rc.selectedTower.y, rc.selectedTower);
  }

  // 6. Draw Placed Towers with High-Tech Mechanical Detailing
  rc.towers.forEach((tower) => {
    renderTower(rc, tower);
  });

  // 7. Draw Lightning Arcs & Laser Beams
  renderEnergyBeams(rc);

  // 8. Draw Projectiles
  renderProjectiles(rc);

  // 9. Draw Enemies & Detailed Health Bars
  rc.enemies.forEach((enemy) => {
    renderEnemy(rc, enemy);
  });

  // 10. Draw Particles & Explosions
  renderParticles(rc);

  // 11. Draw Floating Numbers with Currency Icons
  if (rc.showDamageNumbers) {
    renderFloatingTexts(rc);
  }

  // 12. Draw Build Preview / Hover Cursor
  renderBuildPreview(rc);

  // 13. Draw Tactical Ability Reticle
  renderAbilityReticle(rc);
}

function renderBackgroundGrid(rc: RenderContext) {
  const { ctx, map, showGridLines } = rc;
  const cellSize = map.cellSize;
  const width = map.gridCols * cellSize;
  const height = map.gridRows * cellSize;

  // Always draw subtle tactical corner crosshairs on buildable areas
  ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
  for (let x = 0; x < map.gridCols; x++) {
    for (let y = 0; y < map.gridRows; y++) {
      const px = x * cellSize;
      const py = y * cellSize;
      ctx.fillRect(px + 2, py + 2, 2, 2);
    }
  }

  if (showGridLines) {
    ctx.strokeStyle = map.gridLineColor || 'rgba(51, 65, 85, 0.25)';
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
}

function renderTerrain(rc: RenderContext) {
  const { ctx, map, precomputedPaths, gameTime } = rc;
  const cellSize = map.cellSize;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  precomputedPaths.forEach((path) => {
    if (path.points.length < 2) return;

    // Outer Foundation Track
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.lineWidth = cellSize * 0.95;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Roadway Kerb / Border Trim
    ctx.lineWidth = cellSize * 0.82;
    ctx.strokeStyle = map.pathBorderColor;
    ctx.stroke();

    // Main Asphalt / Metallic Trench
    ctx.lineWidth = cellSize * 0.70;
    ctx.strokeStyle = map.pathColor;
    ctx.stroke();

    // Inner Neon Guardrails
    ctx.lineWidth = cellSize * 0.65;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.stroke();

    // Animated Energy Flow Guideline
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 18]);
    ctx.lineDashOffset = -gameTime * 35;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.stroke();

    // Thin Center Laser Line
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.stroke();
  });
}

function renderObstacles(rc: RenderContext) {
  const { ctx, map, gameTime } = rc;
  const cellSize = map.cellSize;

  map.obstacles.forEach((obs, index) => {
    const x = obs.x * cellSize;
    const y = obs.y * cellSize;

    ctx.save();
    // Heavy Armored Barricade / Monolith Block
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 6);
    ctx.fill();

    // Metallic Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner Carbon Plate
    ctx.fillStyle = map.obstacleColor;
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 7, cellSize - 14, cellSize - 14, 4);
    ctx.fill();

    // Diagonal Warning Stripes
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 8, y + 8, cellSize - 16, cellSize - 16);
    ctx.clip();

    ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)'; // Amber hazard stripes
    ctx.lineWidth = 3;
    for (let i = -20; i < cellSize + 20; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + cellSize, y + cellSize);
      ctx.stroke();
    }
    ctx.restore();

    // Blinking Status LED on obstacles
    const ledPhase = Math.sin(gameTime * 2 + index);
    ctx.beginPath();
    ctx.arc(x + cellSize - 8, y + 8, 2, 0, Math.PI * 2);
    ctx.fillStyle = ledPhase > 0 ? '#ef4444' : '#7f1d1d';
    ctx.fill();

    ctx.restore();
  });
}

function renderEndpoints(rc: RenderContext) {
  const { ctx, precomputedPaths, gameTime } = rc;

  precomputedPaths.forEach((path) => {
    if (path.points.length < 2) return;
    const start = path.points[0];
    const end = path.points[path.points.length - 1];

    // 1. Hostile Infiltration Portal (Start)
    ctx.save();
    ctx.translate(start.x, start.y);

    // Outer rotating energy runes
    ctx.save();
    ctx.rotate(-gameTime * 1.8);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();

    // Second counter-rotating ring
    ctx.save();
    ctx.rotate(gameTime * 2.5);
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();

    // Inner Singularity Event Horizon
    const pulse = Math.sin(gameTime * 5) * 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // 2. Command Defense Citadel Core (End)
    ctx.save();
    ctx.translate(end.x, end.y);

    // Shimmering Hexagonal Force-Field Shield
    const shieldAngle = gameTime * 0.8;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = shieldAngle + (i * Math.PI) / 3;
      const rx = Math.cos(angle) * 21;
      const ry = Math.sin(angle) * 21;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
    ctx.stroke();

    // Heavy Citadel Base Bunker
    ctx.beginPath();
    ctx.roundRect(-13, -13, 26, 26, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Corner Reinforced Turret Studs
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-11, -11, 4, 4);
    ctx.fillRect(7, -11, 4, 4);
    ctx.fillRect(-11, 7, 4, 4);
    ctx.fillRect(7, 7, 4, 4);

    // Central Reactor Core with Rotating Energy Bars
    const corePulse = Math.sin(gameTime * 6) * 0.25 + 0.75;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${corePulse})`;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  });
}

function renderTower(rc: RenderContext, tower: PlacedTower) {
  const { ctx, map, gameTime } = rc;
  const def = TOWER_DEFINITIONS[tower.towerId];
  if (!def) return;

  const isSelected = rc.selectedTower?.id === tower.id;
  const baseRadius = map.cellSize * 0.44;

  ctx.save();
  ctx.translate(tower.x, tower.y);

  // 1. BASE FOUNDATION: Layered Heavy Gunmetal Mount
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + Math.PI / 8;
    const px = Math.cos(angle) * baseRadius;
    const py = Math.sin(angle) * baseRadius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = isSelected ? '#1e293b' : '#090d16';
  ctx.fill();

  // Outer Beveled Rim
  ctx.lineWidth = isSelected ? 3 : 1.8;
  ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
  ctx.stroke();

  // Corner Rivets/Bolts
  ctx.fillStyle = '#64748b';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const rx = Math.cos(angle) * (baseRadius - 3.5);
    const ry = Math.sin(angle) * (baseRadius - 3.5);
    ctx.beginPath();
    ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. TURNTABLE: Internal Circular Rotating Track with Circuit Inset
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Illuminated Power Track Ring
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.52, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${hexToRgb(def.color)}, 0.3)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3. LEVEL CHEVRONS / STATUS LIGHTS (Rendered on Base Mount)
  for (let i = 0; i < tower.level; i++) {
    const angle = -Math.PI / 2 + (i - (tower.level - 1) / 2) * 0.45;
    const cx = Math.cos(angle) * (baseRadius - 4);
    const cy = Math.sin(angle) * (baseRadius - 4);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = tower.specialization ? '#fbbf24' : '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // Elite Specialization Crown Icon if applied
  if (tower.specialization) {
    ctx.save();
    ctx.translate(0, baseRadius - 5);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(2.5, 2);
    ctx.lineTo(-2.5, 2);
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.restore();
  }

  // 4. WEAPON TURRET ASSEMBLY: Rotates toward target
  ctx.rotate(tower.currentAngle);

  // Mechanical Recoil Shift
  const recoilDist = tower.recoil * 5.5;

  switch (tower.towerId) {
    // -------------------------------------------------------------
    // VULCAN GATLING: 6 Spinning Minigun Barrels & Ammo Belt Box
    // -------------------------------------------------------------
    case 'gatling': {
      // Ammo Feed Magazine (Side mount)
      ctx.fillStyle = '#334155';
      ctx.fillRect(-8, -10, 7, 5);
      ctx.fillStyle = '#eab308'; // Brass ammo belt links
      ctx.fillRect(-7, -8, 5, 2);

      // Gun Body Chassis
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-recoilDist - 6, -6, 14, 12, 3);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Spinning 6-Barrel Assembly
      const barrelSpin = tower.targetEnemyId ? gameTime * 24 : 0;
      const barrelLength = 17;
      const barrelRadius = 4.5;

      ctx.save();
      ctx.translate(-recoilDist + 6, 0);

      // Draw the individual cylindrical barrels
      for (let i = 0; i < 6; i++) {
        const bAngle = barrelSpin + (i * Math.PI) / 3;
        const by = Math.sin(bAngle) * barrelRadius;
        const bx = Math.cos(bAngle) * 1.5;

        ctx.fillStyle = i % 2 === 0 ? '#94a3b8' : '#64748b';
        ctx.fillRect(bx, by - 1.2, barrelLength, 2.4);
      }

      // Front Muzzle Clamp Ring
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(barrelLength - 3, -barrelRadius - 1, 3, (barrelRadius + 1) * 2);
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(barrelLength - 3, -barrelRadius - 1, 3, (barrelRadius + 1) * 2);

      ctx.restore();

      // Central Hub Dome
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Muzzle Flash Flare on fire
      if (tower.recoil > 0.4) {
        ctx.save();
        ctx.translate(barrelLength + 8, 0);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    // -------------------------------------------------------------
    // PLASMA HOWITZER: Heavy Box Cannon with Glowing Heat Vents
    // -------------------------------------------------------------
    case 'plasma': {
      // Rear Heavy Counterweight
      ctx.fillStyle = '#431407';
      ctx.fillRect(-10 - recoilDist, -6, 6, 12);

      // Hydraulic Recoil Shock Pistons
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6 - recoilDist, -7, 10, 2.5);
      ctx.fillRect(-6 - recoilDist, 4.5, 10, 2.5);

      // Heavy Cannon Barrel
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-2 - recoilDist, -5, 18, 10, 2);
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Internal Glowing Superheated Plasma Chamber
      const heatPulse = Math.sin(gameTime * 8) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(249, 115, 22, ${heatPulse})`;
      ctx.fillRect(2 - recoilDist, -2.5, 10, 5);

      // Vented Muzzle Shroud
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(15 - recoilDist, -6.5, 4, 13);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(17 - recoilDist, -4, 2, 8);

      // Central Armor Shell
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.strokeStyle = '#ffedd5';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }

    // -------------------------------------------------------------
    // CRYO EMITTER: Floating Cryo Prism Crystal & Focus Prongs
    // -------------------------------------------------------------
    case 'cryo': {
      // Tri-focus Outer Prongs
      ctx.fillStyle = '#0e7490';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;

      for (let i = 0; i < 3; i++) {
        const pAngle = (i * Math.PI * 2) / 3;
        const px = Math.cos(pAngle) * 11;
        const py = Math.sin(pAngle) * 11;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Floating Sub-zero Core Crystal (independent gentle bobbing)
      const bob = Math.sin(gameTime * 4) * 2;
      ctx.save();
      ctx.translate(bob, 0);

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, -6.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 6.5);
      ctx.closePath();
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#a5f3fc';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Frost Core Spark
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------
    // ARC TESLA COIL: Tiered Induction Coils & Plasma Needle
    // -------------------------------------------------------------
    case 'tesla': {
      // Base Copper Toroid Ring
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fillStyle = '#581c87';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Secondary Copper Induction Torus
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7e22ce';
      ctx.fill();
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tesla Accelerator Rod
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(13, 0);
      ctx.stroke();

      // Terminal Plasma Sphere Node
      ctx.beginPath();
      ctx.arc(14, 0, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = '#d8b4fe';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Ambient Electric Micro-Arcs
      if (Math.random() < 0.6) {
        ctx.strokeStyle = '#f5d0fe';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(14 + (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        ctx.stroke();
      }
      break;
    }

    // -------------------------------------------------------------
    // LASER SENTINEL: Gimballed Optics Shroud with Ruby Focus Lens
    // -------------------------------------------------------------
    case 'laser': {
      // Lateral Heat Sink Fins
      ctx.fillStyle = '#831843';
      ctx.fillRect(-5, -9, 8, 2);
      ctx.fillRect(-5, 7, 8, 2);

      // Angular Precision Emitter Casing
      ctx.beginPath();
      ctx.moveTo(-6, -7);
      ctx.lineTo(12, -3);
      ctx.lineTo(14, 0);
      ctx.lineTo(12, 3);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ruby Optical Focus Crystal
      ctx.beginPath();
      ctx.arc(13, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#f472b6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Center Core
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#be185d';
      ctx.fill();
      break;
    }

    // -------------------------------------------------------------
    // HYPERION RAILGUN: Extended Magnetic Accelerator Rails
    // -------------------------------------------------------------
    case 'railgun': {
      // Rear High-Density Capacitor Banks
      ctx.fillStyle = '#713f12';
      ctx.fillRect(-10 - recoilDist, -6, 7, 12);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-9 - recoilDist, -4.5, 5, 9);

      // Long Twin Magnetic Rails
      ctx.fillStyle = '#334155';
      ctx.fillRect(0 - recoilDist, -4.5, 23, 2.5);
      ctx.fillRect(0 - recoilDist, 2, 23, 2.5);

      // Magnetic Flux Acceleration Rings (4 rings along barrel)
      for (let i = 0; i < 4; i++) {
        const rx = 3 + i * 5 - recoilDist;
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(rx, -6, 2.5, 12);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, -6, 2.5, 12);
      }

      // Central Breech Housing
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
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
  const { ctx, gameTime } = rc;
  let range = 120;

  if ('range' in towerOrDef) {
    range = towerOrDef.range;
  } else {
    const def = TOWER_DEFINITIONS[towerOrDef.towerId];
    if (def) {
      range = def.range * (1 + (towerOrDef.level - 1) * 0.15);
      if (
        towerOrDef.specialization === 'hyper_velocity' ||
        towerOrDef.specialization === 'shockwave_mortar' ||
        towerOrDef.specialization === 'chain_overload'
      ) {
        range += 20;
      }
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);

  // Soft Radial Range Fill
  const rangeGrad = ctx.createRadialGradient(x, y, range * 0.4, x, y, range);
  rangeGrad.addColorStop(0, isValid ? 'rgba(56, 189, 248, 0.03)' : 'rgba(239, 68, 68, 0.05)');
  rangeGrad.addColorStop(1, isValid ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.20)');
  ctx.fillStyle = rangeGrad;
  ctx.fill();

  // Animated Dashed Perimeter Ring
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -gameTime * 20;
  ctx.strokeStyle = isValid ? '#38bdf8' : '#ef4444';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function renderEnemy(rc: RenderContext, enemy: ActiveEnemy) {
  const { ctx, gameTime } = rc;

  // Stalker cloaking transparency
  if (enemy.isCloaked) {
    ctx.globalAlpha = 0.28;
  }

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Status effect aura (Frozen / Burning / Armor-shred)
  const isFrozen = enemy.statusEffects.some((s) => s.type === 'freeze' || s.type === 'slow');
  const isBurning = enemy.statusEffects.some((s) => s.type === 'burn');

  if (isFrozen) {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (isBurning) {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // 1. Shimmering Geodesic Shield Bubble
  if (enemy.shield > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = gameTime * 15;
    ctx.stroke();
    ctx.restore();
  }

  // 2. High-Fidelity Enemy Archetype Sprites
  const headingAngle = Math.atan2(enemy.vy, enemy.vx);
  ctx.rotate(headingAngle);

  switch (enemy.type) {
    // -------------------------------------------------------------
    // SCOUT DRONE: High-Speed Swept Wing Recon with Thruster Trail
    // -------------------------------------------------------------
    case 'scout': {
      // Plasma Thruster Flame
      const flameLen = 4 + Math.random() * 4;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-enemy.size, -2);
      ctx.lineTo(-enemy.size - flameLen, 0);
      ctx.lineTo(-enemy.size, 2);
      ctx.closePath();
      ctx.fill();

      // Swept Arrowhead Chassis
      ctx.beginPath();
      ctx.moveTo(enemy.size + 3, 0);
      ctx.lineTo(-enemy.size + 1, -enemy.size * 0.85);
      ctx.lineTo(-enemy.size * 0.4, 0);
      ctx.lineTo(-enemy.size + 1, enemy.size * 0.85);
      ctx.closePath();
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Glowing Cockpit Visor
      ctx.beginPath();
      ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      break;
    }

    // -------------------------------------------------------------
    // ASSAULT TROOPER: Quad-Legged Walking Robot
    // -------------------------------------------------------------
    case 'infantry': {
      // 4 Walking Robotic Legs
      const legStep = Math.sin(gameTime * 14) * 3;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(enemy.size * 0.7, -enemy.size - legStep);
      ctx.moveTo(0, 0);
      ctx.lineTo(enemy.size * 0.7, enemy.size + legStep);
      ctx.moveTo(0, 0);
      ctx.lineTo(-enemy.size * 0.7, -enemy.size + legStep);
      ctx.moveTo(0, 0);
      ctx.lineTo(-enemy.size * 0.7, enemy.size - legStep);
      ctx.stroke();

      // Armored Torso Pod
      ctx.beginPath();
      ctx.roundRect(-enemy.size * 0.7, -enemy.size * 0.7, enemy.size * 1.4, enemy.size * 1.4, 3);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Faction Optic Sensor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(enemy.size * 0.3, -2, 3, 4);
      break;
    }

    // -------------------------------------------------------------
    // HEAVY SIEGE MECH: Armored Tracked Walker with Armor Rivets
    // -------------------------------------------------------------
    case 'mech': {
      // Dual Reinforced Tank Treads
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-enemy.size, -enemy.size - 2, enemy.size * 2, 4);
      ctx.fillRect(-enemy.size, enemy.size - 2, enemy.size * 2, 4);

      // Heavy Armored Hull
      ctx.beginPath();
      ctx.roundRect(-enemy.size * 0.85, -enemy.size * 0.85, enemy.size * 1.7, enemy.size * 1.7, 4);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sloped Heavy Front Armor Plate
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, -enemy.size * 0.5, enemy.size * 0.7, enemy.size);

      // Cannon Barrel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(enemy.size * 0.4, -2, enemy.size * 0.8, 4);
      break;
    }

    // -------------------------------------------------------------
    // SWARM PARASITE: Twitching Alien Chitin Bug
    // -------------------------------------------------------------
    case 'swarm': {
      // 6 Skittering Insectoid Legs
      const legJitter = Math.sin(gameTime * 25) * 2;
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 1.5;

      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3, 0);
        ctx.lineTo(i * 4, -enemy.size - 2 + legJitter * i);
        ctx.moveTo(i * 3, 0);
        ctx.lineTo(i * 4, enemy.size + 2 - legJitter * i);
        ctx.stroke();
      }

      // Segmented Carapace
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Glowing Compound Eyes
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(enemy.size * 0.6, -2.5, 1.8, 0, Math.PI * 2);
      ctx.arc(enemy.size * 0.6, 2.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // -------------------------------------------------------------
    // BIO-REGENERATOR: Floating Nanite Pod with Pulsing Cross
    // -------------------------------------------------------------
    case 'regenerator': {
      // Rotating Medical Nanite Halo
      ctx.save();
      ctx.rotate(gameTime * 2);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Main Bioluminescent Pod
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bold Healing Cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -enemy.size * 0.65, 4, enemy.size * 1.3);
      ctx.fillRect(-enemy.size * 0.65, -2, enemy.size * 1.3, 4);
      break;
    }

    // -------------------------------------------------------------
    // GOLIATH DREADNOUGHT: Multi-Deck Flagship Boss Titan
    // -------------------------------------------------------------
    case 'dreadnought': {
      // Twin Heavy Reactor Exhaust Flames
      const bossFlame = 8 + Math.random() * 8;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-enemy.size - bossFlame, -8, bossFlame, 4);
      ctx.fillRect(-enemy.size - bossFlame, 4, bossFlame, 4);

      // Massive Multi-Section Hull
      ctx.beginPath();
      ctx.roundRect(-enemy.size, -enemy.size * 0.75, enemy.size * 2, enemy.size * 1.5, 6);
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Heavy Armor Mantlet
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-enemy.size * 0.6, -enemy.size * 0.55, enemy.size * 1.3, enemy.size * 1.1);

      // Hazard Warning Chevrons
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-enemy.size * 0.4, -3, enemy.size * 0.8, 6);

      // Rotating Radar / Bridge Radome
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#991b1b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Heavy Twin Turret Barrels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(enemy.size * 0.7, -7, 10, 3.5);
      ctx.fillRect(enemy.size * 0.7, 3.5, 10, 3.5);
      break;
    }

    // -------------------------------------------------------------
    // DEFAULT/OTHER (Phantom, Colossus, Stalker)
    // -------------------------------------------------------------
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(enemy.size * 0.4, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1.0;

  // 3. Crisp High-Contrast Health Bar Above Enemy
  const barWidth = Math.max(26, enemy.size * 2.2);
  const barHeight = 4.5;
  const barX = enemy.x - barWidth / 2;
  const barY = enemy.y - enemy.size - 9;

  // Background Track
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  // Health Fill with Gradient
  const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
  ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  // Shield Bar Layer (Rendered immediately above HP bar if shielded)
  if (enemy.shield > 0 && enemy.maxShield && enemy.maxShield > 0) {
    const shieldPercent = Math.min(1, enemy.shield / enemy.maxShield);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(barX - 1, barY - 4, barWidth + 2, 3);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(barX, barY - 3.5, barWidth * shieldPercent, 2);
  }
}

function renderEnergyBeams(rc: RenderContext) {
  const { ctx, lasers, lightningArcs } = rc;

  // 1. Continuous Laser Beams
  lasers.forEach((beam) => {
    ctx.save();
    // Broad Outer Bloom Glow
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = beam.width * 2.8;
    ctx.beginPath();
    ctx.moveTo(beam.startX, beam.startY);
    ctx.lineTo(beam.targetX, beam.targetY);
    ctx.stroke();

    // Sharp Inner White Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = beam.width * 0.9;
    ctx.beginPath();
    ctx.moveTo(beam.startX, beam.startY);
    ctx.lineTo(beam.targetX, beam.targetY);
    ctx.stroke();

    // Target Impact Heat Sizzle
    ctx.beginPath();
    ctx.arc(beam.targetX, beam.targetY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  });

  // 2. Procedural Lightning Arcs (Tesla Coil)
  lightningArcs.forEach((arc) => {
    ctx.save();
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 3;

    const dx = arc.targetX - arc.startX;
    const dy = arc.targetY - arc.startY;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(dist / 14));

    ctx.beginPath();
    ctx.moveTo(arc.startX, arc.startY);

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const normalX = -dy / dist;
      const normalY = dx / dist;
      const jitter = (Math.random() - 0.5) * 16;

      const px = arc.startX + dx * t + normalX * jitter;
      const py = arc.startY + dy * t + normalY * jitter;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(arc.targetX, arc.targetY);
    ctx.stroke();

    // Pure White Inner Filament
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  });
}

function renderProjectiles(rc: RenderContext) {
  const { ctx, projectiles } = rc;

  projectiles.forEach((p) => {
    ctx.save();
    if (p.towerType === 'plasma') {
      // High-Temperature Plasma Orb
      const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 7);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, p.color);
      grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.towerType === 'gatling') {
      // Kinetic Tracer Bullet
      const angle = Math.atan2(p.targetY - p.startY, p.targetX - p.startX);
      ctx.translate(p.x, p.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-6, -1.5, 12, 3);
      ctx.fillStyle = p.color;
      ctx.fillRect(-10, -1, 6, 2);
    } else if (p.towerType === 'cryo') {
      // Sub-zero Ice Shard
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
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
      ctx.lineWidth = 2.5;
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
  ctx.textAlign = 'left';

  floatingTexts.forEach((ft) => {
    ctx.globalAlpha = Math.max(0, ft.life);

    // If it's a gold reward (starts with "+"), draw a gold coin icon before text!
    if (ft.text.startsWith('+') && ft.color.includes('38bdf8')) {
      // Gold Coin Glyph
      const coinRadius = 4.5;
      ctx.beginPath();
      ctx.arc(ft.x - 7, ft.y - 4, coinRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.fillText(ft.text, ft.x, ft.y);
    } else {
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
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

  // Range preview circle
  renderTowerRange(rc, px, py, def, canBuildAtHover);

  // Cell Highlight Box with Cybernetic Corners
  ctx.save();
  ctx.fillStyle = canBuildAtHover ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.3)';
  ctx.strokeStyle = canBuildAtHover ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(hoveredCell.x * cellSize + 2, hoveredCell.y * cellSize + 2, cellSize - 4, cellSize - 4, 5);
  ctx.fill();
  ctx.stroke();

  // Ghost Turret Preview
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.arc(px, py, cellSize * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = def.color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function renderAbilityReticle(rc: RenderContext) {
  const { ctx, targetingAbilityRadius, mousePos, gameTime } = rc;
  if (!targetingAbilityRadius) return;

  ctx.save();
  ctx.translate(mousePos.x, mousePos.y);

  // Outer Crosshair Radar Sweep
  ctx.beginPath();
  ctx.arc(0, 0, targetingAbilityRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.lineDashOffset = gameTime * 35;
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair Target Lines
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-targetingAbilityRadius - 12, 0);
  ctx.lineTo(targetingAbilityRadius + 12, 0);
  ctx.moveTo(0, -targetingAbilityRadius - 12);
  ctx.lineTo(0, targetingAbilityRadius + 12);
  ctx.stroke();

  // Central Lock-On Pip
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
