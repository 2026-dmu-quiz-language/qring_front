// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';

interface HeaderProps {
  title?: string;
  leftType?: 'back' | 'close' | 'none';
  rightType?: 'sprout' | 'menu' | 'profile' | 'none';
  onRightPress?: () => void;
  showLogo?: boolean;
  userName?: string;
}

// 환경 변수 또는 상수 파일에서 백엔드 주소 가져오기 (임시 하드코딩)
const API_BASE_URL = 'https://q-ring.app:8080/api/v1/auth';

export const Header = ({ 
  title, 
  leftType = 'back', 
  rightType = 'none', 
  onRightPress, 
  showLogo = false, 
  userName = '박수현' 
}: HeaderProps) => {
  const navigation = useNavigation<any>();
  
  // 🌟 프로필 메뉴(모달) 노출 여부 상태
  const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);

  // 🌟 오른쪽 버튼 클릭 핸들러 (profile일 때는 메뉴를 띄우고, 아니면 부모가 넘겨준 함수 실행)
  const handleRightPress = () => {
    if (rightType === 'profile') {
      setProfileMenuVisible(true);
    } else if (onRightPress) {
      onRightPress();
    }
  };

  // 🌟 로그아웃 API 호출 및 처리 로직
  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // 토큰이 있다면 백엔드에 로그아웃 요청 (토큰 만료 처리 등)
      if (token) {
        await axios.post(`${API_BASE_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout API Error:', error);
      // 서버에서 에러가 나더라도 클라이언트(앱)에서는 로그아웃 처리를 진행하는 것이 일반적입니다.
    } finally {
      // 1. 기기에 저장된 토큰 삭제
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      // 2. 모달 닫기
      setProfileMenuVisible(false);

      // 3. 네비게이션 스택을 초기화하며 로그인 화면으로 이동 (뒤로가기 방지)
      Alert.alert('로그아웃', '정상적으로 로그아웃 되었습니다.', [
        { 
          text: '확인', 
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) 
        }
      ]);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        
        {showLogo ? (
          <View style={styles.logoSection}>
            <Text style={styles.greetingText}>안녕하세요, {userName}님!</Text>
            <Image 
              source={require('../../../assets/quring_logo.png')} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
          </View>
        ) : (
          <>
            <View style={styles.leftSection}>
              {leftType === 'back' && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.colors.headerTitleText} />
                </TouchableOpacity>
              )}
              {leftType === 'close' && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color={theme.colors.headerTitleText} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.centerSection}>
              {title && <Text style={styles.title}>{title}</Text>}
            </View>
          </>
        )}

        <View style={styles.rightSection}>
          {rightType === 'sprout' && (
            <View style={styles.sproutCircle}>
              <Text style={{ fontSize: 16 }}>🌱</Text>
            </View>
          )}
          {rightType === 'menu' && (
            <TouchableOpacity onPress={handleRightPress} style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {rightType === 'profile' && (
            <TouchableOpacity onPress={handleRightPress} style={styles.iconButton}>
              <Ionicons name="person-circle" size={28} color="#2C3E50" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 🌟 프로필 메뉴 팝업 (Modal) */}
      <Modal
        visible={isProfileMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        {/* 모달 바깥 영역(어두운 배경)을 누르면 모달이 닫히도록 설정 */}
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setProfileMenuVisible(false)}
        >
          {/* 실제 메뉴 컨테이너 (우측 상단에 위치) */}
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Ionicons name="person-circle" size={32} color="#CCC" />
              <Text style={styles.menuUserName}>{userName} 님</Text>
            </View>
            
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#dc3545" />
              <Text style={styles.menuLogoutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: 'rgba(233, 233, 219, 0.8)',
    paddingBottom: 10,
    paddingTop: 10,
  },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(250, 250, 236, 0.8)',
  },
  leftSection: { width: 40, alignItems: 'flex-start' },
  centerSection: { flex: 1, alignItems: 'flex-start', paddingLeft: 5 },
  rightSection: { width: 40, alignItems: 'flex-end' },
  title: {
    fontSize: 18,
    fontFamily: theme.fonts.headline,
    color: theme.colors.headerTitleText,
    fontWeight: 'bold',
  },
  iconButton: { padding: 5, marginLeft: -5 },
  sproutCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.lightPeach, alignItems: 'center', justifyContent: 'center' },
  logoSection: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 5, paddingVertical: 5 },
  greetingText: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 4 },
  headerLogo: { width: 80, height: 24 },

  // 🌟 모달 관련 스타일 추가
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 배경을 살짝 어둡게 처리
  },
  menuContainer: {
    position: 'absolute',
    top: 60, // 헤더 높이만큼 띄움
    right: 15, // 화면 우측에 여백
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  menuUserName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  menuLogoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc3545', // 빨간색으로 경고/탈출 느낌 강조
  },
});