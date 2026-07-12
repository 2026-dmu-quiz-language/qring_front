// src/constants/oauth.ts

// 백엔드 또는 인증을 처리할 기준 도메인
const AUTH_BASE_URL = 'https://q-ring.app/oauth';

export const OAUTH_CONFIG = {
  // 1. 카카오 로그인 설정
  KAKAO: {
    // 발급받은 REST API 키 (카카오 디벨로퍼스에서 확인 가능)
    CLIENT_ID: '카카오_REST_API_키를_여기에_넣어주세요', 
    // 🌟 에러의 원인이었던 바로 그 주소!
    REDIRECT_URI: `${AUTH_BASE_URL}/kakao`, 
  },
  
  // 2. 구글 로그인 설정 (추후 작업용 미리 세팅)
  GOOGLE: {
    CLIENT_ID: '구글_클라이언트_ID를_여기에_넣어주세요',
    REDIRECT_URI: `${AUTH_BASE_URL}/google`,
  },
  
  // 3. 라인 로그인 설정 (추후 작업용 미리 세팅)
  LINE: {
    CLIENT_ID: '라인_채널_ID를_여기에_넣어주세요',
    REDIRECT_URI: `${AUTH_BASE_URL}/line`,
  }
};