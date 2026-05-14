// src/components/layout/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface HeaderProps {
  title?: string;
  leftType?: 'back' | 'close' | 'none';
  rightType?: 'sprout' | 'menu' | 'profile' | 'none';
  onRightPress?: () => void;
  showLogo?: boolean; // 🌟 요청하신 로고 표시 여부 프롭스 추가
}

export const Header = ({ title, leftType = 'back', rightType = 'none', onRightPress, showLogo = false }: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      
      {/* 🌟 1. 상단 바 영역 (시안의 <- 회원가입 🌱 부분) */}
      <View style={styles.topBar}>
        {/* 왼쪽 영역 */}
        <View style={styles.leftSection}>
          {leftType === 'back' && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              {/* 시안처럼 진한 국방색 적용 */}
              <Ionicons name="arrow-back" size={24} color={theme.colors.headerTitleText} />
            </TouchableOpacity>
          )}
          {leftType === 'close' && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="close" size={24} color={theme.colors.headerTitleText} />
            </TouchableOpacity>
          )}
        </View>

        {/* 중앙 타이틀 영역 */}
        <View style={styles.centerSection}>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        {/* 오른쪽 영역 */}
        <View style={styles.rightSection}>
          {rightType === 'sprout' && (
            <View style={styles.sproutCircle}>
              {/* 시안처럼 나중에 이미지를 넣을 수 있게 세팅 (현재는 임시 새싹 이모지) */}
              <Text style={{ fontSize: 16 }}>🌱</Text>
              {/* 💡 나중에 위 Text를 지우고 아래 이미지 태그 주석을 푸세요! */}
              {/* <Image source={require('../../../assets/icon.png')} style={{width: 20, height: 20}} resizeMode="contain" /> */}
            </View>
          )}
          {rightType === 'menu' && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {rightType === 'profile' && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <Ionicons name="person-circle" size={28} color="#2C3E50" />
            </TouchableOpacity>
          )}
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: 'rgba(233, 233, 219, 0.8)',
    paddingBottom: 10,
    paddingTop: 10, // 상태바 여백 (필요시 조절)
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(250, 250, 236, 0.8)',
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start', // 시안처럼 왼쪽으로 밀착
  },
  centerSection: {
    flex: 1,
    alignItems: 'flex-start', // 시안처럼 타이틀이 아이콘 바로 옆에 오도록
    paddingLeft: 5,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end', // 시안처럼 오른쪽으로 밀착
  },
  title: {
    fontSize: 18,
    fontFamily: theme.fonts.headline,
    color: theme.colors.headerTitleText, // 시안과 동일한 텍스트 컬러 (#4E5E43)
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 5,
    marginLeft: -5, // 터치 영역은 유지하되 시각적으로 벽에 붙임
  },
  sproutCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // 🌟 테마의 lightPeach 컬러 적용
    backgroundColor: theme.colors.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    paddingHorizontal: 25, // 로고가 타이틀 라인과 예쁘게 맞도록 여백 설정
    marginTop: 5,
  },
  logoImage: {
    width: 110, // 로고 크기
    height: 35,
  }
});