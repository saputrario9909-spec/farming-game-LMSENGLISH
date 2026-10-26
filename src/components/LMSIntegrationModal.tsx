import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types/game';
import { lmsBridge, LMSMessageEventLog } from '../services/lmsBridge';
import { gameAudio } from '../services/audio';
import {
  Share2,
  Copy,
  Check,
  Download,
  Code2,
  Send,
  Terminal,
  FileSpreadsheet,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface LMSIntegrationModalProps {
  profile: StudentProfile;
  onClose: () => void;
  onSimulateGradePassback: () => void;
}

export const LMSIntegrationModal: React.FC<LMSIntegrationModalProps> = ({
  profile,
  onClose,
  onSimulateGradePassback,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'embed' | 'bridge' | 'export' | 'guide'>('embed');
  const [logs, setLogs] = useState<LMSMessageEventLog[]>([]);

  // Embed customization options
  const [embedLesson, setEmbedLesson] = useState<string>('all');
  const [embedLevel, setEmbedLevel] = useState<string>('B1');
  const [embedTargetXp, setEmbedTargetXp] = useState<number>(250);

  useEffect(() => {
    setLogs(lmsBridge.getMessageHistory());
    const unsubscribe = lmsBridge.subscribeToLogs(() => {
      setLogs(lmsBridge.getMessageHistory());
    });
    return unsubscribe;
  }, []);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://your-app-url';
  const embedUrl = `${baseUrl}?lms=antigravity&lesson=${embedLesson}&level=${embedLevel}&target_score=${embedTargetXp}&embed=true`;

  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="700"
  style="border: none; border-radius: 12px; overflow: hidden;"
  title="Verdant Lexicon English Farming Game"
  allow="autoplay"
></iframe>`;

  const reactSnippet = `import React, { useEffect, useState } from 'react';

// Antigravity LMS English Garden Integration Component
export function AntigravityEnglishGarden({ studentId, studentName, onScoreSubmit }) {
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    const handleLMSMessage = (event) => {
      // Security check: match event origin if required
      if (event.data?.type === 'LMS_GRADE_PASSBACK') {
        const { score, gradePercentage, passed, accuracy, wordsMasteredCount } = event.data;
        console.log('[Antigravity LMS] Grade Received:', { score, gradePercentage, passed });
        setGameResult(event.data);
        if (onScoreSubmit) {
          onScoreSubmit(event.data);
        }
      }
    };

    window.addEventListener('message', handleLMSMessage);
    return () => window.removeEventListener('message', handleLMSMessage);
  }, [onScoreSubmit]);

  const embedUrl = "${baseUrl}?lms=antigravity&student_id=" + encodeURIComponent(studentId) + 
                   "&student_name=" + encodeURIComponent(studentName) +
                   "&level=${embedLevel}&target_score=${embedTargetXp}&embed=true";

  return (
    <div className="w-full flex flex-col items-center">
      <iframe
        src={embedUrl}
        className="w-full h-[700px] rounded-xl border border-slate-700 shadow-xl"
        title="Verdant Lexicon"
        allow="autoplay"
      />
      {gameResult && (
        <div className="mt-3 p-3 bg-emerald-950 text-emerald-200 text-xs rounded-lg border border-emerald-800">
          Grade synced to Antigravity LMS: {gameResult.gradePercentage}% ({gameResult.passed ? 'Passed' : 'In Progress'})
        </div>
      )}
    </div>
  );
}`;

  const copyToClipboard = (text: string, key: string) => {
    gameAudio.playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadCSV = () => {
    gameAudio.playClickSound();
    const csvContent = lmsBridge.generateGradebookCSV(profile);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `verdant_lexicon_gradebook_${profile.studentId || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadXAPI = () => {
    gameAudio.playClickSound();
    const xapi = lmsBridge.generateXAPIStatement(profile);
    const blob = new Blob([JSON.stringify(xapi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xapi_statement_${profile.studentId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTestPassback = () => {
    gameAudio.playCorrectSound();
    onSimulateGradePassback();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                Antigravity LMS Integration Bridge
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Embed Code</span>
                <span aria-hidden="true">·</span>
                <span>postMessage Grade Passback</span>
                <span aria-hidden="true">·</span>
                <span>CSV Gradebook</span>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          {[
            { id: 'embed', label: '1. Embed & Iframe Code', icon: Code2 },
            { id: 'bridge', label: '2. Live postMessage Bridge', icon: Terminal },
            { id: 'export', label: '3. Gradebook & xAPI Export', icon: FileSpreadsheet },
            { id: 'guide', label: '4. Antigravity Guide', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  gameAudio.playClickSound();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'embed' && (
            <div className="space-y-5">
              {/* Customizer */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Configure Lesson Parameters for Your LMS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Curriculum</label>
                    <select
                      value={embedLesson}
                      onChange={(e) => setEmbedLesson(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="all">Full Garden (All Categories)</option>
                      <option value="vocabulary">Vocabulary & Synonyms Only</option>
                      <option value="grammar_tenses">Verb Tenses Only</option>
                      <option value="prepositions">Prepositions Only</option>
                      <option value="idioms">Idioms Only</option>
                      <option value="phrasal_verbs">Phrasal Verbs Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">CEFR Level</label>
                    <select
                      value={embedLevel}
                      onChange={(e) => setEmbedLevel(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    >
                      <option value="A1">A1 Beginner</option>
                      <option value="A2">A2 Elementary</option>
                      <option value="B1">B1 Intermediate</option>
                      <option value="B2">B2 Upper Intermediate</option>
                      <option value="C1">C1 Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Passing XP Target</label>
                    <input
                      type="number"
                      value={embedTargetXp}
                      onChange={(e) => setEmbedTargetXp(Number(e.target.value))}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* HTML Iframe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Standard HTML / iframe Snippet</span>
                  <button
                    onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
                    className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'iframe' ? 'Copied!' : 'Copy Iframe'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                  {iframeSnippet}
                </pre>
              </div>

              {/* React Component for Antigravity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Antigravity React Component (With Grade Sync Listener)</span>
                  <button
                    onClick={() => copyToClipboard(reactSnippet, 'react')}
                    className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'react' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'react' ? 'Copied!' : 'Copy React Component'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                  {reactSnippet}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'bridge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Real-Time postMessage Inspector</h3>
                  <p className="text-xs text-slate-400">
                    Events sent between this game iframe and your Antigravity LMS host.
                  </p>
                </div>
                <button
                  onClick={handleTestPassback}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch LMS Grade Passback</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No postMessage events logged yet. Click "Dispatch LMS Grade Passback" to test!
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            log.direction === 'OUTGOING' ? 'text-amber-400' : 'text-blue-400'
                          }`}
                        >
                          [{log.direction}] {log.type}
                        </span>
                        <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      </div>
                      <pre className="text-[11px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Student Performance Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Total Score</span>
                    <span className="text-base font-bold text-amber-400">{profile.xp} XP</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Accuracy</span>
                    <span className="text-base font-bold text-emerald-400">
                      {profile.totalAnswered > 0
                        ? Math.round((profile.correctAnswers / profile.totalAnswered) * 100)
                        : 100}
                      %
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Crops Harvested</span>
                    <span className="text-base font-bold text-slate-200">{profile.cropsHarvested}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Words Mastered</span>
                    <span className="text-base font-bold text-indigo-400">
                      {Object.keys(profile.masteryBook).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>LMS Gradebook CSV</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Formatted for direct import into Canvas, Moodle, Blackboard, Google Classroom, or your Antigravity database.
                  </p>
                  <button
                    onClick={handleDownloadCSV}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Gradebook</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>xAPI / Tin Can JSON</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Full Learning Record Store (LRS) activity statement with actor, verb, and score scaling.
                  </p>
                  <button
                    onClick={handleDownloadXAPI}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download xAPI Statement</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <h3 className="text-sm font-semibold text-amber-400">
                  How to embed this farming game into Antigravity LMS
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    <strong className="text-white">Copy the React component</strong> from Tab 1 into your Antigravity LMS repository under `components/EnglishGardenGame.tsx`.
                  </li>
                  <li>
                    <strong className="text-white">Pass student context</strong> (such as `user.id`, `user.name`, and the target course module) as props.
                  </li>
                  <li>
                    <strong className="text-white">Listen to window postMessage</strong>: The game automatically dispatches `LMS_GRADE_PASSBACK` whenever a student reaches their XP milestone or harvests their crops.
                  </li>
                  <li>
                    <strong className="text-white">Persist the Grade</strong>: In your LMS backend route or database (PostgreSQL/Supabase/Firebase), save `score`, `accuracy`, and `passed: true`.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">Supported Query Parameters</h4>
                <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                  <li><span className="text-emerald-400">?lms=antigravity</span> - Enables LMS mode</li>
                  <li><span className="text-emerald-400">?student_id=S123</span> - Student identification</li>
                  <li><span className="text-emerald-400">?student_name=Maria</span> - Displayed student name</li>
                  <li><span className="text-emerald-400">?level=A1|A2|B1|B2|C1</span> - Preselects CEFR curriculum</li>
                  <li><span className="text-emerald-400">?target_score=300</span> - Custom passing grade threshold</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/60 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <span>Antigravity Ready · postMessage & xAPI Standard Compliant</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
