import client from './client'; // 기존 프로젝트의 axios 설정 파일

export interface StoryArchive {
  situation: string;
  session_id: string;
  character_name: string;
  quiz_count: number;
  archived_at: string;
}

export interface StoryLibraryResponse {
  archives: StoryArchive[];
}

export const fetchStoryLibrary = async (): Promise<StoryLibraryResponse> => {
  // POST 요청으로 수정 (토큰은 client.ts의 인터셉터에서 자동으로 헤더에 주입된다고 가정)
  const response = await client.post<StoryLibraryResponse>('/api/v1/story/library');
  return response.data;
};

export interface TimelineItem {
  type: 'message' | 'quiz' | 'quiz_result';
  role?: 'assistant' | 'user';
  content?: string;
  translation?: string; // assistant 메시지의 한글 번역
  quiz?: {
    quiz_number: number;
    quiz_type: 'multiple_choice' | 'word_arrange' | string;
    question: string;
    explanation: string;
    options?: string[]; // 다중 선택 퀴즈의 보기
    tiles?: string[]; // 단어 배열 퀴즈의 보기
    correct_answer: string;
  };
  quiz_number?: number;
  user_answer?: string;
  result?: 'correct' | 'incorrect';
}

export interface StoryRecordResponse {
  situation: string;
  tone: string;
  timeline: TimelineItem[];
  session_id: string;
  character_name: string;
  target_language: string;
  quiz_count: number;
  archived_at: string;
}

export const fetchStoryRecord = async (sessionId: string): Promise<StoryRecordResponse> => {
  // 백엔드 명세에 따라 POST 또는 GET 파라미터로 전송 방식을 맞춰주세요. (여기서는 body 전송으로 가정)
  const response = await client.post<StoryRecordResponse>('/api/v1/story/library/chat', {
    session_id: sessionId
  });
  return response.data;
};

export interface StartStoryRequest {
  characterName: string;
  situationDescription: string;
  tone: string;
  targetLanguage: string;
}

export interface StartStoryResponse {
  session_id: string;
  character_name: string;
  situation: string;
  ai_first_message: string;
  ai_first_translation: string;
  user_remaining_points: number;
}

export const startStorySession = async (request: StartStoryRequest): Promise<StartStoryResponse> => {
  const response = await client.post<StartStoryResponse>('/api/v1/story/start', request);
  return response.data;
};

export interface StoryChatRequest {
  session_id: string;
  user_message: string;
}

export interface StoryChatQuiz {
  quiz_number: number;
  quiz_type: string;
  question: string;
  explanation: string;
  options?: string[];
  correct_answer: string;
  tiles?: string[];
  acceptable_answers?: string[];
  hint?: string;
}

export interface StoryChatResponse {
  session_id: string;
  ai_message: string;
  translation: string;
  is_quiz: boolean;
  quiz: StoryChatQuiz | null;
  answer_result: string; // "none", "correct", "incorrect"
  current_quiz_count: number;
  is_completed: boolean;
}

export const sendStoryChatMessage = async (request: StoryChatRequest): Promise<StoryChatResponse> => {
  const response = await client.post<StoryChatResponse>('/api/v1/story/chat', request);
  return response.data;
};

export interface StoryArchiveRequest {
  session_id: string;
}

export interface StoryArchiveResponse {
  session_id: string;
  user_remaining_points: number;
}

export const archiveStorySession = async (request: StoryArchiveRequest): Promise<StoryArchiveResponse> => {
  const response = await client.post<StoryArchiveResponse>('/api/v1/story/archive', request);
  return response.data;
};

export interface StoryDiscardRequest {
  session_id: string;
}

export const discardStorySession = async (request: StoryDiscardRequest): Promise<void> => {
  await client.post('/api/v1/story/discard', request);
};