import React from 'react';
import { CropDefinition, Quest, StudentProfile } from '../types/game';
import { gameAudio } from '../services/audio';
import {
  Coins,
  Flame,
  BookOpen,
  Store,
  Share2,
  Volume2,
  VolumeX,
  Pause,
  Sprout,
  Droplets,
  Shovel,
  Sparkles,
} from 'lucide-react';

interface HUDProps {
  profile: StudentProfile;
  activeQuests: Quest[];
  activeTool: 'trowel' | 'water' | 'seed';
  selectedSeed: CropDefinition | null;
  availableSeeds: CropDefinition[];
  onSelectTool: (tool: 'trowel' | 'water' | 'seed') => void;
  onSelectSeed: (crop: CropDefinition) => void;
  onOpenAlmanac: () => void;
  onOpenMarket: () => void;
  onOpenLMS: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  profile,
  activeQuests,
  activeTool,
  selectedSeed,
  availableSeeds,
  onSelectTool,
  onSelectSeed,
  onOpenAlmanac,
  onOpenMarket,
  onOpenLMS,
  onPause,
}) => {
  const isMuted = gameAudio.getMuted();

  const handleToggleAudio = () => {
    gameAudio.toggleMute();
    gameAudio.playClickSound();
  };

  const xpProgress = Math.min(100, (profile.xp % 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Header Cluster */}
      <div className="flex items-start justify-between w-full gap-4">
        {/* Left: Student Identity & Resources */}
        <div className="pointer-events-auto flex items-center gap-3 p-2 px-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-slate-100 shadow-xl">
          {/* Avatar / Level */}
          <div className="relative w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600/50 flex flex-col items-center justify-center text-emerald-400 font-bold">
            <span className="text-[10px] uppercase tracking-tighter text-emerald-300">LVL</span>
            <span className="text-sm font-mono tabular-nums leading-none">{profile.level}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 tracking-tight">
                {profile.studentName}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold font-mono tabular-nums">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{profile.streak} Streak</span>
              </div>
            </div>

            {/* XP bar */}
            <div className="w-32 sm:w-40 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono tabular-nums">
              <span>{profile.xp} XP</span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1 text-amber-300 font-semibold">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>{profile.coins}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Menu Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Lexicon Almanac */}
          <button
            onClick={() => {
              gameAudio.playClickSound();
              onOpenAlmanac();
            }}
            title="Open Lexicon Almanac (Vocabulary & Grammar Notebook)"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-950/85 border border-slate-800 hover:border-amber-400/60 text-slate-200 hover:text-white transition-all shadow-lg cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Lexicon</span>
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              ({Object.keys(profile.masteryBook).length})
            </span>
          </button>

          {/* Seed Market */}
          <button
            onClick={() => {
              gameAudio.playClickSound();
              onOpenMarket();
            }}
            title="Open Seed Market"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-950/85 border border-slate-800 hover:border-emerald-400/60 text-slate-200 hover:text-white transition-all shadow-lg cursor-pointer"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Market</span>
          </button>

          {/* LMS Bridge & Grade Sync */}
          <button
            onClick={() => {
              gameAudio.playClickSound();
              onOpenLMS();
            }}
            title="Antigravity LMS Integration & Grade Passback"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-950/85 border border-indigo-700/70 hover:border-indigo-400 text-indigo-200 hover:text-white transition-all shadow-lg cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">LMS Sync</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/85 border border-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={() => {
              gameAudio.playClickSound();
              onPause();
            }}
            title="Pause Game (Esc)"
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/85 border border-slate-800 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Active Quest on Left + Toolbelt in Center */}
      <div className="flex items-end justify-between w-full gap-4">
        {/* Active Learning Quest */}
        <div className="pointer-events-auto hidden md:flex flex-col p-3 rounded-2xl bg-slate-950/85 border border-slate-800 text-slate-200 max-w-xs shadow-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Botanical Quest</span>
          </div>
          {activeQuests.length > 0 ? (
            <div>
              <p className="text-xs text-slate-300 font-medium">{activeQuests[0].title}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                <span>Progress</span>
                <span>
                  {activeQuests[0].currentProgress} / {activeQuests[0].targetCount}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Tend your garden to earn master status.</p>
          )}
        </div>

        {/* Center: Tool Belt & Seed Selector */}
        <div className="pointer-events-auto mx-auto flex items-center gap-2 p-2 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl">
          {/* Trowel Tool */}
          <button
            onClick={() => {
              gameAudio.playClickSound();
              onSelectTool('trowel');
            }}
            title="Trowel: Clear or inspect plot"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'trowel'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Shovel className="w-4 h-4" />
            <span className="hidden sm:inline">Tend</span>
          </button>

          {/* Water Tool */}
          <button
            onClick={() => {
              gameAudio.playClickSound();
              onSelectTool('water');
            }}
            title="Watering Can: Hydrate plants and answer quiz"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'water'
                ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span className="hidden sm:inline">Water & Quiz</span>
          </button>

          {/* Seed Selector Dropdown / Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            {availableSeeds.map((crop) => {
              const isSelected = activeTool === 'seed' && selectedSeed?.id === crop.id;
              return (
                <button
                  key={crop.id}
                  onClick={() => {
                    gameAudio.playClickSound();
                    onSelectTool('seed');
                    onSelectSeed(crop);
                  }}
                  title={`Plant ${crop.name} (${crop.category.replace('_', ' ')})`}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: crop.bloomColor }}
                  />
                  <span className="hidden lg:inline">{crop.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right dummy spacer for visual balance */}
        <div className="hidden md:block w-32" />
      </div>
    </div>
  );
};
