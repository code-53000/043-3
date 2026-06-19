export interface Position {
  row: number;
  col: number;
}

export interface Level {
  id: number;
  name: string;
  gridSize: number;
  startPosition: Position;
}

export type GameStatus = 'idle' | 'playing' | 'completed';

export type ViewMode = 'select' | 'game';

export type StarRating = 1 | 2 | 3;

export interface LevelRecord {
  bestTimeMs: number;
  bestStars: StarRating;
  bestSteps: number;
  completedAt: number;
}

export interface PlayerProgress {
  unlockedLevel: number;
  completedLevels: number[];
  levelRecords: Record<number, LevelRecord>;
}

export const isSamePosition = (a: Position, b: Position): boolean => {
  return a.row === b.row && a.col === b.col;
};

export const isAdjacent = (a: Position, b: Position): boolean => {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};
