import React, { useState } from 'react';
import { EnglishChallenge, GardenPlot } from '../types/game';
import { gameAudio } from '../services/audio';
import { Volume2, HelpCircle, Check, ArrowRight, RefreshCw, X } from 'lucide-react';

interface ChallengeModalProps {
  plot: GardenPlot;
  challenge: EnglishChallenge;
  onSuccess: (challenge: EnglishChallenge) => void;
  onClose: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  plot,
  challenge,
  onSuccess,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [scrambleOrder, setScrambleOrder] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const isComplexMcq = challenge.type === 'complex_mcq';

  // Clean question prompt text (prevent 'multiple_choice' or raw types appearing as question text)
  const isTypePrompt = ['multiple_choice', 'complex_mcq', 'true_false', 'fill_in_the_blank', 'sentence_scramble', 'word_unscramble']
    .includes(String(challenge.prompt || '').trim().toLowerCase());
  const cleanPrompt = !isTypePrompt && challenge.prompt?.trim()
    ? challenge.prompt
    : (challenge.exampleSentence && !['multiple_choice', 'complex_mcq'].includes(challenge.exampleSentence.toLowerCase())
        ? challenge.exampleSentence
        : 'Choose the best answer for the question:');

  // Audio pronunciation
  const handleListen = () => {
    gameAudio.playClickSound();
    const textToSpeak = challenge.targetWord || challenge.correctAnswer || cleanPrompt;
    gameAudio.speakEnglish(textToSpeak);
  };

  // Option selection
  const handleSelectOption = (opt: string) => {
    if (isSubmitted && isCorrect) return;
    gameAudio.playClickSound();

    if (isComplexMcq) {
      if (selectedOptions.includes(opt)) {
        setSelectedOptions(selectedOptions.filter(o => o !== opt));
      } else {
        setSelectedOptions([...selectedOptions, opt]);
      }
    } else {
      setSelectedOption(opt);
    }
  };

  // Sentence scramble click word
  const handleToggleScrambleWord = (word: string) => {
    if (isSubmitted && isCorrect) return;
    gameAudio.playClickSound();
    if (scrambleOrder.includes(word)) {
      setScrambleOrder(scrambleOrder.filter(w => w !== word));
    } else {
      setScrambleOrder([...scrambleOrder, word]);
    }
  };

