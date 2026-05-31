import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = axios.create({
  baseURL: 'https://q-ring.app:8080', // 본인 컴퓨터 IP로 바꿔야 함
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 매 요청마다 토큰 자동 주입
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;