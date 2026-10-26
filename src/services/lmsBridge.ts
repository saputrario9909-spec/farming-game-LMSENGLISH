import { CefrLevel, LMSConfig, StudentProfile } from '../types/game';

// Interface payload postMessage ke LMS host
export interface LMSPostMessagePayload {
  type: 'LMS_READY' | 'LMS_QUESTION_SUBMIT' | 'LMS_HARVEST' | 'LMS_GRADE_PASSBACK' | 'LMS_HEARTBEAT';
  timestamp: string;
  studentId: string;
  studentName: string;
  score: number;
  xp?: number; // Nilai XP panen atau tambahan XP yang dikirim langsung ke LMS
  accuracy: number;
  gradePercentage: number;
  passed: boolean;
  wordsMasteredCount: number;
  timeSpentSeconds: number;
  metadata?: Record<string, unknown>;
}

export interface LMSMessageEventLog {
  id: string;
  direction: 'OUTGOING' | 'INCOMING';
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export const PRODUCTION_LMS_ORIGIN = 'https://english-studiosmasif.vercel.app';
export const LOCAL_LMS_ORIGIN = 'http://localhost:3000';

class LMSBridgeService {
  private config: LMSConfig = {
    lmsMode: false,
    lmsProvider: 'antigravity',
    autoReportGrade: true,
  };

  private eventListenersAttached = false;
  private messageHistory: LMSMessageEventLog[] = [];
  private onMessageListeners: ((log: LMSMessageEventLog) => void)[] = [];

  constructor() {
    this.parseQueryParams();
    this.setupPostMessageListener();
  }

  /**
   * Mendapatkan target origin yang aman untuk postMessage.
   * - Development / Local: Jika game berjalan di localhost / 127.0.0.1 atau di-embed dari localhost,
   *   gunakan "http://localhost:3000" (atau origin parent localhost / "*") untuk testing.
   * - Production: Kunci target origin ke URL LMS resmi: "https://english-studiosmasif.vercel.app"
   */
  public getTargetOrigin(): string {
    if (typeof window === 'undefined') return PRODUCTION_LMS_ORIGIN;

    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost');

    // Cek juga apakah parent window berasal dari localhost (misal game dibuka via iframe di LMS localhost:3000)
    let isParentLocalhost = false;
    let referrerOrigin: string | null = null;
    try {
      if (document.referrer) {
        const refUrl = new URL(document.referrer);
        if (
          refUrl.hostname === 'localhost' ||
          refUrl.hostname === '127.0.0.1' ||
          refUrl.hostname === '[::1]'
        ) {
          isParentLocalhost = true;
          referrerOrigin = refUrl.origin;
        }
      }
    } catch {
      // Abaikan jika URL referrer tidak valid
    }

    const isDevelopment = Boolean(import.meta.env?.DEV) || isLocalhost || isParentLocalhost;

    // Logika Kondisional:
    if (isDevelopment) {
      // Opsi custom via query param jika disediakan (?target_origin=* atau custom)
      try {
        const params = new URLSearchParams(window.location.search);
        const customOrigin = params.get('target_origin') || params.get('lms_origin');
        if (customOrigin) return customOrigin;
      } catch {
        // Abaikan
      }

      // Prioritaskan referrer origin (misal http://localhost:3000) atau konstanta LOCAL_LMS_ORIGIN
      return referrerOrigin || LOCAL_LMS_ORIGIN;
    }

    // Production environment: selalu kunci ke domain Vercel LMS resmi
    return PRODUCTION_LMS_ORIGIN;
  }

  public parseQueryParams(): LMSConfig {
    if (typeof window === 'undefined') return this.config;

    const params = new URLSearchParams(window.location.search);
    const lms = params.get('lms');
    const embed = params.get('embed');
    const level = params.get('level') as CefrLevel | null;
    const lesson = params.get('lesson');
    const targetScore = params.get('target_score');
    const returnUrl = params.get('return_url');

    this.config = {
      lmsMode: lms !== null || embed === 'true' || window.self !== window.top,
      lmsProvider: (lms as LMSConfig['lmsProvider']) || 'antigravity',
      targetLevel: level || undefined,
      targetLesson: lesson || undefined,
      targetPassScore: targetScore ? parseInt(targetScore, 10) : 250,
      autoReportGrade: true,
      returnUrl: returnUrl || undefined,
    };

    return this.config;
  }

  public getConfig(): LMSConfig {
    return this.config;
  }

  public isEmbedMode(): boolean {
    return this.config.lmsMode;
  }

  private setupPostMessageListener() {
    if (this.eventListenersAttached || typeof window === 'undefined') return;

    window.addEventListener('message', (event) => {
      // Validate event has data
      if (!event.data || typeof event.data !== 'object') return;

      const logEntry: LMSMessageEventLog = {
        id: 'inc_' + Math.random().toString(36).substring(2, 9),
        direction: 'INCOMING',
        type: event.data.type || 'UNKNOWN',
        payload: event.data,
        timestamp: new Date().toLocaleTimeString(),
      };

      this.messageHistory.unshift(logEntry);
      if (this.messageHistory.length > 50) this.messageHistory.pop();
      this.notifyListeners(logEntry);
    });

    this.eventListenersAttached = true;
  }

  public subscribeToLogs(fn: (log: LMSMessageEventLog) => void): () => void {
    this.onMessageListeners.push(fn);
    return () => {
      this.onMessageListeners = this.onMessageListeners.filter(l => l !== fn);
    };
  }

