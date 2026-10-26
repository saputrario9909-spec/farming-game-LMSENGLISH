import { CefrLevel, ChallengeCategory, ChallengeType, EnglishChallenge } from '../types/game';

const LMS_API_URL = 'https://english-studiosmasif.vercel.app/api/game/questions';

export interface LMSQuestionRaw {
  Question_ID?: string;
  Category?: string;
  Level?: string;
  Question_Type?: string;
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

  // Tentukan jenis soal berdasarkan Question_Type
  let challengeType: ChallengeType = 'multiple_choice';
  const rawType = String(item.Question_Type || '').toLowerCase();
  if (rawType.includes('complex') || rawType.includes('multi')) {
    challengeType = 'complex_mcq';
  } else if (rawType.includes('true')) {
    challengeType = 'true_false';
  } else if (rawType.includes('fill')) {
    challengeType = 'fill_in_the_blank';
  }

  return {
    id: item.Question_ID ? String(item.Question_ID).trim() : `lms_q_${index}_${Date.now()}`,
    category: normalizeCategory(item.Category),
    level: normalizeLevel(item.Level),
    type: challengeType,
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
 * Parameter category dan level dipertahankan di signature, namun pengambilan soal mengambil semua data tanpa filter level/kategori.
 * Soal bertipe bacaan panjang (reading/passage) dan teks pertanyaan yang terlalu panjang (>200 karakter) otomatis disaring keluar.
 */
export async function fetchQuestionsFromLMS(
  _category?: string,
  _level?: string
): Promise<EnglishChallenge[]> {
  try {
    const url = LMS_API_URL;

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

    // Filter Reading: Buang soal reading/passage atau soal dengan Question_Text > 200 karakter
    const eligibleData = json.data.filter((item: LMSQuestionRaw) => {
      const qType = String(item.Question_Type || '').toLowerCase();
      if (qType.includes('reading') || qType.includes('passage') || qType.includes('text')) {
        return false;
      }
      const qText = String(item.Question_Text || '').trim();
      if (qText.length > 200) {
        return false;
      }
      return true;
    });

    const challenges: EnglishChallenge[] = eligibleData.map((item: LMSQuestionRaw, idx: number) =>
      mapRawToChallenge(item, idx)
    );

    return challenges;
  } catch (error) {
    console.warn('[LMS Question Fetcher] Error fetching questions from LMS:', error);
    return [];
  }
}
