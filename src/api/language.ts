import client from './client';

/**
 * 학습 언어 상태. /langcheck 와 /switch 가 같은 형태로 내려준다.
 * 어느 언어가 활성인지는 기기가 아니라 서버가 들고 있다.
 */
export interface LanguageStatus {
  /** 현재 학습 언어 코드(EN | JA | ZH). 온보딩 전이면 null */
  current: string | null;
  /** 현재 학습 언어 한글명. current 가 null 이면 null */
  currentName: string | null;
  /** 학습을 시작한 적 있는 언어 코드 목록. 항상 대문자 */
  unlocked: string[];
}

/** 현재 언어와 해금된 언어를 한 번에 가져온다. */
export const fetchLanguageStatus = async (): Promise<LanguageStatus> => {
  const res = await client.post('/api/v1/langcheck');
  return res.data;
};

/**
 * 학습 언어를 바꾸고 바뀐 상태를 돌려받는다.
 * 실패하면 400 과 함께 code 가 오므로 호출한 쪽에서 안내해야 한다.
 *   INVALID_LANGUAGE        EN/JA/ZH 가 아닌 값
 *   LANGUAGE_NOT_UNLOCKED   아직 해금하지 않은 언어
 */
export const switchLanguage = async (language: string): Promise<LanguageStatus> => {
  const res = await client.post('/api/v1/switch', { language });
  return res.data;
};
