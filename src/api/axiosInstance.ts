import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🌟 백엔드 서버 기본 URL 주소를 적어주세요.
const BASE_URL = 'https://your-api-domain.com'; // 예: 'http://10.0.2.2:8080' (안드로이드 시뮬레이터) 또는 실제 서버 URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 모든 요청마다 자동으로 JWT 토큰 첨부
api.interceptors.request.use(
  async (config) => {
    try {
      // 🌟 저장된 JWT 토큰 키 이름에 맞춰 수정하세요 (예: 'accessToken', 'userToken' 등)
      const token = await AsyncStorage.getItem('accessToken'); 
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 불러오기 실패:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;