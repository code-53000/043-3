import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock, Footprints } from 'lucide-react';
import { Level, ViewMode } from './types/game';
import { useGameLogic } from './hooks/useGameLogic';
import { LevelSelect } from './components/LevelSelect';
import { GameGrid } from './components/GameGrid';
import { ControlPanel } from './components/ControlPanel';
import { CompletionModal } from './components/CompletionModal';
import { getLevelById, getTotalLevels } from './data/levels';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 100);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const gameLogic = useGameLogic(selectedLevel);

  const handleSelectLevel = useCallback((level: Level) => {
    setSelectedLevel(level);
    setViewMode('game');
  }, []);

  const handleBackToSelect = useCallback(() => {
    gameLogic.closeCompletion();
    setViewMode('select');
    setSelectedLevel(null);
  }, [gameLogic]);

  const handleNextLevel = useCallback(() => {
    if (!selectedLevel) return;
    const nextLevelId = selectedLevel.id + 1;
    const nextLevel = getLevelById(nextLevelId);
    if (nextLevel) {
      setSelectedLevel(nextLevel);
      gameLogic.closeCompletion();
    }
  }, [selectedLevel, gameLogic]);

  const isLastLevel = selectedLevel ? selectedLevel.id >= getTotalLevels() : true;

  return (
    <div className="w-full max-w-4xl mx-auto bg-grid-pattern">
      <AnimatePresence mode="wait">
        {viewMode === 'select' && (
          <LevelSelect
            key="level-select"
            progress={gameLogic.progress}
            onSelectLevel={handleSelectLevel}
          />
        )}

        {viewMode === 'game' && selectedLevel && (
          <div key="game-view" className="w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                第 {selectedLevel.id} 关 · {selectedLevel.name}
              </h2>
              <p className="text-gray-500 text-sm">
                {selectedLevel.gridSize}×{selectedLevel.gridSize} 网格
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span className="font-mono font-bold text-gray-700 text-lg tabular-nums">
                    {formatTime(gameLogic.elapsedMs)}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Footprints className="w-4 h-4 text-accent-500" />
                  <span className="font-mono font-bold text-gray-700 text-lg tabular-nums">
                    {gameLogic.moveCount + gameLogic.undoCount}
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      ({gameLogic.moveCount}步 + {gameLogic.undoCount}撤销)
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-3 w-64 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-accent-500 transition-all duration-300 ease-out"
                  style={{ width: `${gameLogic.progressPercent}%` }}
                />
              </div>
            </div>

            <GameGrid
              level={selectedLevel}
              path={gameLogic.path}
              isDrawing={gameLogic.isDrawing}
              gameStatus={gameLogic.gameStatus}
              onStartDrawing={gameLogic.startDrawing}
              onMoveTo={gameLogic.moveTo}
              onStopDrawing={gameLogic.stopDrawing}
              isCurrentPosition={gameLogic.isCurrentPosition}
              isInPath={gameLogic.isInPath}
              getPathIndex={gameLogic.getPathIndex}
              isStuck={gameLogic.isStuck}
            />

            <ControlPanel
              canUndo={gameLogic.canUndo}
              canReset={gameLogic.canReset}
              onUndo={gameLogic.undo}
              onReset={gameLogic.resetGame}
              onBack={handleBackToSelect}
              isStuck={gameLogic.isStuck}
            />
          </div>
        )}
      </AnimatePresence>

      <CompletionModal
        isOpen={gameLogic.showCompletion}
        currentLevelId={selectedLevel?.id || 0}
        onNextLevel={handleNextLevel}
        onBackToSelect={handleBackToSelect}
        onClose={gameLogic.closeCompletion}
        onReplay={() => gameLogic.resetGame()}
        lastRunStats={gameLogic.lastRunStats}
        bestRecord={gameLogic.currentLevelRecord}
        formatTime={formatTime}
      />

      <div className="mt-12 text-center text-xs text-gray-400">
        <p>按住起点拖动鼠标，一笔填满所有格子</p>
        <p className="mt-1">只能上下左右移动，不能重复经过格子</p>
      </div>
    </div>
  );
}
