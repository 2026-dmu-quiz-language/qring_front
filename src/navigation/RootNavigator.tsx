import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNav } from './BottomTabNav';
import { Button, Text } from 'react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import SplashScreen from '../screens/auth/SplashScreen'; 
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen'; 
import ChatLearnScreen from '../screens/ChatLearnScreen';
import LearningResultScreen from '../screens/LearningResultScreen';

const Stack = createNativeStackNavigator();

const LearningScreen = ({ navigation }: any) => (
  <ScreenWrapper><Text>학습(채팅) 페이지</Text><Button title="결과창 보기" onPress={() => navigation.navigate('Result')} /></ScreenWrapper>
);
const ResultScreen = ({ navigation }: any) => (
  <ScreenWrapper><Text>학습 완료 결과창</Text><Button title="홈으로 돌아가기" onPress={() => navigation.navigate('MainTab')} /></ScreenWrapper>
);

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      {/* Auth Flow */}
      <Stack.Screen name="Splash" options={{ headerShown: false,title: '', }} component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      
      {/* Main Tab Flow (하단 탭이 있는 화면들) */}
      <Stack.Screen name="MainTab" component={BottomTabNav} />
      
      {/* Learning Flow (하단 탭이 없는 화면들) */}
      <Stack.Screen name="ChatLearn" component={ChatLearnScreen} />
      <Stack.Screen name="LearningResult" component={LearningResultScreen} />
    </Stack.Navigator>
  );
};