import { CefrLevel, ChallengeCategory, EnglishChallenge } from '../types/game';

const LMS_API_URL = 'https://english-studiosmasif.vercel.app/api/game/questions';

export interface LMSQuestionRaw {
  Question_ID?: string;
  Category?: string;
  Level?: string;
  Question_Text?: string;
  Option_A?: string;
  Option_B?: string;
  Option_C?: string;
  Option_D?: string;
  Correct_Answer?: string;
  Explanation?: string;
}

/**
 * Normalisasi nama kategori ke ChallengeCategory yang didukung game
 */
function normalizeCategory(rawCat: string = ''): ChallengeCategory {
  const c = rawCat.toLowerCase().trim();
  if (c.includes('grammar') || c.includes('tense')) return 'grammar_tenses';
  if (c.includes('prep')) return 'prepositions';
  if (c.includes('idiom')) return 'idioms';
  if (c.includes('colloc')) return 'collocations';
  if (c.includes('phrasal')) return 'phrasal_verbs';
  return 'vocabulary';
}

/**
 * Normalisasi CEFR Level
 */
function normalizeLevel(rawLevel: string = ''): CefrLevel {
  const l = rawLevel.toUpperCase().trim();
  if (['A1', 'A2', 'B1', 'B2', 'C1'].includes(l)) {
    return l as CefrLevel;
  }
  return 'B1';
}

/**
 * Memetakan item raw dari LMS Google Sheets API ke EnglishChallenge format Game
 */
function mapRawToChallenge(item: LMSQuestionRaw, index: number): EnglishChallenge {
  const optA = String(item.Option_A || '').trim();
  const optB = String(item.Option_B || '').trim();
  const optC = String(item.Option_C || '').trim();
  const optD = String(item.Option_D || '').trim();

  const options = [optA, optB, optC, optD].filter(Boolean);

  let answerText = String(item.Correct_Answer || '').trim();
  const upperAns = answerText.toUpperCase();

  if (upperAns === 'A' || upperAns === 'OPTION_A' || upperAns === 'OPTION A') {
    answerText = optA;
  } else if (upperAns === 'B' || upperAns === 'OPTION_B' || upperAns === 'OPTION B') {
    answerText = optB;
  } else if (upperAns === 'C' || upperAns === 'OPTION_C' || upperAns === 'OPTION C') {
    answerText = optC;
  } else if (upperAns === 'D' || upperAns === 'OPTION_D' || upperAns === 'OPTION D') {
    answerText = optD;
  }

  return {
    id: item.Question_ID ? String(item.Question_ID).trim() : `lms_q_${index}_${Date.now()}`,
    category: normalizeCategory(item.Category),
    level: normalizeLevel(item.Level),
    type: 'multiple_choice',
    prompt: item.Question_Text || 'Pilih jawaban yang benar:',
    options,
    correctAnswer: answerText,
    explanation: item.Explanation || 'Perhatikan opsi jawaban yang tepat di atas.',
    exampleSentence: item.Question_Text || '',
    hint: 'Perhatikan petunjuk konteks dan struktur kalimat.',
  };
}

/**
 * Mengambil bank soal dari LMS API dan memetakannya ke EnglishChallenge[]
 */
export async function fetchQuestionsFromLMS(
  category?: string,
  level?: string
): Promise<EnglishChallenge[]> {
  try {
    const params = new URLSearchParams();
    if (category && category.trim()) params.append('category', category.trim());
    if (level && level.trim()) params.append('level', level.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const url = `${LMS_API_URL}${queryString}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-cache',
    });

    if (!res.ok) {
      console.warn(`[LMS Question Fetcher] Failed with HTTP status: ${res.status}`);
      return [];
    }

    const json = await res.json();
    if (!json?.success || !Array.isArray(json?.data) || json.data.length === 0) {
      return [];
    }

    const challenges: EnglishChallenge[] = json.data.map((item: LMSQuestionRaw, idx: number) =>
      mapRawToChallenge(item, idx)
    );

    return challenges;
  } catch (error) {
    console.warn('[LMS Question Fetcher] Error fetching questions from LMS:', error);
    return [];
  }
}
