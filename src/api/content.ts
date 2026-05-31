import client from './client';

// ─── 타입 ───
export interface Script {
  scriptId: number;
  characterName: string | null; 
  scriptContent: string;
  hasOptions: boolean;
}

export interface SubmitResultResponse {
  totalScore: number;
  correctCount: number;
}


export interface Quiz {
  quizId: number;
  scriptId: number; // 🌟 이 scriptId와 대사의 scriptId가 같으면 퀴즈 출현!
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
  attemptCount: number;    // tryCount → attemptCount
  correct: boolean;
  lastAnswer: string;      // 추가
  hintUsed: boolean;       // hintOpened → hintUsed
}

// 컨텐츠 목록
export const getContentList = async () => {
  const res = await client.post('/contentList');
  return res.data;
};

/// 학습 페이지 (채팅 + 퀴즈)
export const getChatData = async (episodeId: number): Promise<ChatData> => {
  console.log(`📤 [요청: /chat] 파라미터로 전송할 contentId:`, episodeId);
  
  const res = await client.post('/chat', null, { 
    params: { contentId: episodeId } 
  });
  
  return res.data;
};

export const submitResult = async (data: {
  episodeId: number;
  result: QuizResultItem[];
}): Promise<SubmitResultResponse> => {
  const requestBody = {
    contentId: data.episodeId,
    results: data.result,  
  };
  
  const res = await client.post('/questionResult', requestBody);
  return res.data;
};