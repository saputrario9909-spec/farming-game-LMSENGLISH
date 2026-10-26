/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CefrLevel,
  CropDefinition,
  EnglishChallenge,
  GardenPlot,
  Quest,
  StudentProfile,
} from './types/game';
import { CROPS_CATALOG, INITIAL_CHALLENGES } from './data/englishCurriculum';
import { gameAudio } from './services/audio';
import { lmsBridge } from './services/lmsBridge';
import { GardenCanvas } from './components/GardenCanvas';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { ChallengeModal } from './components/ChallengeModal';
import { LexiconAlmanac } from './components/LexiconAlmanac';
import { MarketModal } from './components/MarketModal';
import { LMSIntegrationModal } from './components/LMSIntegrationModal';
import { PauseModal } from './components/PauseModal';

// Initial plot grid layout
const createInitialPlots = (): GardenPlot[] => {
  const plots: GardenPlot[] = [];
  const cols = 4;
  const rows = 3;
  const startX = 220;
  const startY = 160;
  const gapX = 140;
  const gapY = 120;

  let id = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Pre-seed a few plots with starter crops for immediate engagement
      let initialCrop: CropDefinition | null = null;
      let initialStage: GardenPlot['stage'] = 'empty';
      let needsAction: GardenPlot['needsAction'] = 'none';

      if (id === 1) {
        initialCrop = CROPS_CATALOG[0]; // Sunflower
        initialStage = 'seedling';
        needsAction = 'water';
      } else if (id === 2) {
        initialCrop = CROPS_CATALOG[1]; // Verbena
        initialStage = 'sprout';
        needsAction = 'water';
      } else if (id === 3) {
        initialCrop = CROPS_CATALOG[2]; // Pumpkin
        initialStage = 'ripe';
        needsAction = 'harvest';
      } else if (id === 5) {
        initialCrop = CROPS_CATALOG[3]; // Iris
        initialStage = 'flowering';
        needsAction = 'water';
      }

      plots.push({
        id,
        x: startX + c * gapX,
        y: startY + r * gapY,
        crop: initialCrop,
        stage: initialStage,
        currentGrowth: initialStage === 'ripe' ? 3 : initialStage === 'sprout' ? 1 : initialStage === 'flowering' ? 2 : 0,
        needsAction,
        lastWateredTime: Date.now(),
      });
      id++;
    }
  }
  return plots;
};

