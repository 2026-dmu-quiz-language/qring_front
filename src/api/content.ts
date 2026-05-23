import client from './client';

// ─── 타입 ───
export interface Script {
  script_id: number;
  text: string;
}

export interface Quiz {
  quiz_id: number;
  script_id: number;
  quiz_type: 'multiple_choice' | 'fill_in_blank' | 'subjective';
  question: string;
  options: string[];
  correct_answer: string;
  acceptable_answers: string[];
  explanation: string;
}

export interface ChatData {
  script: Script[];
  quiz: Quiz[];
  hint: string;
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
  try_count: string;
  correct: boolean;
  hint_opened: string;
}) => {
  const res = await client.post('/questionResult', data);
  return res.data;
  // 응답: { 정답횟수, score }
};