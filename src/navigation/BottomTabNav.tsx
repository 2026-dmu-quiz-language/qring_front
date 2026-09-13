import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
        
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EFEFEF',
          height: Platform.OS === 'ios' ? 60 + insets.bottom : 65,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 5,
          paddingTop: 5,
        },
        
        tabBarItemStyle: {
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
                size={24} 
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
    height: 48, 
  },
  tabItemActive: {
    backgroundColor: 'transparent', 
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4, 
    fontWeight: '600',
  },
  tabLabelActive: {
    color: theme.colors.primary, 
    fontWeight: 'bold',
  }
});