export default function App() {
  const [gameState, setGameState] = useState<'TITLE_MENU' | 'PLAYING' | 'PAUSED'>('TITLE_MENU');

  // Student Profile State
  const [profile, setProfile] = useState<StudentProfile>(() => {
    // Check URL params for student name / id from LMS
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const lmsStudentId = params?.get('student_id') || 'student_' + Math.floor(1000 + Math.random() * 9000);
    const lmsStudentName = params?.get('student_name') || 'Botanical Scholar';

    return {
      studentId: lmsStudentId,
      studentName: lmsStudentName,
      coins: 60,
      xp: 0,
      level: 1,
      streak: 0,
      highestStreak: 0,
      totalAnswered: 0,
      correctAnswers: 0,
      cropsHarvested: 0,
      timeSpentSeconds: 0,
      unlockedSeeds: ['crop_sunflower', 'crop_verbena', 'crop_pumpkin'],
      masteryBook: {},
    };
  });

  const [currentLevel, setCurrentLevel] = useState<CefrLevel>('B1');
  const [plots, setPlots] = useState<GardenPlot[]>(createInitialPlots);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

  // Tools & Seed Pouch
  const [activeTool, setActiveTool] = useState<'trowel' | 'water' | 'seed'>('water');
  const [selectedSeed, setSelectedSeed] = useState<CropDefinition | null>(CROPS_CATALOG[0]);

  // Modals
  const [activeChallengeModal, setActiveChallengeModal] = useState<{
    plot: GardenPlot;
    challenge: EnglishChallenge;
  } | null>(null);
  const [isAlmanacOpen, setIsAlmanacOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLMSOpen, setIsLMSOpen] = useState(false);

  // Active Quests
  const [quests, setQuests] = useState<Quest[]>([
    {
      id: 'quest_1',
      title: 'First Botanical Harvest',
      description: 'Harvest 2 ripe English crops from your garden.',
      rewardCoins: 40,
      rewardXp: 50,
      currentProgress: 0,
      targetCount: 2,
      isCompleted: false,
    },
  ]);

  // Notify LMS parent on load
  useEffect(() => {
    lmsBridge.sendToLMS({
      type: 'LMS_READY',
      timestamp: new Date().toISOString(),
      studentId: profile.studentId,
      studentName: profile.studentName,
      score: profile.xp,
      accuracy: 100,
      gradePercentage: 0,
      passed: false,
      wordsMasteredCount: 0,
      timeSpentSeconds: 0,
    });
  }, []);

  // Track active time spent in game
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setProfile((prev) => ({
        ...prev,
        timeSpentSeconds: prev.timeSpentSeconds + 1,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Global Keyboard shortcuts (Escape for pause/modals)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeChallengeModal) {
          setActiveChallengeModal(null);
        } else if (isAlmanacOpen) {
          setIsAlmanacOpen(false);
        } else if (isMarketOpen) {
          setIsMarketOpen(false);
        } else if (isLMSOpen) {
          setIsLMSOpen(false);
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeChallengeModal, isAlmanacOpen, isMarketOpen, isLMSOpen, gameState]);

  // Start game from title screen
  const handleStartGame = (name: string, level: CefrLevel) => {
    setProfile((prev) => ({ ...prev, studentName: name }));
    setCurrentLevel(level);
    setGameState('PLAYING');
  };

  // Find a challenge matching category and CEFR level
  const getChallengeForCrop = useCallback(
    (category: string, level: CefrLevel): EnglishChallenge => {
      const filtered = INITIAL_CHALLENGES.filter(
        (c) => c.category === category && (c.level === level || c.level === 'B1' || c.level === 'A2')
      );
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
      return INITIAL_CHALLENGES[Math.floor(Math.random() * INITIAL_CHALLENGES.length)];
    },
    []
  );

  // Trigger plot interaction
  const handlePlotAction = (plotId: number) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) return;

    // 1. Ready for Harvest!
    if (plot.stage === 'ripe') {
      harvestPlot(plot);
      return;
    }

    // 2. Empty Plot -> Plant Selected Seed
    if (plot.stage === 'empty') {
      if (activeTool === 'seed' && selectedSeed) {
        plantSeed(plot, selectedSeed);
      } else {
        // Default to planting current selected seed or first unlocked
        const seedToPlant = selectedSeed || CROPS_CATALOG.find((c) => profile.unlockedSeeds.includes(c.id)) || CROPS_CATALOG[0];
        plantSeed(plot, seedToPlant);
      }
      return;
    }

    // 3. Plant needs tending / watering / challenge
    const category = plot.crop?.category || 'vocabulary';
    const challenge = getChallengeForCrop(category, currentLevel);
    setActiveChallengeModal({
      plot,
      challenge,
    });
  };

  // Plant a seed
  const plantSeed = (plot: GardenPlot, crop: CropDefinition) => {
    gameAudio.playPlantSound();
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plot.id) return p;
        return {
          ...p,
          crop,
          stage: 'seedling',
          currentGrowth: 0,
          needsAction: 'water',
          lastWateredTime: Date.now(),
        };
      })
    );
  };

  // Harvest ripe crop
  const harvestPlot = (plot: GardenPlot) => {
    const crop = plot.crop;
    if (!crop) return;

    gameAudio.playHarvestSound();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: [crop.bloomColor, '#f59e0b', '#22c55e', '#ffffff'],
      });
    } catch {
      // ignore
    }

    const earnedCoins = crop.harvestRewardCoins;
    const earnedXp = crop.harvestRewardXp;

    // Update Profile
    setProfile((prev) => {
      const nextXp = prev.xp + earnedXp;
      const nextLevel = Math.floor(nextXp / 100) + 1;
      const nextHarvestCount = prev.cropsHarvested + 1;

      const updated = {
        ...prev,
        coins: prev.coins + earnedCoins,
        xp: nextXp,
        level: nextLevel,
        cropsHarvested: nextHarvestCount,
      };

      // Auto submit grade passback if milestone reached
      if (nextHarvestCount % 3 === 0) {
        lmsBridge.submitGradePassback(updated);
      }

      return updated;
    });

    const harvestXp = crop.harvestRewardXp || earnedXp || 50;
    console.log("Mengirim XP Panen ke LMS:", harvestXp);

    // Notify LMS of harvest dengan menyertakan nilai XP panen aktual
    lmsBridge.sendToLMS({
      type: 'LMS_HARVEST',
      timestamp: new Date().toISOString(),
      studentId: profile.studentId,
      studentName: profile.studentName,
      xp: harvestXp, // Pastikan nilai XP panen terkirim secara pasti
      score: profile.xp + earnedXp,
      accuracy: profile.totalAnswered > 0 ? Math.round((profile.correctAnswers / profile.totalAnswered) * 100) : 100,
      gradePercentage: Math.min(100, Math.round(((profile.xp + earnedXp) / 250) * 100)),
      passed: profile.xp + earnedXp >= 250,
      wordsMasteredCount: Object.keys(profile.masteryBook).length,
      timeSpentSeconds: profile.timeSpentSeconds,
      metadata: {
        cropName: crop.name,
        category: crop.category,
        earnedXp: harvestXp,
      },
    });

    // Advance Quests
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'quest_1' && !q.isCompleted) {
          const nextProg = q.currentProgress + 1;
          return {
            ...q,
            currentProgress: nextProg,
            isCompleted: nextProg >= q.targetCount,
          };
        }
        return q;
      })
    );

    // Reset plot to empty
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plot.id) return p;
        return {
          ...p,
          crop: null,
          stage: 'empty',
          currentGrowth: 0,
          needsAction: 'none',
        };
      })
    );
  };

  // When student answers challenge successfully
  const handleChallengeSuccess = (challenge: EnglishChallenge) => {
    if (!activeChallengeModal) return;
    const { plot } = activeChallengeModal;

    // Advance plot growth
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plot.id) return p;
        const nextGrowth = p.currentGrowth + 1;
        let nextStage: GardenPlot['stage'] = p.stage;
        let needsAction: GardenPlot['needsAction'] = 'none';

        if (nextGrowth === 1) {
          nextStage = 'sprout';
          needsAction = 'water';
        } else if (nextGrowth === 2) {
          nextStage = 'flowering';
          needsAction = 'water';
        } else if (nextGrowth >= 3) {
          nextStage = 'ripe';
          needsAction = 'harvest';
        }

        return {
          ...p,
          currentGrowth: nextGrowth,
          stage: nextStage,
          needsAction,
          lastWateredTime: Date.now(),
        };
      })
    );

    // Update Student Profile & Mastered Knowledge
    setProfile((prev) => {
      const nextStreak = prev.streak + 1;
      const nextHighest = Math.max(prev.highestStreak, nextStreak);
      const nextXp = prev.xp + 40;
      const nextLevel = Math.floor(nextXp / 100) + 1;

      const key = challenge.targetWord || challenge.correctAnswer;
      const existing = prev.masteryBook[key];

      const updatedBook = {
        ...prev.masteryBook,
        [key]: {
          wordOrRule: key,
          category: challenge.category,
          level: challenge.level,
          definition: challenge.explanation,
          exampleSentence: challenge.exampleSentence,
          timesEncountered: (existing?.timesEncountered || 0) + 1,
          timesCorrect: (existing?.timesCorrect || 0) + 1,
          lastPracticed: Date.now(),
          mastered: (existing?.timesCorrect || 0) + 1 >= 2,
        },
      };

      const updated: StudentProfile = {
        ...prev,
        streak: nextStreak,
        highestStreak: nextHighest,
        xp: nextXp,
        level: nextLevel,
        totalAnswered: prev.totalAnswered + 1,
        correctAnswers: prev.correctAnswers + 1,
        masteryBook: updatedBook,
      };

      // Notify LMS parent
      lmsBridge.sendToLMS({
        type: 'LMS_QUESTION_SUBMIT',
        timestamp: new Date().toISOString(),
        studentId: updated.studentId,
        studentName: updated.studentName,
        score: updated.xp,
        accuracy: Math.round((updated.correctAnswers / updated.totalAnswered) * 100),
        gradePercentage: Math.min(100, Math.round((updated.xp / 250) * 100)),
        passed: updated.xp >= 250,
        wordsMasteredCount: Object.keys(updated.masteryBook).length,
        timeSpentSeconds: updated.timeSpentSeconds,
        metadata: {
          category: challenge.category,
          targetWord: key,
          level: challenge.level,
        },
      });

      return updated;
    });

    setActiveChallengeModal(null);
  };

  // Buy new seed in Market
  const handleBuySeed = (crop: CropDefinition) => {
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - crop.seedCost,
      unlockedSeeds: [...prev.unlockedSeeds, crop.id],
    }));
    setSelectedSeed(crop);
    setActiveTool('seed');
  };

  const availableSeeds = CROPS_CATALOG.filter((c) =>
    profile.unlockedSeeds.includes(c.id)
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c1a11] select-none font-sans text-slate-100">
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          onStartGame={handleStartGame}
          defaultStudentName={profile.studentName}
          defaultLevel={currentLevel}
          isLmsEmbed={lmsBridge.isEmbedMode()}
        />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          {/* Isolated 60FPS Garden Canvas Viewport */}
          <GardenCanvas
            plots={plots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={(id) => setSelectedPlotId(id)}
            onPlotAction={handlePlotAction}
            activeTool={activeTool}
          />

          {/* Low-Occlusion Perimeter HUD */}
          <HUD
            profile={profile}
            activeQuests={quests}
            activeTool={activeTool}
            selectedSeed={selectedSeed}
            availableSeeds={availableSeeds}
            onSelectTool={setActiveTool}
            onSelectSeed={setSelectedSeed}
            onOpenAlmanac={() => setIsAlmanacOpen(true)}
            onOpenMarket={() => setIsMarketOpen(true)}
            onOpenLMS={() => setIsLMSOpen(true)}
            onPause={() => setGameState('PAUSED')}
          />
        </>
      )}

      {/* Challenge / Quiz Modal */}
      {activeChallengeModal && (
        <ChallengeModal
          plot={activeChallengeModal.plot}
          challenge={activeChallengeModal.challenge}
          onSuccess={handleChallengeSuccess}
          onClose={() => setActiveChallengeModal(null)}
        />
      )}

      {/* Lexicon Almanac Modal */}
      {isAlmanacOpen && (
        <LexiconAlmanac
          masteryBook={profile.masteryBook}
          onClose={() => setIsAlmanacOpen(false)}
        />
      )}

      {/* Market Modal */}
      {isMarketOpen && (
        <MarketModal
          profile={profile}
          onBuySeed={handleBuySeed}
          onClose={() => setIsMarketOpen(false)}
        />
      )}

      {/* LMS Integration Center */}
      {isLMSOpen && (
        <LMSIntegrationModal
          profile={profile}
          onClose={() => setIsLMSOpen(false)}
          onSimulateGradePassback={() => lmsBridge.submitGradePassback(profile)}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          profile={profile}
          onResume={() => setGameState('PLAYING')}
          onRestart={() => {
            setPlots(createInitialPlots());
            setGameState('PLAYING');
          }}
          onOpenLMS={() => {
            setGameState('PLAYING');
            setIsLMSOpen(true);
          }}
          onExitToMenu={() => setGameState('TITLE_MENU')}
        />
      )}
    </div>
  );
}
