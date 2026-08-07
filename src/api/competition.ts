import client from './client';

// ─── 타입 ───

export type BotLevel = '하' | '중' | '상';

export type BotQuizType = 'multiple_choice' | 'subjective' | 'word_arrange';

export interface BotQuestion {
  sourceType: 'STORY' | 'COMPETITION';
  sourceQuizContentId: number; // result 제출 시 그대로 반환 필요
  quizType: BotQuizType;
  question: string;
  korean: string | null; // word_arrange 전용
  tiles: string | null; // word_arrange 전용, JSON 문자열
  answerTiles: string | null; // word_arrange 전용, JSON 문자열
  distractorTiles: string | null; // word_arrange 전용, JSON 문자열
  options: string | null; // multiple_choice 전용, JSON 문자열
  answer: string;
  acceptableAnswers: string | null; // JSON 문자열
  botIsCorrect: boolean; // 봇의 정답 여부 (서버 시뮬레이션)
}

export interface BotMatchStartResponse {
  matchId: number;
  questions: BotQuestion[]; // 21개, 유형별 정렬 안 된 랜덤 순서
  remainingPoints: number; // entryCost 차감 후 잔여 포인트
}

export interface BotMatchAnswer {
  sourceType: 'STORY' | 'COMPETITION'; // /bot/level에서 받은 값 그대로
  sourceQuizContentId: number; // /bot/level에서 받은 값 그대로
  roundNo: number; // 문제 순번 (1~21)
  userAnswer: string;
  userIsCorrect: boolean;
  botIsCorrect: boolean; // /bot/level 값 echo
}

export interface BotMatchResultResponse {
  matchId: number;
  correctCount: number;
  wrongCount: number;
  rewardPoint: number;
  balanceAfter: number;
}

export interface BotPauseResponse {
  matchId: number;
  status: string; // 'PAUSED' | 'IN_PROGRESS' 등 서버 상태값
}

// ─── API ───

// 매치 시작: 포인트 차감 + 21문제 세트 수신
export const startBotMatch = async (
  botLevel: BotLevel,
  entryCost: number,
): Promise<BotMatchStartResponse> => {
  const res = await client.post('/bot/level', { botLevel, entryCost });
  return res.data;
};

// 결과 제출: 21개 답안 전체 + 매치 중 최대 연속 정답 수
export const submitBotMatchResult = async (data: {
  answers: BotMatchAnswer[];
  streakCount: number;
}): Promise<BotMatchResultResponse> => {
  const res = await client.post('/bot/result', data);
  return res.data;
};

// 일시정지 / 재개 (true → 일시정지, false → 재시작)
// 서버는 현재 진행 중인 매치의 상태만 기록한다. 타이머 정지 등 실제 동작은 클라이언트에서 처리.
export const pauseBotMatch = async (botPause: boolean): Promise<BotPauseResponse> => {
  const res = await client.get('/bot/pause', { params: { botPause } });
  return res.data;
};
