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
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-gradient-to-br from-[#1E121A] via-[#2A1B22] to-[#775465]/30">
      {/* Live Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#775465]/25 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[400px] bg-[#A37B8E]/15 rounded-full blur-[140px]" />

        {/* Ambient floating botanical particles */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-[#D4A5B8] animate-pulse"
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
        <div className="flex items-center gap-2 text-xs font-medium text-[#EADDE5] tracking-wide">
          <GraduationCap className="w-4 h-4 text-[#D4A5B8]" />
          <span>English LMS Educational Edition</span>
          {isLmsEmbed && (
            <>
              <span aria-hidden="true" className="text-[#775465]">·</span>
              <span className="text-[#F3E8EE] font-mono">Antigravity Connected</span>
            </>
          )}
        </div>

        <button
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#FAF6F4] glass-button rounded-xl cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#D4A5B8]" />}
          <span>{isMuted ? 'Muted' : 'Audio On'}</span>
        </button>
      </header>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl space-y-6 my-auto">
        {/* Inline SVG Title Lockup */}
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 540 110"
            className="w-full max-w-md h-auto drop-shadow-[0_10px_25px_rgba(119,84,101,0.4)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Botanical decorative leaves */}
            <path
              d="M170 30 C150 15, 120 18, 105 40 C125 42, 155 38, 170 30 Z"
              fill="#775465"
              opacity="0.8"
            />
            <path
              d="M370 30 C390 15, 420 18, 435 40 C415 42, 385 38, 370 30 Z"
              fill="#A37B8E"
              opacity="0.8"
            />
            <path
              d="M260 16 C270 6, 275 6, 280 16 C275 12, 265 12, 260 16 Z"
              fill="#D4A5B8"
            />
            {/* Title Text */}
            <text
              x="270"
              y="68"
              textAnchor="middle"
              className="font-bold tracking-wider"
              fill="#FAF6F4"
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
              fill="#EADDE5"
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

          <p className="text-sm sm:text-base text-[#D8C7D2] max-w-lg mt-3 leading-relaxed">
            Cultivate vocabulary sunflowers and grammar verbenas. Nurture your plot through English quizzes and master native fluency.
          </p>
        </div>

        {/* Student Setup Form with Glassmorphism */}
        <div className="w-full max-w-md p-6 glass-panel space-y-4">
          <div className="text-left space-y-1.5">
            <label className="text-xs font-semibold text-[#EADDE5]">Gardener Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your student name..."
              className="w-full px-3.5 py-2 text-sm bg-[#1E121A]/70 border border-[#775465]/50 rounded-xl text-[#FAF6F4] placeholder-[#A4949E] focus:outline-hidden focus:border-[#EADDE5] transition-colors"
            />
          </div>

          <div className="text-left space-y-1.5">
            <label className="text-xs font-semibold text-[#EADDE5]">CEFR English Proficiency Level</label>
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
                      ? 'bg-[#775465] text-white border-[#EADDE5] shadow-xs'
                      : 'bg-[#1E121A]/80 text-[#D8C7D2] border-[#775465]/40 hover:border-[#775465] hover:text-white'
                  }`}
                >
                  {lvl.id}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#A4949E] italic">
              {levels.find((l) => l.id === level)?.desc}
            </p>
          </div>

          {/* Primary Start CTA Button with Glassmorphism Glow */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white glass-button flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer hover:shadow-[0_0_25px_rgba(119,84,101,0.7)]"
          >
            <Play className="w-4 h-4 fill-white text-white" />
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
