import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface HeaderProps {
  title?: string;
  leftType?: 'back' | 'close' | 'none';  // 왼쪽 아이콘 타입
  rightType?: 'sprout' | 'menu' | 'profile' | 'none'; // 오른쪽 아이콘 타입
  onRightPress?: () => void;
}

export const Header = ({ title, leftType = 'back', rightType = 'none', onRightPress }: HeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      {/* 왼쪽 영역 */}
      <View style={styles.sideSection}>
        {leftType === 'back' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {leftType === 'close' && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 중앙 타이틀 영역 */}
      <View style={styles.centerSection}>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      {/* 오른쪽 영역 */}
      <View style={styles.sideSection}>
        {rightType === 'sprout' && (
          <View style={styles.sproutCircle}>
            <Text style={{ fontSize: 16 }}>🌱</Text>
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
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background, // 배경색과 통일
  },
  sideSection: {
    width: 40, // 좌우 여백 밸런스를 맞추기 위해 고정 너비 부여
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'flex-start', // 시안상 타이틀이 살짝 왼쪽에 치우친 느낌 적용
    paddingLeft: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: theme.fonts.headline,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 5,
  },
  sproutCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E5D8',
    alignItems: 'center',
    justifyContent: 'center',
  }
});