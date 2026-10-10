import { PathPoint, MapData } from './types';

export interface PrecomputedPath {
  points: { x: number; y: number }[]; // pixel coords
  segmentLengths: number[];
  totalLength: number;
}

export function precomputePaths(map: MapData): PrecomputedPath[] {
  const cellSize = map.cellSize;
  return map.paths.map((gridPath) => {
    const points = gridPath.map((p) => ({
      x: (p.x + 0.5) * cellSize,
      y: (p.y + 0.5) * cellSize,
    }));

    const segmentLengths: number[] = [];
    let totalLength = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.hypot(dx, dy);
      segmentLengths.push(len);
      totalLength += len;
    }

    return { points, segmentLengths, totalLength };
  });
}

export function getPositionAlongPath(
  path: PrecomputedPath,
  distance: number
): { x: number; y: number; vx: number; vy: number; finished: boolean } {
  if (distance >= path.totalLength) {
    const last = path.points[path.points.length - 1];
    return { x: last.x, y: last.y, vx: 1, vy: 0, finished: true };
  }

  let accumulated = 0;
  for (let i = 0; i < path.segmentLengths.length; i++) {
    const segLen = path.segmentLengths[i];
    if (accumulated + segLen >= distance) {
      const segDistance = distance - accumulated;
      const t = segLen > 0 ? segDistance / segLen : 0;
      const p1 = path.points[i];
      const p2 = path.points[i + 1];

      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;

      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
      const vx = (p2.x - p1.x) / len;
      const vy = (p2.y - p1.y) / len;

      return { x, y, vx, vy, finished: false };
    }
    accumulated += segLen;
  }

  const last = path.points[path.points.length - 1];
  return { x: last.x, y: last.y, vx: 1, vy: 0, finished: true };
}

/**
 * Returns a 2D boolean set for whether a grid cell is occupied by a path line.
 */
export function getPathOccupiedTiles(map: MapData): Set<string> {
  const occupied = new Set<string>();

  map.paths.forEach((path) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];

      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          occupied.add(`${x},${y}`);
        }
      }
    }
  });

  return occupied;
}

export function isCellBuildable(
  x: number,
  y: number,
  map: MapData,
  pathTiles: Set<string>,
  towers: { gridX: number; gridY: number }[]
): boolean {
  if (x < 0 || x >= map.gridCols || y < 0 || y >= map.gridRows) return false;
  if (pathTiles.has(`${x},${y}`)) return false;

  const hasObstacle = map.obstacles.some((o) => o.x === x && o.y === y);
  if (hasObstacle) return false;

  const hasTower = towers.some((t) => t.gridX === x && t.gridY === y);
  if (hasTower) return false;

  return true;
}