  // Submission validation
  const handleSubmit = () => {
    let correct = false;

    if (challenge.type === 'sentence_scramble') {
      const constructed = scrambleOrder.join(' ');
      correct = constructed.trim().toLowerCase() === challenge.correctAnswer.trim().toLowerCase();
    } else if (isComplexMcq) {
      // Bandingkan array jawaban yang dipilih user dengan challenge.correctAnswers
      const targets = (challenge.correctAnswers && challenge.correctAnswers.length > 0)
        ? challenge.correctAnswers.map(a => a.trim().toLowerCase())
        : [challenge.correctAnswer.trim().toLowerCase()];

      const userChoices = selectedOptions.map(o => o.trim().toLowerCase());

      correct = targets.length === userChoices.length &&
        targets.every(t => userChoices.includes(t));
    } else {
      correct = selectedOption?.trim().toLowerCase() === challenge.correctAnswer.trim().toLowerCase();
    }

    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      gameAudio.playCorrectSound();
    } else {
      gameAudio.playIncorrectSound();
    }
  };

  const handleProceed = () => {
    gameAudio.playClickSound();
    onSuccess(challenge);
  };

  const handleRetry = () => {
    gameAudio.playClickSound();
    setIsSubmitted(false);
    setSelectedOption(null);
    setSelectedOptions([]);
    setScrambleOrder([]);
  };

  // Human friendly category label
  const categoryLabels: Record<string, string> = {
    vocabulary: 'Vocabulary & Nuance',
    grammar_tenses: 'Grammar & Verb Tenses',
    prepositions: 'Prepositions & Syntax',
    idioms: 'English Idioms & Phrases',
    collocations: 'Natural Collocations',
    phrasal_verbs: 'Phrasal Verbs',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: plot.crop?.bloomColor || '#22c55e' }} />
            <div>
              <h2 className="text-base font-semibold text-slate-100 font-sans tracking-tight">
                {plot.crop ? `${plot.crop.name} Challenge` : 'Garden Soil Challenge'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{categoryLabels[challenge.category] || challenge.category}</span>
                <span aria-hidden="true">·</span>
                <span>Level {challenge.level}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">
                  {challenge.type === 'complex_mcq' ? 'Complex MCQ' : challenge.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
          {/* Question Prompt */}
          <div className="space-y-3">
            {isComplexMcq && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Pilih lebih dari satu jawaban (Complex MCQ)</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <p className="text-lg font-medium text-slate-100 leading-relaxed font-sans">
                {cleanPrompt}
              </p>
              <button
                onClick={handleListen}
                title="Pronounce target word or sentence"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen</span>
              </button>
            </div>

            {challenge.targetWord && (
              <div className="text-xs text-emerald-400 font-mono tracking-wide">
                Target Concept: <span className="font-bold underline underline-offset-4">{challenge.targetWord}</span>
              </div>
            )}
          </div>

          {/* Interactive Input Zone */}
          {challenge.type === 'sentence_scramble' ? (
            <div className="space-y-4">
              {/* Output Construction Zone */}
              <div className="min-h-[56px] p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap gap-2 items-center">
                {scrambleOrder.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Click words below in order to build the sentence...</span>
                ) : (
                  scrambleOrder.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleScrambleWord(word)}
                      className="px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg shadow-xs hover:bg-emerald-500 transition-colors"
                    >
                      {word}
                    </button>
                  ))
                )}
              </div>

              {/* Scrambled Word Pool */}
              <div className="flex flex-wrap gap-2 pt-2">
                {challenge.scrambledWords?.map((word, idx) => {
                  const isUsed = scrambleOrder.includes(word);
                  return (
                    <button
                      key={idx}
                      disabled={isUsed || (isSubmitted && isCorrect)}
                      onClick={() => handleToggleScrambleWord(word)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                        isUsed
                          ? 'opacity-30 border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-750 text-slate-200'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Multiple Choice (Single) or Complex MCQ (Checkbox) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {challenge.options?.map((option, idx) => {
                const isSelected = isComplexMcq
                  ? selectedOptions.includes(option)
                  : selectedOption === option;

                const targetAnswers = (challenge.correctAnswers && challenge.correctAnswers.length > 0)
                  ? challenge.correctAnswers.map(a => a.trim().toLowerCase())
                  : [challenge.correctAnswer.trim().toLowerCase()];

                const isTargetCorrect = targetAnswers.includes(option.trim().toLowerCase());

                let optionStyle = 'border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-200';

                if (isSubmitted) {
                  if (isTargetCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-950/80 text-emerald-200 font-semibold ring-2 ring-emerald-500/40';
                  } else if (isSelected && !isTargetCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-950/80 text-rose-200 line-through';
                  } else {
                    optionStyle = 'opacity-40 border-slate-800 bg-slate-900 text-slate-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-amber-400 bg-amber-950/50 text-amber-200 ring-2 ring-amber-400/30';
                }

                const isFifthInFive = idx === 4 && challenge.options?.length === 5;

                return (
                  <button
                    key={idx}
                    disabled={isSubmitted && isCorrect}
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-center gap-3 p-3.5 text-left text-sm rounded-xl border transition-all cursor-pointer ${
                      isFifthInFive ? 'sm:col-span-2' : ''
                    } ${optionStyle}`}
                  >
                    {isComplexMcq ? (
                      /* Checkbox style indicator */
                      <div
                        className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-xs'
                            : 'border-slate-600 bg-slate-800 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      /* Radio / Letter indicator */
                      <span className="w-6 h-6 shrink-0 rounded-md bg-slate-700/50 flex items-center justify-center text-xs font-mono text-slate-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                    )}

                    <span className="flex-1 font-medium">
                      {isComplexMcq && (
                        <span className="text-xs font-mono text-slate-400 mr-2">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                      )}
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Feedback & Pedagogical Explanation */}
          {isSubmitted && (
            <div
              className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-100'
                  : 'bg-rose-950/40 border-rose-800/70 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                {isCorrect ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Splendid! Plant nourished (+40 XP & Growth Stage)</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-300">Not quite yet. Review the explanation below:</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{challenge.explanation}</p>
              {isComplexMcq && challenge.correctAnswers && (
                <div className="text-xs text-emerald-300/90 font-medium pt-1">
                  Correct answers: {challenge.correctAnswers.join(', ')}
                </div>
              )}
              {challenge.exampleSentence && (
                <div className="text-xs text-slate-400 italic pt-1 border-t border-slate-800">
                  Example: "{challenge.exampleSentence}"
                </div>
              )}
            </div>
          )}

          {/* Hint Disclosure */}
          {!isSubmitted && (
            <div>
              {showHint ? (
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{challenge.hint}</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Need a pedagogical hint?</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-t border-slate-700/80">
          <div className="text-xs text-slate-400">
            {isCorrect
              ? 'Crop received moisture and nutrients'
              : isComplexMcq
              ? 'Pilih lebih dari satu jawaban (Complex MCQ)'
              : 'Select an option to advance plant growth'}
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted ? (
              <button
                disabled={
                  challenge.type === 'sentence_scramble'
                    ? scrambleOrder.length === 0
                    : isComplexMcq
                    ? selectedOptions.length === 0
                    : !selectedOption
                }
                onClick={handleSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                Submit Answer
              </button>
            ) : isCorrect ? (
              <button
                onClick={handleProceed}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer shadow-sm"
              >
                <span>Nurture & Return</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
