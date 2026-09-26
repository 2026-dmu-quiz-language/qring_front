import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native'; 
import { DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/constants/theme';
import { AlertHost } from './src/components/common/AlertHost';
import { registerPushTokenAsync } from './src/services/pushNotificationService';

// NavigationContainer 외부에서 라우팅을 컨트롤하기 위한 NavigationRef 생성
export const navigationRef = createNavigationContainerRef<any>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.headerIconBackground,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'SUIT-Regular': require('./assets/fonts/SUIT-Regular.ttf'),
    'SUIT-Medium': require('./assets/fonts/SUIT-Medium.ttf'),
    'SUIT-Bold': require('./assets/fonts/SUIT-Bold.ttf'),
  });

  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  // FCM 데이터 규격 수신 시 해당 화면으로 라우팅 처리
  const handleFcmNavigation = (data: any) => {
    if (!data) return;

    // 백엔드 FCM 페이로드 규격: type "WRONG_ANSWER_REMINDER", screen "incorrect"
    if (data.screen === 'incorrect' || data.type === 'WRONG_ANSWER_REMINDER') {
      if (navigationRef.isReady()) {
        navigationRef.navigate('IncorrectNote', {
          createdDate: data.createdDate,
          wrongCount: data.wrongCount,
        });
      }
    }
  };

  useEffect(() => {
    // 1. 앱 실행 시 푸시 토큰 등록
    registerPushTokenAsync();

    // 2. 포그라운드(앱이 열려있는 상태) 알림 수신 리스너
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('포그라운드 알림 수신:', notification);
    });

    // 3. 알림 탭(클릭) 감지 리스너 (백그라운드 & 포그라운드 공통)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('알림 클릭 data:', data);
      handleFcmNavigation(data);
    });

    // 4. 앱 완전히 종료된 상태에서 알림을 눌러 앱을 켰을 때 처리
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        setTimeout(() => {
          handleFcmNavigation(data);
        }, 500); // Navigation 내비게이터 준비 완료 후 이동
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove(); 
      }
      if (responseListener.current) {
        responseListener.current.remove(); 
      }
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
      <NavigationContainer theme={navTheme} ref={navigationRef}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={theme.colors.background} 
          translucent={true} 
        />
        
        <RootNavigator />
      </NavigationContainer>

      {/* 앱 어디서든 showAlert, showConfirm 으로 띄우는 공통 알림창 */}
      <AlertHost />
    </SafeAreaProvider>
  );
}