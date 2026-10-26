import React from 'react';
import { StudentProfile } from '../types/game';
import { gameAudio } from '../services/audio';
import { Play, RotateCcw, Share2, Volume2, VolumeX, X } from 'lucide-react';

interface PauseModalProps {
  profile: StudentProfile;
  onResume: () => void;
  onRestart: () => void;
  onOpenLMS: () => void;
  onExitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  profile,
  onResume,
  onRestart,
  onOpenLMS,
  onExitToMenu,
}) => {
  const isMuted = gameAudio.getMuted();

  const handleToggleAudio = () => {
    gameAudio.toggleMute();
    gameAudio.playClickSound();
  };

  const accuracy =
    profile.totalAnswered > 0
      ? Math.round((profile.correctAnswers / profile.totalAnswered) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">Game Paused</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{profile.studentName}</span>
              <span aria-hidden="true">·</span>
              <span>Level {profile.level}</span>
            </div>
          </div>
          <button
            onClick={onResume}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Resume"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Study Stats */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
              <span className="text-slate-400 block">Total Experience</span>
              <span className="text-base font-bold text-amber-400 font-mono tabular-nums">
                {profile.xp} XP
              </span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
              <span className="text-slate-400 block">Answer Accuracy</span>
              <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                {accuracy}%
              </span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
              <span className="text-slate-400 block">Crops Harvested</span>
              <span className="text-base font-bold text-slate-200 font-mono tabular-nums">
                {profile.cropsHarvested}
              </span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-0.5">
              <span className="text-slate-400 block">Words Mastered</span>
              <span className="text-base font-bold text-indigo-400 font-mono tabular-nums">
                {Object.keys(profile.masteryBook).length}
              </span>
            </div>
          </div>

          {/* Quick Audio Setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs">
            <span className="text-slate-300 font-medium">Synthesizer & Audio FX</span>
            <button
              onClick={handleToggleAudio}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? 'Muted' : 'Enabled'}</span>
            </button>
          </div>

          {/* Navigation Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                gameAudio.playClickSound();
                onResume();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Resume Farming</span>
            </button>

            <button
              onClick={() => {
                gameAudio.playClickSound();
                onOpenLMS();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-indigo-200 bg-indigo-950/70 border border-indigo-800/80 hover:bg-indigo-900/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Antigravity LMS Bridge & Passback</span>
            </button>

            <button
              onClick={() => {
                gameAudio.playClickSound();
                onExitToMenu();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Exit to Title Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
