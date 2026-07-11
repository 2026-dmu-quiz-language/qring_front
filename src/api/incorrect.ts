import client from './client';

// ─── 타입 ───

export interface IncorrectEpisode {
  contentId: number;
  storyName: string;
}

export interface IncorrectQuiz {
  quizContentId: number;
  question: string;
  options: string | string[];
  correctAnswer: string;
  hint: string;
}

export interface IncorrectResultResponse {
  totalPoint: number;
}

// 오답 에피소드 목록
export const getIncorrectList = async (): Promise<IncorrectEpisode[]> => {
  const res = await client.post('/incorrect');
  return res.data.wrongAnswers;
};

// 오답 퀴즈 조회
export const getIncorrectRetry = async (contentId: number): Promise<IncorrectQuiz[]> => {
  const res = await client.post('/incorrect/retry', { contentId });
  return res.data.quizzes;
};

// 오답 풀이 결과 제출
export const submitIncorrectResult = async (data: {
  contentId: number;
  point: number;
}): Promise<IncorrectResultResponse> => {
  const res = await client.post('/incorrect/result', data);
  return res.data;
};
