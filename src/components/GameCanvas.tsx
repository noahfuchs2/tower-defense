import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TowerDefenseEngine } from '../game/engine';
import { renderGame } from '../game/renderer';
import { getPathOccupiedTiles, isCellBuildable } from '../game/pathUtils';
import { PlacedTower, TowerId, TacticalAbility } from '../game/types';
import { soundManager } from '../game/audio';

interface GameCanvasProps {
  engine: TowerDefenseEngine;
  selectedTowerToBuild: TowerId | null;
  activeTargetingAbility: TacticalAbility | null;
  onSelectTower: (tower: PlacedTower | null) => void;
  onTowerBuilt: () => void;
  onTriggerTargetedAbility: (abilityId: string, pos: { x: number; y: number }) => void;
  showGridLines: boolean;
  showDamageNumbers: boolean;
  screenShake: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  selectedTowerToBuild,
  activeTargetingAbility,
  onSelectTower,
  onTowerBuilt,
  onTriggerTargetedAbility,
  showGridLines,
  showDamageNumbers,
  screenShake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [canBuildAtHover, setCanBuildAtHover] = useState<boolean>(false);

  const pathTiles = React.useMemo(() => getPathOccupiedTiles(engine.map), [engine.map]);

  // Main Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // cap dt
      lastTime = currentTime;

      // Tick game state
      engine.tick(deltaTime);

      // Render frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();

          // Screen shake
          if (screenShake && engine.screenShakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * engine.screenShakeAmount;
            const shakeY = (Math.random() - 0.5) * engine.screenShakeAmount;
            ctx.translate(shakeX, shakeY);
          }

          renderGame({
            ctx,
            map: engine.map,
            precomputedPaths: engine.precomputedPaths,
            pathTiles,
            towers: engine.towers,
            enemies: engine.enemies,
            projectiles: engine.projectiles,
            particles: engine.particles,
            floatingTexts: engine.floatingTexts,
            lasers: engine.lasers,
            lightningArcs: engine.lightningArcs,
            selectedTower: engine.selectedTower,
            hoveredCell,
            selectedTowerToBuild,
            canBuildAtHover,
            targetingAbilityRadius: activeTargetingAbility?.radius || null,
            mousePos,
            gameTime: engine.gameTime,
            showGridLines,
            showDamageNumbers,
          });

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    engine,
    pathTiles,
    hoveredCell,
    selectedTowerToBuild,
    canBuildAtHover,
    activeTargetingAbility,
    mousePos,
    showGridLines,
    showDamageNumbers,
    screenShake,
  ]);

  // Convert client mouse coordinates to game map coordinates
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, cellX: 0, cellY: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const cellSize = engine.map.cellSize;
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);

      return { x, y, cellX, cellY };
    },
    [engine.map]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, cellX, cellY } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (cellX >= 0 && cellX < engine.map.gridCols && cellY >= 0 && cellY < engine.map.gridRows) {
      setHoveredCell({ x: cellX, y: cellY });
      const buildable = isCellBuildable(cellX, cellY, engine.map, pathTiles, engine.towers);
      setCanBuildAtHover(buildable);
    } else {
      setHoveredCell(null);
      setCanBuildAtHover(false);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
    setCanBuildAtHover(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    soundManager.resume();
    const { x, y, cellX, cellY } = getCanvasCoords(e);

    // 1. If targeting an active commander ability (e.g. Orbital Strike)
    if (activeTargetingAbility) {
      onTriggerTargetedAbility(activeTargetingAbility.id, { x, y });
      return;
    }

    // 2. If trying to build a selected tower
    if (selectedTowerToBuild) {
      if (canBuildAtHover) {
        const success = engine.buildTower(cellX, cellY, selectedTowerToBuild);
        if (success) {
          onTowerBuilt();
          onSelectTower(engine.selectedTower);
        }
      }
      return;
    }

    // 3. Check if clicking on an existing tower
    const clickedTower = engine.towers.find((t) => t.gridX === cellX && t.gridY === cellY);
    if (clickedTower) {
      engine.selectedTower = clickedTower;
      onSelectTower(clickedTower);
      soundManager.playUpgrade();
    } else {
      // Clicked on empty terrain -> deselect
      engine.selectedTower = null;
      onSelectTower(null);
    }
  };

  const canvasWidth = engine.map.gridCols * engine.map.cellSize;
  const canvasHeight = engine.map.gridRows * engine.map.cellSize;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden bg-slate-950/60"
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="w-full max-w-5xl aspect-[12/7] object-contain rounded-xl shadow-2xl border border-slate-800/80 cursor-crosshair bg-slate-950"
      />
    </div>
  );
};
