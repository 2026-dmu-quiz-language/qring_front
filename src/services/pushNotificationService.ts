import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/axiosInstance'; // JWT 토큰이 자동으로 포함되는 axios 인스턴스

// 앱 포그라운드(화면 켜짐) 상태일 때 상단 알림 노출 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 🌟 안드로이드 필수: 알림 채널 미리 생성 (없을 경우 토큰/알림 동작 시 에러 방지)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

/**
 * FCM 디바이스 토큰 등록 / 갱신
 * Endpoint: POST /api/v1/push/token
 */
export async function registerPushTokenAsync() {
  if (!Device.isDevice) {
    console.log('실제 기기(Physical Device)에서만 푸시 토큰 발급이 가능합니다.');
    return;
  }

  // OS 알림 권한 확인 및 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('푸시 알림 권한이 거부되었습니다.');
    return;
  }

  try {
    // 🌟 Expo 프로젝트에서 FCM Native Device Token 가져오기
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

    await api.post('/api/v1/push/token', {
      token,
      platform,
    });

    console.log('FCM Device Token 등록 성공:', token);
    return token;
  } catch (error) {
    console.error('FCM Device Token 등록 실패:', error);
  }
}

/**
 * FCM 디바이스 토큰 해제 (로그아웃 시 사용)
 * Endpoint: POST /api/v1/push/token/delete
 */
export async function unregisterPushTokenAsync() {
  if (!Device.isDevice) return;

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;

    if (token) {
      await api.post('/api/v1/push/token/delete', { token });
      console.log('FCM Device Token 삭제 완료');
    }
  } catch (error) {
    console.error('FCM Device Token 삭제 실패:', error);
  }
}