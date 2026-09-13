import React from 'react';
// 🌟 expo-status-bar 대신 react-native의 기본 StatusBar를 사용합니다.
import { StatusBar } from 'react-native'; 
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator'; 
import { theme } from './src/constants/theme'; 

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.headerIconBackground, // 모든 화면의 공통 배경색을 theme에서 가져옵니다.
  },
};

export default function App() {
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
    </SafeAreaProvider>
  );
}