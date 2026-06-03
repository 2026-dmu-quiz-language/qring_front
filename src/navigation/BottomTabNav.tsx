import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import StoryHomeScreen from '../screens/StoryHomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MyPageScreen from '../screens/MypageScreen';

const Tab = createBottomTabNavigator();

export const BottomTabNav = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        safeAreaInsets: { bottom: 0 }, // 아이폰 기본 하단 여백 제거
        
        // 🌟 [핵심 해결책 1] 작게 고정되어 있던 아이콘 상자 자체를 탭바 전체 높이로 늘립니다.
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        
        // 🌟 [핵심 해결책 2] 터치 영역 전체를 수직/수평 정중앙 정렬합니다.
        tabBarItemStyle: {
          height: 72, // 탭바 높이와 일치시켜 쏠림 방지
          justifyContent: 'center',
          alignItems: 'center',
        },
        
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          let label = '';

          if (route.name === 'Content') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
            label = '학습';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'book' : 'book-outline';
            label = '홈';
          } else if (route.name === 'MyPage') {
            iconName = focused ? 'person' : 'person-outline';
            label = '마이페이지';
          }

          return (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={iconName}
                size={20}
                color={focused ? theme.colors.primary : '#888'}
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {label}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Content" component={StoryHomeScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="MyPage" component={MyPageScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 22, // 화면 바닥에서 띄우는 높이
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    height: 72, // 🌟 전체 푸터 바의 명확한 고정 높이
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderTopWidth: 0,
    paddingBottom: 0, 
    paddingTop: 0,
  },
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 76, 
    height: 52, // 🌟 전체 높이 72 안에서 위아래 정확히 10px씩 대칭 여백이 남도록 설정
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: theme.colors.secondary, // 연두색 배경
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: theme.colors.primary, 
    fontWeight: 'bold',
  }
});