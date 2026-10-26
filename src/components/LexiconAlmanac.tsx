import React, { useState } from 'react';
import { ChallengeCategory, CefrLevel, StudentMasteryEntry } from '../types/game';
import { gameAudio } from '../services/audio';
import { BookOpen, Search, Volume2, Star, X, Sparkles } from 'lucide-react';

interface LexiconAlmanacProps {
  masteryBook: Record<string, StudentMasteryEntry>;
  onClose: () => void;
  onPracticeEntry?: (entry: StudentMasteryEntry) => void;
}

export const LexiconAlmanac: React.FC<LexiconAlmanacProps> = ({
  masteryBook,
  onClose,
  onPracticeEntry,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const entries = Object.values(masteryBook);

  const filteredEntries = entries.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (selectedLevel !== 'all' && e.level !== selectedLevel) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.wordOrRule.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q) ||
        e.exampleSentence.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Knowledge' },
    { id: 'vocabulary', label: 'Vocabulary' },
    { id: 'grammar_tenses', label: 'Grammar Tenses' },
    { id: 'prepositions', label: 'Prepositions' },
    { id: 'idioms', label: 'Idioms' },
    { id: 'collocations', label: 'Collocations' },
    { id: 'phrasal_verbs', label: 'Phrasal Verbs' },
  ];

  const levels: (CefrLevel | 'all')[] = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'];

  const handleSpeak = (text: string) => {
    gameAudio.playClickSound();
    gameAudio.speakEnglish(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                Botanical Lexicon Almanac
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{entries.length} Concepts Cultivated</span>
                <span aria-hidden="true">·</span>
                <span>English Student Notebook</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words, definitions..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 mr-1.5 shrink-0">Level:</span>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    gameAudio.playClickSound();
                    setSelectedLevel(lvl);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    selectedLevel === lvl
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {lvl.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  gameAudio.playClickSound();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium">No botanical terms recorded in this category yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Water and harvest crops in your garden to expand your vocabulary and grammar almanac!
              </p>
            </div>
          ) : (
            filteredEntries.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-slate-600 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-amber-300 font-sans tracking-tight">
                        {item.wordOrRule}
                      </h3>
                      <button
                        onClick={() => handleSpeak(item.wordOrRule)}
                        title="Pronounce"
                        className="p-1 text-slate-400 hover:text-emerald-400 rounded-md transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Unboxed metadata per constitution */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="capitalize">{item.category.replace('_', ' ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>Level {item.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>Practiced {item.timesEncountered} times</span>
                    </div>
                  </div>

                  {/* Stars / Mastery indicator */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 3 }).map((_, sIdx) => (
                      <Star
                        key={sIdx}
                        className={`w-4 h-4 ${
                          sIdx < Math.min(3, item.timesCorrect)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{item.definition}</p>

                {item.exampleSentence && (
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-emerald-300/90 italic flex items-center justify-between gap-3">
                    <span>"{item.exampleSentence}"</span>
                    <button
                      onClick={() => handleSpeak(item.exampleSentence)}
                      title="Listen to full sentence"
                      className="shrink-0 p-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/60 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Tap the speaker icon to hear clear native English pronunciation.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Return to Garden
          </button>
        </div>
      </div>
    </div>
  );
};
