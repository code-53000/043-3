import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, Home, Sparkles, Star, Clock, Footprints, RotateCcw, Crown } from 'lucide-react';
import { Level, StarRating, LevelRecord } from '../types/game';
import { getLevelById, getTotalLevels } from '../data/levels';

interface CompletionModalProps {
  isOpen: boolean;
  currentLevelId: number;
  onNextLevel: () => void;
  onBackToSelect: () => void;
  onClose: () => void;
  onReplay: () => void;
  lastRunStats: {
    timeMs: number;
    stars: StarRating;
    steps: number;
    isNewRecord: boolean;
  } | null;
  bestRecord: LevelRecord | undefined;
  formatTime: (ms: number) => string;
}

const StarDisplay: React.FC<{ rating: StarRating; size?: 'sm' | 'md' | 'lg' }> = ({ rating, size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5';
  const stars = [1, 2, 3];

  return (
    <div className="flex items-center justify-center gap-1">
      {stars.map((i) => {
        const filled = i <= rating;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 + i * 0.15 }}
          >
            <Star
              className={`${sizeClass} ${filled ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' : 'text-gray-300 fill-gray-100'}`}
              strokeWidth={filled ? 0 : 2}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  currentLevelId,
  onNextLevel,
  onBackToSelect,
  onClose,
  onReplay,
  lastRunStats,
  bestRecord,
  formatTime,
}) => {
  const currentLevel = getLevelById(currentLevelId);
  const hasNextLevel = currentLevelId < getTotalLevels();
  const nextLevel = getLevelById(currentLevelId + 1);

  const confettiParticles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * -200 - 100,
    delay: Math.random() * 0.5,
    color: ['#14b8a6', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
  }));

  const shouldShow = isOpen && currentLevelId > 0;

  const getStarTitle = (stars: StarRating): string => {
    switch (stars) {
      case 3:
        return '完美通关！';
      case 2:
        return '表现不错！';
      case 1:
        return '顺利过关！';
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
                scale: 0,
                rotate: 360,
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center">
              {lastRunStats?.isNewRecord && (
                <motion.div
                  initial={{ scale: 0, y: -20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white font-bold text-sm shadow-lg"
                >
                  <Crown className="w-4 h-4" />
                  新纪录！
                </motion.div>
              )}

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 mb-6 shadow-lg mt-2"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-3xl font-bold text-gray-800">
                    {lastRunStats ? getStarTitle(lastRunStats.stars) : '恭喜通关！'}
                  </h2>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-gray-500 mb-2">
                  第 {currentLevelId} 关 · {currentLevel?.name}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  {currentLevel?.gridSize}×{currentLevel?.gridSize} 网格已全部填满
                </p>
              </motion.div>

              {lastRunStats && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <StarDisplay rating={lastRunStats.stars} size="lg" />
                </motion.div>
              )}

              {lastRunStats && bestRecord && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mb-8"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-medium mb-2">本次成绩</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          <span className="font-mono font-bold text-gray-700 text-sm">
                            {formatTime(lastRunStats.timeMs)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Footprints className="w-3.5 h-3.5 text-accent-500" />
                          <span className="font-mono font-bold text-gray-700 text-sm">
                            {lastRunStats.steps} 步
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={lastRunStats.stars} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100">
                      <p className="text-xs text-yellow-600 font-medium mb-2 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        历史最佳
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          <span className="font-mono font-bold text-gray-700 text-sm">
                            {formatTime(bestRecord.bestTimeMs)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Footprints className="w-3.5 h-3.5 text-accent-500" />
                          <span className="font-mono font-bold text-gray-700 text-sm">
                            {bestRecord.bestSteps} 步
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarDisplay rating={bestRecord.bestStars} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                {hasNextLevel && nextLevel && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNextLevel}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 
                               bg-gradient-to-r from-primary-500 to-accent-500 text-white 
                               rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl
                               transition-all duration-200"
                  >
                    下一关
                    <span className="text-sm opacity-80">({nextLevel.name} · {nextLevel.gridSize}×{nextLevel.gridSize})</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onReplay}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 
                             bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                             rounded-2xl font-bold shadow-lg hover:shadow-xl
                             transition-all duration-200"
                >
                  <RotateCcw className="w-5 h-5" />
                  再玩一次
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBackToSelect}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 
                             bg-gray-100 text-gray-700 rounded-2xl font-bold
                             hover:bg-gray-200 transition-all duration-200"
                >
                  <Home className="w-5 h-5" />
                  返回关卡选择
                </motion.button>

                {!hasNextLevel && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-sm text-primary-600 font-medium mt-2"
                  >
                    🎉 你已完成所有关卡！太厉害了！
                  </motion.p>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
