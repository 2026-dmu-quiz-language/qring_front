import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/axiosInstance'; // JWT 토큰이 자동으로 포함되는 axios 인스턴스

// 앱 포그라운드 상태 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

/**
 * Expo Push Token 등록 / 갱신 (디버깅 로그 포함)
 * Endpoint: POST /api/v1/push/token
 */
export async function registerPushTokenAsync() {
  console.log('📌 [1] registerPushTokenAsync 함수 실행 시작');

  if (!Device.isDevice) {
    console.log('⚠️ [1-1] 실기기가 아니므로 푸시 토큰 발급을 중단합니다. (에뮬레이터/시뮬레이터)');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📌 [2] 기존 알림 권한 상태:', existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('📌 [2-1] 권한이 없어 사용자에게 권한을 요청합니다...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ [2-2] 알림 권한이 거부되었습니다. (status:', finalStatus, ')');
      return;
    }
    console.log('✅ [2-3] 알림 권한이 허용되었습니다.');

    // 🌟 EAS projectId 가져오기
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    console.log('📌 [3] 확인된 Project ID:', projectId);

    if (!projectId) {
      console.error('❌ [3-1] Expo projectId가 설정되지 않았습니다! app.json을 확인해주세요.');
      return;
    }

    // 🌟 Expo Push Token 가져오기 (ExponentPushToken[...] 형식)
    console.log('📌 [4] getExpoPushTokenAsync 호출 중...');
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

    console.log('✅ [4-1] 발급된 Expo Push Token:', token);
    console.log('📌 [4-2] 전송할 플랫폼:', platform);

    // 서버로 토큰 전송 API 호출
    console.log('📌 [5] 서버로 토큰 등록 API 요청 중... (/api/v1/push/token)');
    const response = await api.post('/api/v1/push/token', {
      token,
      platform,
    });

    console.log('🎉 [5-1] Expo Push Token 서버 등록 성공! (Status:', response.status, ')');
    return token;
  } catch (error) {
    console.error('❌ [ERROR] Expo Push Token 등록 중 예외 발생:', error);
  }
}

/**
 * Expo Push Token 해제 (로그아웃 시 사용)
 */
export async function unregisterPushTokenAsync() {
  if (!Device.isDevice) return;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    if (token) {
      await api.post('/api/v1/push/token/delete', { token });
      console.log('🧹 Expo Push Token 삭제 완료');
    }
  } catch (error) {
    console.error('❌ Expo Push Token 삭제 실패:', error);
  }
}