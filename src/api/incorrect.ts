import client from './client';

// ─── 타입 ───

/** 오답이 어디서 나왔는지. 재풀이 요청에 그대로 실어 보내야 한다. */
export type IncorrectSourceType = 'STORY' | 'COMPETITION';

export interface IncorrectEntry {
  sourceType: IncorrectSourceType;
  /** STORY 면 콘텐츠 id, COMPETITION 이면 레벨 번호(1~3) */
  contentId: number;
  /** 목록에 보여줄 이름. 컴피티션은 '레벨 N 컴피티션' 형태로 온다. */
  label: string;
  /** 가장 최근에 틀린 시각. 서버가 이 기준으로 정렬해서 내려준다. */
  latestWrongAt: string;
}

export interface IncorrectQuiz {
  quizContentId: number;
  quizType: string;
  /** 단어 배열 문제에서는 '단어를 배열해서...' 같은 안내문이고, 보여줄 문장은 korean 에 있다. */
  question: string;
  /** 객관식 보기. JSON 문자열로 온다. 단어 배열 문제에서는 null */
  options: string | string[] | null;
  correctAnswer: string;

  // ─ 단어 배열(word_arrange) 전용. 다른 유형에서는 전부 null ─
  /** 화면에 보여줄 한국어 문장 */
  korean: string | null;
  /** 섞인 단어 목록 (JSON 문자열) */
  tiles: string | null;
  /** 정답 순서의 단어 목록 (JSON 문자열) */
  answerTiles: string | null;
  /** 오답용으로 끼워 넣는 단어 (JSON 문자열) */
  distractorTiles: string | null;
  /** 컴피티션 전용 문제는 힌트 데이터가 없어 null 로 온다. */
  hint: string | null;
  /**
   * 이 문제의 '원본' 출처. 묶음이 COMPETITION 이면 안에 STORY 출신 문제가 섞여 올 수 있다.
   * 목록 조회나 재풀이 요청에 쓰는 sourceType(묶음 종류)과는 의미가 다르다.
   * 결과 제출 때 originSourceType 이라는 이름으로 그대로 돌려보내야
   * 서버가 어느 오답 기록을 지울지 찾을 수 있다.
   */
  sourceType: IncorrectSourceType;
}

export interface IncorrectResultItem {
  quizContentId: number;
  correct: boolean;
  /** 재풀이 응답에서 받은 문제별 sourceType 을 그대로 담는다. */
  originSourceType: IncorrectSourceType;
}

export interface IncorrectResultResponse {
  totalPoint: number;
}

// 오답 목록 (스토리 + 컴피티션이 최근 오답 순으로 합쳐져서 온다)
export const getIncorrectList = async (): Promise<IncorrectEntry[]> => {
  const res = await client.post('/incorrect');
  return res.data.wrongAnswers;
};

// 오답 퀴즈 조회. 목록에서 받은 sourceType 과 contentId 를 그대로 넘긴다.
// (서버는 contentId 를 groupId 라는 이름으로 받는다)
export const getIncorrectRetry = async (
  sourceType: IncorrectSourceType,
  groupId: number,
): Promise<IncorrectQuiz[]> => {
  const res = await client.post('/incorrect/retry', { sourceType, groupId });
  return res.data.quizzes;
};

// 오답 풀이 결과 제출.
// originSourceType 은 COMPETITION 묶음일 때만 서버가 쓰지만, 분기를 두지 않고 항상 실어 보낸다.
// (STORY 묶음이면 서버가 무시한다. 빠뜨리면 오답이 조용히 안 지워져서 찾기 어렵다.)
export const submitIncorrectResult = async (data: {
  sourceType: IncorrectSourceType;
  contentId: number;
  results: IncorrectResultItem[];
}): Promise<IncorrectResultResponse> => {
  const res = await client.post('/incorrect/result', data);
  return res.data;
};
