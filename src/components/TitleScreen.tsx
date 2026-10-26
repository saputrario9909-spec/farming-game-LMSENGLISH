import React, { useEffect, useState } from 'react';
import { CefrLevel } from '../types/game';
import { gameAudio } from '../services/audio';
import { Play, Volume2, VolumeX, Sparkles, BookOpen, GraduationCap } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: (studentName: string, selectedLevel: CefrLevel) => void;
  defaultStudentName?: string;
  defaultLevel?: CefrLevel;
  isLmsEmbed?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  defaultStudentName = 'Apprentice Gardener',
  defaultLevel = 'B1',
  isLmsEmbed = false,
}) => {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [level, setLevel] = useState<CefrLevel>(defaultLevel);
  const [isMuted, setIsMuted] = useState(gameAudio.getMuted());

  // Listen for Enter or Space to quickly start game per guidelines
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studentName, level]);

  const handleStart = () => {
    gameAudio.playClickSound();
    gameAudio.playHarvestSound();
    onStartGame(studentName.trim() || 'English Learner', level);
  };

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  const levels: { id: CefrLevel; title: string; desc: string }[] = [
    { id: 'A1', title: 'A1 Beginner', desc: 'Basic nouns, colors & simple verbs' },
    { id: 'A2', title: 'A2 Elementary', desc: 'Past simple, basic prepositions & questions' },
    { id: 'B1', title: 'B1 Intermediate', desc: 'Present perfect, modals & common idioms' },
    { id: 'B2', title: 'B2 Upper Inter.', desc: 'Conditionals, collocations & phrasal verbs' },
    { id: 'C1', title: 'C1 Advanced', desc: 'Academic lexicon, nuanced semantics & syntax' },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-[#0a160d]">
      {/* Live Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]" />

        {/* Ambient floating botanical particles */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              style={{
                left: `${(i * 19) % 100}%`,
                top: `${(i * 23) % 100}%`,
                animationDuration: `${3 + (i % 4)}s`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top Bar Status / Mute Button */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400/90 tracking-wide">
          <GraduationCap className="w-4 h-4" />
          <span>English LMS Educational Edition</span>
          {isLmsEmbed && (
            <>
              <span aria-hidden="true" className="text-emerald-700">·</span>
              <span className="text-amber-300 font-mono">Antigravity Connected</span>
            </>
          )}
        </div>

        <button
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900/80 border border-slate-700/80 rounded-lg hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </header>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl space-y-6 my-auto">
        {/* Inline SVG Title Lockup */}
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 540 110"
            className="w-full max-w-md h-auto drop-shadow-[0_10px_25px_rgba(34,197,94,0.25)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Botanical decorative leaves */}
            <path
              d="M170 30 C150 15, 120 18, 105 40 C125 42, 155 38, 170 30 Z"
              fill="#22c55e"
              opacity="0.8"
            />
            <path
              d="M370 30 C390 15, 420 18, 435 40 C415 42, 385 38, 370 30 Z"
              fill="#4ade80"
              opacity="0.8"
            />
            <path
              d="M260 16 C270 6, 275 6, 280 16 C275 12, 265 12, 260 16 Z"
              fill="#facc15"
            />
            {/* Title Text */}
            <text
              x="270"
              y="68"
              textAnchor="middle"
              className="font-bold tracking-wider"
              fill="#f8fafc"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '44px',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              VERDANT LEXICON
            </text>
            <text
              x="270"
              y="96"
              textAnchor="middle"
              fill="#86efac"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.24em',
              }}
            >
              VIRTUAL ENGLISH GARDEN
            </text>
          </svg>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mt-3 leading-relaxed">
            Cultivate vocabulary sunflowers and grammar verbenas. Nurture your plot through English quizzes and master native fluency.
          </p>
        </div>

        {/* Student Setup Form */}
        <div className="w-full max-w-md p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="text-left space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Gardener Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your student name..."
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="text-left space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">CEFR English Proficiency Level</label>
            <div className="grid grid-cols-5 gap-1.5">
              {levels.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playClickSound();
                    setLevel(lvl.id);
                  }}
                  title={lvl.desc}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    level === lvl.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {lvl.id}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              {levels.find((l) => l.id === level)?.desc}
            </p>
          </div>

          {/* Primary Start CTA Button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Enter Garden & Begin Planting</span>
          </button>
        </div>
      </div>

      {/* Flat Single-Line Control Hint per Guidelines */}
      <footer className="relative z-10 w-full max-w-4xl text-center">
        <p className="text-xs text-slate-400/90 font-mono tracking-wide">
          WASD / Arrows Move · Space / Click Interact & Cultivate · Esc Pause · Enter to Start
        </p>
      </footer>
    </div>
  );
};
