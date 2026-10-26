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
  // 1. Pastikan prompt diambil dari Question_Text. Jika kosong, gunakan item.prompt. JANGAN gunakan Question_Type!
  let promptText = String(item.Question_Text || (item as any).prompt || '').trim();

  // Jika Question_Text secara tidak sengaja berisi nama tipe soal (misal "multiple_choice"), pulihkan teks sebenarnya
  const isTypeAsPrompt = ['multiple_choice', 'complex_mcq', 'true_false', 'fill_in_the_blank', 'sentence_scramble', 'word_unscramble'].includes(promptText.toLowerCase());
  if (isTypeAsPrompt || !promptText) {
    if ((item as any).prompt && !['multiple_choice', 'complex_mcq', 'true_false', 'fill_in_the_blank'].includes(String((item as any).prompt).toLowerCase())) {
      promptText = String((item as any).prompt).trim();
    } else if (item.Option_A && isTypeAsPrompt) {
      // Terjadi pergeseran kolom data lama di mana Option_A menyimpan teks prompt
      promptText = String(item.Option_A).trim();
    } else {
      promptText = 'Choose the correct answer:';
    }
  }

  // 2. Ekstrak opsi A, B, C, D
  let optA = String(item.Option_A || '').trim();
  let optB = String(item.Option_B || '').trim();
  let optC = String(item.Option_C || '').trim();
  let optD = String(item.Option_D || '').trim();

  // Jika baris tergeser (Option_A sebelumnya adalah teks prompt)
  if (String(item.Question_Text || '').trim().toLowerCase() === 'multiple_choice') {
    optA = optB;
    optB = optC;
    optC = optD;
    optD = String(item.Correct_Answer || '').trim();
  }

  const options = [optA, optB, optC, optD].filter(Boolean);

  // 3. Ekstrak Correct_Answer. Jika berisi koma (misal "C,D"), ambil jawaban pertama saja
  let answerRaw = String(item.Correct_Answer || (item as any).correct_answer || (item as any).answer || '').trim();
  if (answerRaw.includes(',')) {
    answerRaw = answerRaw.split(',')[0].trim();
  }

  const cleanAns = answerRaw.toUpperCase().replace(/[\(\)\.\:\_\-]/g, '').trim();
  let answerText = answerRaw;

  // Jika berupa huruf A/B/C/D atau label opsi, cocokkan dengan teks opsi yang sesuai
  if (cleanAns === 'A' || cleanAns === 'OPTION A' || cleanAns === 'OPSI A') {
    answerText = optA || answerText;
  } else if (cleanAns === 'B' || cleanAns === 'OPTION B' || cleanAns === 'OPSI B') {
    answerText = optB || answerText;
  } else if (cleanAns === 'C' || cleanAns === 'OPTION C' || cleanAns === 'OPSI C') {
    answerText = optC || answerText;
  } else if (cleanAns === 'D' || cleanAns === 'OPTION D' || cleanAns === 'OPSI D') {
    answerText = optD || answerText;
  } else if (!answerText && options.length > 0) {
    // Fallback jika kosong
    answerText = options[0];
  }

  // 4. Tentukan jenis soal berdasarkan Question_Type
  let challengeType: ChallengeType = 'multiple_choice';
  const rawType = String(item.Question_Type || (item as any).type || '').toLowerCase();
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
    prompt: promptText,
    options,
    correctAnswer: answerText,
    explanation: String(item.Explanation || '').trim() || 'Perhatikan opsi jawaban yang tepat di atas.',
    exampleSentence: promptText,
    hint: 'Perhatikan petunjuk konteks dan struktur kalimat.',
  };
}

/**
 * Mengambil bank soal dari LMS API dan memetakannya ke EnglishChallenge[]
 * Parameter category dan level dipertahankan di signature, namun pengambilan soal mengambil semua data tanpa filter level/kategori.
 * Soal bertipe bacaan panjang (reading/passage) dan teks pertanyaan yang terlalu panjang (>400 karakter) otomatis disaring keluar.
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

    // Filter Reading: Buang soal reading/passage atau soal dengan Question_Text > 400 karakter
    const eligibleData = json.data.filter((item: LMSQuestionRaw) => {
      const qType = String(item.Question_Type || '').toLowerCase();
      if (qType.includes('reading') || qType.includes('passage') || qType.includes('text')) {
        return false;
      }
      const qText = String(item.Question_Text || '').trim();
      if (qText.length > 400) {
        return false;
      }
      return true;
    });

    console.log('[LMS Fetch] Jumlah soal yang lolos filter:', eligibleData.length);

    const challenges: EnglishChallenge[] = eligibleData.map((item: LMSQuestionRaw, idx: number) =>
      mapRawToChallenge(item, idx)
    );

    return challenges;
  } catch (error) {
    console.warn('[LMS Question Fetcher] Error fetching questions from LMS:', error);
    return [];
  }
}
