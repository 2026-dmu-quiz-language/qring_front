import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text } from '../components/common/Text';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { theme } from '../constants/theme';
import StoryHomeScreen from '../screens/StoryHomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WrongNoteScreen from '../screens/WrongNoteScreen';
import StoryMainScreen from '../screens/StoryMainScreen';

const Tab = createBottomTabNavigator();

export const BottomTabNav = () => {
  const insets = useSafeAreaInsets(); 

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        
        // 🌟 핵심: (props as any)를 사용해 타입 충돌 에러를 무시하고 넘깁니다.
        tabBarButton: (props) => (
          <TouchableOpacity {...(props as any)} activeOpacity={1} />
        ),
        
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 55 + insets.bottom : 60 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          overflow: 'hidden', 
        },
        
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 38,
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
          } else if (route.name === 'WrongNote') {
            iconName = focused ? 'document-text' : 'document-text-outline';
            label = '오답노트';
          } else if (route.name === 'Story') {
            iconName = focused ? 'sparkles' : 'sparkles-outline'; 
            label = '스토리';
          }

          return (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={iconName}
                size={22} 
                color={focused ? theme.colors.primary : theme.colors.textMuted}
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
      <Tab.Screen name="Story" component={StoryMainScreen} />
      <Tab.Screen name="WrongNote" component={WrongNoteScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 68, 
    height: 44, 
  },
  tabItemActive: {
    backgroundColor: 'transparent', 
  },
  tabLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2, 
    fontWeight: '600',
  },
  tabLabelActive: {
    color: theme.colors.primary, 
    fontWeight: 'bold',
  }
});