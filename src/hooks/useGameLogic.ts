import { useState, useCallback, useEffect, useRef } from 'react';
import { Position, GameStatus, Level, PlayerProgress, isSamePosition, StarRating } from '../types/game';
import { canMoveTo, isPathComplete, isStuck } from '../utils/pathValidator';
import { useLocalStorage } from './useLocalStorage';
import { getTotalLevels } from '../data/levels';

const STORAGE_KEY = 'one-line-puzzle-progress';

const initialProgress: PlayerProgress = {
  unlockedLevel: 1,
  completedLevels: [],
  levelRecords: {},
};

const calculateStars = (undoCount: number): StarRating => {
  if (undoCount === 0) return 3;
  if (undoCount <= 3) return 2;
  return 1;
};

export function useGameLogic(level: Level | null) {
  const [path, setPath] = useState<Position[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [progress, setProgress] = useLocalStorage<PlayerProgress>(STORAGE_KEY, initialProgress);
  const [showCompletion, setShowCompletion] = useState(false);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTime, setFinishTime] = useState<number | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [lastRunStats, setLastRunStats] = useState<{
    timeMs: number;
    stars: StarRating;
    steps: number;
    isNewRecord: boolean;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime !== null && finishTime === null) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime, finishTime]);

  useEffect(() => {
    if (level) {
      resetGame();
    }
  }, [level]);

  const resetGame = useCallback(() => {
    if (level) {
      setPath([level.startPosition]);
      setGameStatus('idle');
      setIsDrawing(false);
      setShowCompletion(false);
      setElapsedMs(0);
      setStartTime(null);
      setFinishTime(null);
      setUndoCount(0);
      setMoveCount(0);
      setLastRunStats(null);
    }
  }, [level]);

  const startDrawing = useCallback(
    (pos: Position) => {
      if (!level || gameStatus === 'completed') return;
      const lastPos = path[path.length - 1];
      if (lastPos && isSamePosition(pos, lastPos)) {
        setIsDrawing(true);
        if (gameStatus === 'idle') {
          setGameStatus('playing');
          setStartTime(Date.now());
        }
      }
    },
    [level, path, gameStatus]
  );

  const moveTo = useCallback(
    (pos: Position) => {
      if (!isDrawing || !level || gameStatus === 'completed') return;

      if (canMoveTo(pos, path, level.gridSize)) {
        const newPath = [...path, pos];
        setPath(newPath);
        setMoveCount((c) => c + 1);

        if (isPathComplete(newPath, level.gridSize)) {
          const endTime = Date.now();
          const totalTime = startTime !== null ? endTime - startTime : 0;
          const totalSteps = moveCount + 1 + undoCount;
          setFinishTime(endTime);
          setElapsedMs(totalTime);
          setGameStatus('completed');
          setIsDrawing(false);
          handleLevelComplete(totalTime, totalSteps, undoCount);
        }
      }
    },
    [isDrawing, level, path, gameStatus, startTime, moveCount, undoCount]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const undo = useCallback(() => {
    if (path.length > 1 && gameStatus !== 'completed') {
      setPath(path.slice(0, -1));
      setUndoCount((c) => c + 1);
      setGameStatus('playing');
    }
  }, [path, gameStatus]);

  const handleLevelComplete = useCallback(
    (totalTimeMs: number, totalSteps: number, totalUndos: number) => {
      if (!level) return;

      const stars = calculateStars(totalUndos);

      setProgress((prev) => {
        const newCompleted = prev.completedLevels.includes(level.id)
          ? prev.completedLevels
          : [...prev.completedLevels, level.id];

        const nextLevel = level.id + 1;
        const newUnlocked = Math.min(Math.max(prev.unlockedLevel, nextLevel), getTotalLevels());

        const existingRecord = prev.levelRecords[level.id];
        let isNewRecord = false;
        let newBestTime = totalTimeMs;
        let newBestStars = stars;
        let newBestSteps = totalSteps;

        if (!existingRecord) {
          isNewRecord = true;
        } else {
          if (stars > existingRecord.bestStars) {
            isNewRecord = true;
            newBestTime = totalTimeMs;
            newBestStars = stars;
            newBestSteps = totalSteps;
          } else if (stars === existingRecord.bestStars) {
            if (totalTimeMs < existingRecord.bestTimeMs) {
              isNewRecord = true;
              newBestTime = totalTimeMs;
              newBestStars = stars;
              newBestSteps = totalSteps;
            }
          } else {
            newBestTime = existingRecord.bestTimeMs;
            newBestStars = existingRecord.bestStars;
            newBestSteps = existingRecord.bestSteps;
          }
        }

        setLastRunStats({
          timeMs: totalTimeMs,
          stars,
          steps: totalSteps,
          isNewRecord,
        });

        return {
          unlockedLevel: newUnlocked,
          completedLevels: newCompleted,
          levelRecords: {
            ...prev.levelRecords,
            [level.id]: {
              bestTimeMs: newBestTime,
              bestStars: newBestStars,
              bestSteps: newBestSteps,
              completedAt: Date.now(),
            },
          },
        };
      });

      setShowCompletion(true);
    },
    [level, setProgress]
  );

  const closeCompletion = useCallback(() => {
    setShowCompletion(false);
  }, []);

  const isCurrentPosition = useCallback(
    (pos: Position): boolean => {
      return path.length > 0 && isSamePosition(path[path.length - 1], pos);
    },
    [path]
  );

  const isInPath = useCallback(
    (pos: Position): boolean => {
      return path.some((p) => isSamePosition(p, pos));
    },
    [path]
  );

  const getPathIndex = useCallback(
    (pos: Position): number => {
      return path.findIndex((p) => isSamePosition(p, pos));
    },
    [path]
  );

  const isStuckNow = level ? isStuck(path, level.gridSize) : false;
  const progressPercent = level ? (path.length / (level.gridSize * level.gridSize)) * 100 : 0;
  const currentLevelRecord = level ? progress.levelRecords[level.id] : undefined;

  return {
    path,
    isDrawing,
    gameStatus,
    progress,
    showCompletion,
    isStuck: isStuckNow,
    progressPercent,
    elapsedMs,
    undoCount,
    moveCount,
    lastRunStats,
    currentLevelRecord,
    startDrawing,
    moveTo,
    stopDrawing,
    undo,
    resetGame,
    closeCompletion,
    isCurrentPosition,
    isInPath,
    getPathIndex,
    canUndo: path.length > 1 && gameStatus !== 'completed',
    canReset: path.length > 1,
  };
}
