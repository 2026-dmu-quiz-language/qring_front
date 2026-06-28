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
  scripts: Script[];
  quizzes: Quiz[];
}

export interface QuizResultItem {
  quizId: number;
  tryCount: number;
  correct: boolean;
  hintOpened: boolean;
}

// 컨텐츠 목록
export const getContentList = async () => {
  const res = await client.post('/contentList');
  return res.data;
};

// 학습 페이지 (채팅 + 퀴즈)
export const getChatData = async (episodeId: number, language: string): Promise<ChatData> => {
  const res = await client.post('/chat', null, { 
    // 🌟 백엔드 설정에 따라 변수명(lang, language 등)이 다를 수 있습니다!
    params: { contentId: episodeId, language: language } 
  });
  return res.data;
};

// 학습 결과 제출
export const submitResult = async (data: { episodeId: number; language: string; result: QuizResultItem[]; }) => {
  const res = await client.post('/questionResult', data.result, {
    params: { contentId: data.episodeId, language: data.language } 
  });
  return res.data;
  // 응답: { 정답횟수, score }
};