  private notifyListeners(log: LMSMessageEventLog) {
    this.onMessageListeners.forEach(listener => listener(log));
  }

  public getMessageHistory(): LMSMessageEventLog[] {
    return [...this.messageHistory];
  }

  // Sends message to parent LMS iframe or window.opener with secure targetOrigin
  public sendToLMS(payload: LMSPostMessagePayload) {
    if (typeof window === 'undefined') return;

    const logEntry: LMSMessageEventLog = {
      id: 'out_' + Math.random().toString(36).substring(2, 9),
      direction: 'OUTGOING',
      type: payload.type,
      payload: payload as unknown as Record<string, unknown>,
      timestamp: new Date().toLocaleTimeString(),
    };

    this.messageHistory.unshift(logEntry);
    if (this.messageHistory.length > 50) this.messageHistory.pop();
    this.notifyListeners(logEntry);

    const targetOrigin = this.getTargetOrigin();

    const postSafely = (targetWindow: Window) => {
      try {
        targetWindow.postMessage(payload, targetOrigin);
      } catch (err) {
        // Fallback ke wildcard '*' jika di local development testing
        if (targetOrigin !== '*') {
          try {
            targetWindow.postMessage(payload, '*');
          } catch {
            console.warn('[LMSBridge] Failed to postMessage:', err);
          }
        }
      }
    };

    // Send to parent window if in iframe
    if (window.parent && window.parent !== window) {
      postSafely(window.parent);
    }
    // Also send to window.opener if opened via popup
    if (window.opener) {
      postSafely(window.opener);
    }
  }

  // Submit complete grade passback to parent Antigravity LMS
  public submitGradePassback(profile: StudentProfile) {
    const accuracy = profile.totalAnswered > 0 
      ? Math.round((profile.correctAnswers / profile.totalAnswered) * 100) 
      : 100;
    
    // Scale grade: score vs target or accuracy * mastery
    const targetScore = this.config.targetPassScore || 250;
    const gradePercentage = Math.min(100, Math.round((profile.xp / targetScore) * 100));
    const passed = profile.xp >= targetScore || (profile.totalAnswered >= 5 && accuracy >= 70);

    const payload: LMSPostMessagePayload = {
      type: 'LMS_GRADE_PASSBACK',
      timestamp: new Date().toISOString(),
      studentId: profile.studentId,
      studentName: profile.studentName,
      score: profile.xp,
      accuracy,
      gradePercentage,
      passed,
      wordsMasteredCount: Object.keys(profile.masteryBook).length,
      timeSpentSeconds: profile.timeSpentSeconds,
      metadata: {
        coins: profile.coins,
        streak: profile.streak,
        highestStreak: profile.highestStreak,
        cropsHarvested: profile.cropsHarvested,
        masteredVocabulary: Object.values(profile.masteryBook).map(m => m.wordOrRule),
      },
    };

    this.sendToLMS(payload);
    return payload;
  }

  // Export CSV for LMS Gradebook
  public generateGradebookCSV(profile: StudentProfile): string {
    const accuracy = profile.totalAnswered > 0 
      ? Math.round((profile.correctAnswers / profile.totalAnswered) * 100) 
      : 100;
    
    const rows = [
      ['Student ID', 'Student Name', 'Total XP', 'Coins', 'Accuracy (%)', 'Total Answered', 'Correct Answers', 'Crops Harvested', 'Words Mastered', 'Time Spent (s)', 'Completion Status', 'Timestamp'],
      [
        `"${profile.studentId}"`,
        `"${profile.studentName}"`,
        profile.xp,
        profile.coins,
        `${accuracy}%`,
        profile.totalAnswered,
        profile.correctAnswers,
        profile.cropsHarvested,
        Object.keys(profile.masteryBook).length,
        profile.timeSpentSeconds,
        profile.xp >= 200 ? 'PASSED' : 'IN_PROGRESS',
        `"${new Date().toISOString()}"`,
      ]
    ];

    return rows.map(r => r.join(',')).join('\n');
  }

  // Generate xAPI / Tin Can statement JSON
  public generateXAPIStatement(profile: StudentProfile): Record<string, unknown> {
    const accuracy = profile.totalAnswered > 0 
      ? profile.correctAnswers / profile.totalAnswered 
      : 1.0;

    return {
      actor: {
        objectType: 'Agent',
        name: profile.studentName,
        account: {
          homePage: 'https://antigravity-lms.internal',
          name: profile.studentId,
        },
      },
      verb: {
        id: profile.xp >= 200 ? 'http://adlnet.gov/expapi/verbs/passed' : 'http://adlnet.gov/expapi/verbs/experienced',
        display: { 'en-US': profile.xp >= 200 ? 'passed' : 'practiced' },
      },
      object: {
        id: 'https://ais.internal/verdant-lexicon-game',
        definition: {
          name: { 'en-US': 'Verdant Lexicon: English Botanical Farming Game' },
          description: { 'en-US': 'Interactive virtual garden incorporating vocabulary quizzes and grammar challenges' },
          type: 'http://adlnet.gov/expapi/activities/game',
        },
      },
      result: {
        score: {
          raw: profile.xp,
          min: 0,
          max: 500,
          scaled: Math.min(1.0, profile.xp / 500),
        },
        success: profile.xp >= 200,
        completion: true,
        duration: `PT${profile.timeSpentSeconds}S`,
        extensions: {
          'https://antigravity.lms/accuracy': `${Math.round(accuracy * 100)}%`,
          'https://antigravity.lms/mastered_words': Object.keys(profile.masteryBook).length,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const lmsBridge = new LMSBridgeService();
