// src/constants/oauth.ts

// 소셜 로그인 브릿지 페이지(백엔드)가 서비스되는 기준 도메인
const AUTH_BASE_URL = 'https://q-ring.app/oauth';

// 클라이언트 ID들은 qring_front-main/.env 의 EXPO_PUBLIC_* 값을 사용한다.
export const OAUTH_CONFIG = {
  // 1. 카카오 로그인 설정 (REST API 키)
  KAKAO: {
    CLIENT_ID: process.env.EXPO_PUBLIC_KAKAO_APP_KEY ?? '',
    REDIRECT_URI: `${AUTH_BASE_URL}/kakao`,
  },

  // 2. 구글 로그인 설정 (웹 클라이언트 ID)
  GOOGLE: {
    CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
    REDIRECT_URI: `${AUTH_BASE_URL}/google`,
  },

  // 3. 라인 로그인 설정 (채널 ID)
  LINE: {
    CLIENT_ID: process.env.EXPO_PUBLIC_LINE_CHANNEL_ID ?? '',
    REDIRECT_URI: `${AUTH_BASE_URL}/line`,
  },
};
