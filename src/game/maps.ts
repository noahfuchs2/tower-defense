import { MapData } from './types';

export const MAPS: MapData[] = [
  {
    id: 'iron_ridge',
    name: 'Iron Ridge',
    subtitle: 'Classic Martian Gorge',
    difficultyRating: 'Normal',
    description: 'A winding canyon through jagged iron oxide cliffs. Features two sharp hairpins and prime choke points for splash artillery.',
    gridCols: 24,
    gridRows: 14,
    cellSize: 40,
    theme: 'canyon',
    backgroundColor: '#0f172a', // slate-900
    pathColor: '#1e293b', // slate-800
    pathBorderColor: '#334155',
    gridLineColor: 'rgba(51, 65, 85, 0.25)',
    obstacleColor: '#475569',
    paths: [
      [
        { x: 0, y: 3 },
        { x: 6, y: 3 },
        { x: 6, y: 10 },
        { x: 13, y: 10 },
        { x: 13, y: 3 },
        { x: 19, y: 3 },
        { x: 19, y: 8 },
        { x: 23, y: 8 },
      ],
    ],
    obstacles: [
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 6 }, { x: 3, y: 6 },
      { x: 9, y: 1 }, { x: 10, y: 1 }, { x: 9, y: 6 }, { x: 10, y: 6 },
      { x: 16, y: 5 }, { x: 16, y: 6 }, { x: 16, y: 11 }, { x: 17, y: 11 },
      { x: 22, y: 2 }, { x: 22, y: 3 }, { x: 22, y: 11 }, { x: 22, y: 12 },
    ],
  },
  {
    id: 'dual_nexus',
    name: 'Dual Nexus',
    subtitle: 'Converging Attack Vectors',
    difficultyRating: 'Challenging',
    description: 'Hostile forces attack from Northern and Southern corridors, merging into a unified kill-box corridor before reaching the Core.',
    gridCols: 24,
    gridRows: 14,
    cellSize: 40,
    theme: 'nexus',
    backgroundColor: '#09131f',
    pathColor: '#13283e',
    pathBorderColor: '#1e40af',
    gridLineColor: 'rgba(30, 64, 175, 0.2)',
    obstacleColor: '#1e3a5f',
    paths: [
      // North Path
      [
        { x: 0, y: 2 },
        { x: 7, y: 2 },
        { x: 7, y: 6 },
        { x: 14, y: 6 },
        { x: 14, y: 7 },
        { x: 23, y: 7 },
      ],
      // South Path
      [
        { x: 0, y: 11 },
        { x: 7, y: 11 },
        { x: 7, y: 8 },
        { x: 14, y: 8 },
        { x: 14, y: 7 },
        { x: 23, y: 7 },
      ],
    ],
    obstacles: [
      { x: 3, y: 5 }, { x: 3, y: 6 }, { x: 3, y: 7 }, { x: 3, y: 8 },
      { x: 10, y: 1 }, { x: 11, y: 1 }, { x: 10, y: 12 }, { x: 11, y: 12 },
      { x: 18, y: 3 }, { x: 19, y: 3 }, { x: 18, y: 11 }, { x: 19, y: 11 },
      { x: 14, y: 3 }, { x: 14, y: 11 },
    ],
  },
  {
    id: 'obsidian_gauntlet',
    name: 'Obsidian Citadel',
    subtitle: 'Multi-Switchback Gauntlet',
    difficultyRating: 'Hardcore',
    description: 'A protracted zigzag labyrinth bordered by volcanic obsidian spires. Enemies have high endurance; every tile must be maximized.',
    gridCols: 24,
    gridRows: 14,
    cellSize: 40,
    theme: 'obsidian',
    backgroundColor: '#0c0a09', // stone-950
    pathColor: '#292524', // stone-800
    pathBorderColor: '#78350f', // amber-900
    gridLineColor: 'rgba(120, 53, 15, 0.25)',
    obstacleColor: '#44403c',
    paths: [
      [
        { x: 0, y: 1 },
        { x: 17, y: 1 },
        { x: 17, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 9 },
        { x: 20, y: 9 },
        { x: 20, y: 12 },
        { x: 23, y: 12 },
      ],
    ],
    obstacles: [
      { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 },
      { x: 12, y: 3 }, { x: 13, y: 3 }, { x: 22, y: 3 }, { x: 22, y: 4 },
      { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 },
      { x: 15, y: 7 }, { x: 16, y: 7 }, { x: 7, y: 11 }, { x: 8, y: 11 },
      { x: 13, y: 11 }, { x: 14, y: 11 },
    ],
  },
];
