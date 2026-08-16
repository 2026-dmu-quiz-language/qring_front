// 봇 컴피티션 밸런스 설정
// 게임 로직은 이 값을 받아서만 동작하고, 밸런스 튜닝은 이 파일에서만 한다.
// 추후 서버에서 내려주는 값으로 덮어쓸 수 있도록 구조 유지할 것.

export type QuizType = 'multiple' | 'short' | 'wordCombo';

export const BOT_CONFIG = {
  // 문제 유형별 봇 풀이 시간 [최소, 최대] (초)
  // 봇은 이 시간이 지나면 무조건 정답 처리된다.
  // 객관식은 유저 제출 기회 1번, 주관식/단어조합은 시간 내 재도전 가능.
  solveTime: {
    multiple: [10, 13],
    short: [20, 24],
    wordCombo: [25, 30],
  } as Record<QuizType, [number, number]>,

  sectionSpeedup: 1, // 섹션이 넘어갈 때마다 봇 풀이 시간 -1초
  wrongPenalty: 2, // 재도전 유형에서 오답 제출 시 현재 라운드 봇 남은 시간 -2초
  minSolveTime: 3, // 봇 풀이 시간 하한

  questionsPerSection: 7,
  totalSections: 3,
  totalQuestions: 21,

  // 봇 레벨별 입장 비용 (하 50은 백엔드 예시 기준, 중/상은 임시값)
  entryCost: {
    하: 50,
    중: 70,
    상: 100,
  } as Record<'하' | '중' | '상', number>,
};

// 이번 문제에서 봇이 쓸 풀이 시간을 뽑는다. section: 1부터 시작
export function getBotSolveTime(type: QuizType, section: number): number {
  const [min, max] = BOT_CONFIG.solveTime[type];
  const base = min + Math.random() * (max - min);
  const adjusted = base - (section - 1) * BOT_CONFIG.sectionSpeedup;
  return Math.max(adjusted, BOT_CONFIG.minSolveTime);
}
