import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

const Tab = createBottomTabNavigator();

// 테스트용 더미 스크린들 (헤더 적용 예시)
const DummyDashboard = () => (
  <ScreenWrapper>
    {/* 대시보드는 특수 헤더라 일단 비워둠 */}
    <Text style={{ marginTop: 20 }}>메인 대시보드 화면</Text>
  </ScreenWrapper>
);
const DummyContent = () => (
  <ScreenWrapper>
    <Header title="스토리 홈" leftType="none" rightType="profile" />
    <Text>콘텐츠 선택 화면</Text>
  </ScreenWrapper>
);
const DummyMyPage = () => (
  <ScreenWrapper>
    <Header title="마이페이지" leftType="none" rightType="none" />
    <Text>마이페이지 화면</Text>
  </ScreenWrapper>
);

export const BottomTabNav = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false, // 기본 라벨 숨김 (우리가 커스텀으로 그림)
        tabBarItemStyle: {
            height: 75, 
            justifyContent: 'center',
            alignItems: 'center',
        },
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          let label = '';

          if (route.name === 'Dashboard') {
            iconName = 'trending-up'; 
            label = '학습';
          } else if (route.name === 'Content') {
            iconName = 'book-outline'; 
            label = '홈';
          } else if (route.name === 'MyPage') {
            iconName = 'person-outline'; 
            label = '마이페이지';
          }

          // 활성화 시 아이콘 색상 및 둥근 배경 적용
          return (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons 
                name={iconName} 
                size={20} 
                color={focused ? theme.colors.primary : '#555'} 
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {label}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DummyDashboard} />
      <Tab.Screen name="Content" component={DummyContent} />
      <Tab.Screen name="MyPage" component={DummyMyPage} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 30, // 아이폰 홈 바 위로 적당히 띄움
    left: 20,
    right: 20,
    elevation: 0,
    backgroundColor: '#FAFAF5',
    borderRadius: 35, // 좀 더 둥글게 처리
    height: 75, // 탭바 높이를 조금 더 확보
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 0,
    paddingBottom: 0, // 중요: 내부 기본 패딩 제거
  },
  tabItem: {
    // 🌟 배경(Pill)과 아이콘을 한 몸으로 묶어 중앙 정렬
    alignItems: 'center',
    justifyContent: 'center',
    width: 85, // 활성화 배경의 가로 길이
    height: 50, // 활성화 배경의 세로 길이
    borderRadius: 25, // 알약 모양 유지
    marginTop: 12, // 탭바 내부에서 아이콘 세트를 중앙으로 내림
  },
  tabItemActive: {
    backgroundColor: theme.colors.secondary, // #AAB87B (연두색 배경)
  },
  tabLabel: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: theme.colors.primary, // #6F9F63
    fontWeight: 'bold',
  }
});