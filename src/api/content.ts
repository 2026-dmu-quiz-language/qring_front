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
  
  // 🌟 해결 포인트: 데이터를 Body(두 번째 칸)가 아니라, params(세 번째 칸 설정)에 넣어서 보냅니다.
  // 이렇게 하면 Axios가 알아서 "https://q-ring.app/chat?contentId=1" 형태로 만들어서 보냅니다!
  const res = await client.post('/chat', null, { 
    params: { contentId: episodeId } 
  });
  
  console.log('📥 [응답: /chat] 받은 데이터:', JSON.stringify(res.data, null, 2));
  return res.data;
};

export const submitResult = async (data: {
  episodeId: number;
  result: QuizResultItem[];
}): Promise<SubmitResultResponse> => {
  const requestBody = {
    contentId: data.episodeId,
    results: data.result,  // result → results
  };
  
  console.log('📤 [요청: /questionResult]', JSON.stringify(requestBody, null, 2));
  
  const res = await client.post('/questionResult', requestBody);
  return res.data;
};