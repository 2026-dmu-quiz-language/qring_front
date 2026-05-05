import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNav } from './BottomTabNav';
import { Button, Text } from 'react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';

const Stack = createNativeStackNavigator();

// 임시 스크린들 (버튼 누르면 화면 이동 동작 확인용)
const SplashScreen = ({ navigation }: any) => (
  <ScreenWrapper><Text>앱 초기 화면(스플래시)</Text><Button title="로그인 화면으로" onPress={() => navigation.navigate('Login')} /></ScreenWrapper>
);
const LoginScreen = ({ navigation }: any) => (
  <ScreenWrapper><Text>로그인 화면</Text><Button title="메인으로(로그인 성공)" onPress={() => navigation.navigate('MainTab')} /></ScreenWrapper>
);
const LearningScreen = ({ navigation }: any) => (
  <ScreenWrapper><Text>학습(채팅) 페이지</Text><Button title="결과창 보기" onPress={() => navigation.navigate('Result')} /></ScreenWrapper>
);
const ResultScreen = ({ navigation }: any) => (
  <ScreenWrapper><Text>학습 완료 결과창</Text><Button title="홈으로 돌아가기" onPress={() => navigation.navigate('MainTab')} /></ScreenWrapper>
);

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Auth Flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      
      {/* Main Tab Flow (하단 탭이 있는 화면들) */}
      <Stack.Screen name="MainTab" component={BottomTabNav} />
      
      {/* Learning Flow (하단 탭이 없는 화면들) */}
      <Stack.Screen name="Learning" component={LearningScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
};