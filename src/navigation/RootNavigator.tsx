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
import EmailVerifyScreen from '../screens/auth/EmailVerifyScreen';
import SocialSignUpScreen from '../screens/auth/SocialSignUpScreen';
import MyPageScreen from '../screens/MypageScreen';
import AccountManagementScreen from '../screens/MyPage/AccountManagementScreen';
import LearningSettingsScreen from '../screens/MyPage/LearningSettingsScreen';
import WrongNoteQuizScreen from '../screens/WrongNoteQuizScreen';
import BotCompetitionScreen from '../screens/BotCompetitionScreen';
import BotLevelSelectScreen from '../screens/BotLevelSelectScreen';
import StoryCreateScreen from '../screens/StoryCreateScreen';
import StoryChatScreen from '../screens/StoryChatScreen';
import StoryRecordScreen from '../screens/StoryRecordScreen';

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
      <Stack.Screen name="EmailVerify" component={EmailVerifyScreen} />
      <Stack.Screen name="SocialSignUp" component={SocialSignUpScreen} />
      
      {/* Main Tab Flow (하단 탭이 있는 화면들) */}
      <Stack.Screen name="MainTab" component={BottomTabNav} />
      
      {/* Learning Flow (하단 탭이 없는 화면들) */}
      <Stack.Screen name="ChatLearn" component={ChatLearnScreen} />
      <Stack.Screen name="LearningResult" component={LearningResultScreen} />
      <Stack.Screen name="MyPage" component={MyPageScreen} />

      <Stack.Screen name="AccountManagementScreen" component={AccountManagementScreen} />
      <Stack.Screen name="LearningSettingsScreen" component={LearningSettingsScreen} />
      <Stack.Screen name="WrongNoteQuiz" component={WrongNoteQuizScreen} />
      <Stack.Screen name="BotLevelSelect" component={BotLevelSelectScreen} />
      <Stack.Screen name="BotCompetition" component={BotCompetitionScreen} />

      <Stack.Screen name="StoryCreateScreen" component={StoryCreateScreen} />
      <Stack.Screen name="StoryChat" component={StoryChatScreen} />
      <Stack.Screen name="StoryRecord" component={StoryRecordScreen} />
    </Stack.Navigator>
  );
};