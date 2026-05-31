import client from './client';

// ─── 타입 ───
export interface Script {
  scriptId: number;
  characterName: string;
  scriptContent: string;
  hasOptions: boolean;
}

export interface Quiz {
  quizId: number;
  scriptId: number;
  quizType: string;
  question: string;
  options: string;
  correctAnswer: string;
  explanation: string;
  hint: string;
}

export interface ChatData {
  script: Script[];
  quizzes: Quiz[];
}

export interface QuizResultItem {
  quiz_id: number;
  try_count: number;
  correct: boolean;
  hint_opened: boolean;
}

// 컨텐츠 목록
export const getContentList = async () => {
  const res = await client.post('/contentList');
  return res.data;
};

// 학습 페이지 (채팅 + 퀴즈)
export const getChatData = async (contentId: number): Promise<ChatData> => {
  const res = await client.post('/chat', { content_id: contentId });
  return res.data;
};

// 학습 결과 제출
export const submitResult = async (data: {
  episode_id: number;
  result: QuizResultItem[];
}) => {
  const res = await client.post('/questionResult', data);
  return res.data;
  // 응답: { 정답횟수, score }
};