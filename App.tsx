import React from 'react';
// 🌟 expo-status-bar 대신 react-native의 기본 StatusBar를 사용합니다.
import { StatusBar } from 'react-native'; 
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';

import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/constants/theme';
import { AlertHost } from './src/components/common/AlertHost';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.headerIconBackground, // 모든 화면의 공통 배경색을 theme에서 가져옵니다.
  },
};

export default function App() {
  // theme.fonts 에 적힌 이름과 같아야 화면 스타일이 이 파일들을 찾는다.
  const [fontsLoaded] = useFonts({
    'SUIT-Regular': require('./assets/fonts/SUIT-Regular.ttf'),
    'SUIT-Medium': require('./assets/fonts/SUIT-Medium.ttf'),
    'SUIT-Bold': require('./assets/fonts/SUIT-Bold.ttf'),
  });

  // 폰트가 준비되기 전에 그리면 글꼴이 바뀌면서 화면이 한 번 튄다.
  // 그동안은 app.json 의 스플래시 화면이 그대로 보인다.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
      <NavigationContainer theme={navTheme}>
        
        {/* 🌟 style 대신 barStyle="dark-content"를 사용합니다. */}
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