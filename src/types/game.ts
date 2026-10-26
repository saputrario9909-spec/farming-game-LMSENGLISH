export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type ChallengeCategory = 
  | 'vocabulary' 
  | 'grammar_tenses' 
  | 'prepositions' 
  | 'idioms' 
  | 'collocations' 
  | 'phrasal_verbs';

export type ChallengeType = 'multiple_choice' | 'complex_mcq' | 'true_false' | 'fill_in_the_blank' | 'sentence_scramble' | 'word_unscramble';

export interface EnglishChallenge {
  id: string;
  category: ChallengeCategory;
  level: CefrLevel;
  type: ChallengeType;
  prompt: string;
  targetWord?: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  scrambledWords?: string[]; // for sentence_scramble
  explanation: string;
  exampleSentence: string;
  hint: string;
}

export type CropStage = 'empty' | 'seedling' | 'sprout' | 'flowering' | 'ripe';

export interface CropDefinition {
  id: string;
  name: string;
  category: ChallengeCategory;
  color: string;
  stemColor: string;
  bloomColor: string;
  harvestRewardCoins: number;
  harvestRewardXp: number;
  growthRequired: number; // typically 3 actions (seed -> water -> weed/tend -> ripe)
  description: string;
  seedCost: number;
  icon: string;
}

export interface GardenPlot {
  id: number;
  x: number;
  y: number;
  crop: CropDefinition | null;
  stage: CropStage;
  currentGrowth: number;
  needsAction: 'none' | 'water' | 'fertilize' | 'weed' | 'harvest';
  lastWateredTime: number;
  activeChallenge?: EnglishChallenge;
  masteredWord?: string;
}

export interface StudentMasteryEntry {
  wordOrRule: string;
  category: ChallengeCategory;
  level: CefrLevel;
  definition: string;
  exampleSentence: string;
  timesEncountered: number;
  timesCorrect: number;
  lastPracticed: number;
  mastered: boolean;
}

export interface StudentProfile {
  studentId: string;
  studentName: string;
  studentClass?: string;
  coins: number;
  xp: number;
  level: number;
  streak: number;
  highestStreak: number;
  totalAnswered: number;
  correctAnswers: number;
  cropsHarvested: number;
  timeSpentSeconds: number;
  unlockedSeeds: string[];
  masteryBook: Record<string, StudentMasteryEntry>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  currentProgress: number;
  targetCount: number;
  isCompleted: boolean;
  category?: ChallengeCategory;
}

export interface LMSConfig {
  lmsMode: boolean;
  lmsProvider: 'antigravity' | 'canvas' | 'moodle' | 'generic';
  targetLesson?: string;
  targetLevel?: CefrLevel;
  targetPassScore?: number;
  autoReportGrade: boolean;
  returnUrl?: string;
}

export interface LMSPostMessagePayload {
  type: 'LMS_READY' | 'LMS_QUESTION_SUBMIT' | 'LMS_HARVEST' | 'LMS_GRADE_PASSBACK' | 'LMS_HEARTBEAT';
  timestamp: string;
  studentId: string;
  studentName: string;
  score: number;
  xp?: number;
  accuracy: number;
  gradePercentage: number;
  passed: boolean;
  wordsMasteredCount: number;
  timeSpentSeconds: number;
  metadata?: Record<string, unknown>;
}
