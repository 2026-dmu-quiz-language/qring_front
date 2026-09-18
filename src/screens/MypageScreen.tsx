// screens/MyPage/MyPageScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text } from '../components/common/Text';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { playSfx, isSfxEnabled, setSfxEnabled } from '../utils/sfx';
import { showAlert, showConfirm } from '../components/common/AlertHost';
import { Toggle } from '../components/common/Toggle'; // 🌟 기존에 사용하시던 Toggle 컴포넌트 복구

// 💡 백엔드 기본 서버 주소
const API_BASE_URL = 'https://q-ring.app/api/v1';

// ─── 백엔드 응답 데이터 타입 정의 ───
interface MyPageData {
  nickname: string;
  levelCode: number;
  levelDesc: string;
  language: string; 
  points: number;
  consecutiveDays: number;
}

// ─── 백엔드 언어 코드 -> 한글 명칭 변환 맵 ───
const LANGUAGE_MAP: { [key: string]: string } = {
  ko: '한국어',
  en: '영어',
  ja: '일본어',
  zh: '중국어',
};

export default function MyPageScreen({ navigation }: any) {
  // 🌟 [UI 로직] 프로필 이모지 배열 및 순환 상태
  const emojis = [
    require('../../assets/Qring-emoji1.png'),
    require('../../assets/Qring-emoji2.png'),
    require('../../assets/Qring-emoji3.png'),
  ];
  const [emojiIndex, setEmojiIndex] = useState(0);

  // 🌟 [기능 로직] API 데이터 및 로딩 상태
  const [userData, setUserData] = useState<MyPageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 🌟 [기능 로직] 효과음 상태 관리
  const [sfxOn, setSfxOn] = useState(isSfxEnabled());

  const handleToggleSfx = (next: boolean) => {
    setSfxOn(next);
    setSfxEnabled(next);
    if (next) playSfx('touch');
  };

  // 🌟 [기능 로직] 마이페이지 API 호출
  const fetchMyPageData = async () => {
    try {
      setIsLoading(true);
      const token = (await AsyncStorage.getItem('accessToken')) || 'your-auth-token-example';

      const response = await axios.post(
        `${API_BASE_URL}/mypage`,
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        }
      );

      if (response.data) {
        setUserData(response.data);
      }
    } catch (error: any) {
      console.error('마이페이지 정보 조회 에러:', error);
      showAlert({ title: '알림', message: '마이페이지 정보를 불러오지 못했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 컴포넌트 마운트 시 API 호출 및 이모지 순환 타이머 시작
  useEffect(() => {
    fetchMyPageData();

    const timer = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 2000); 
    
    return () => clearInterval(timer);
  }, []);

  // 로딩 중 UI
  if (isLoading) {
    return (
      <ScreenWrapper style={styles.container}>
        <Header title="마이페이지" leftType="back" rightType="none" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // 데이터 매핑 (기본값 Fallback)
  const nickname = userData?.nickname || '사용자';
  const levelCode = userData?.levelCode || 1;
  const levelDesc = userData?.levelDesc || '기초 단어 암기 수준';
  const points = userData?.points || 0;
  const consecutiveDays = userData?.consecutiveDays || 0;
  const userLangKorean = userData?.language ? (LANGUAGE_MAP[userData.language] || '영어') : '영어';

  return (
    <ScreenWrapper style={styles.container}>
      <Header title="마이페이지" leftType="back" rightType="none" />
      
      {/* 🌟 ScrollView를 View로 변경하고 flex: 1 적용, 한 화면에 꽉 차게 핏되도록 여백 조정 */}
      <View style={styles.content}>
        
        {/* --- 프로필 섹션 --- */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            <Image 
              source={emojis[emojiIndex]} 
              style={styles.profileImage} 
              resizeMode="cover" 
            />
            <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
              <Ionicons name="pencil" size={14} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{nickname}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{levelCode} {levelDesc}</Text>
          </View>
        </View>

        {/* --- 스탯 섹션 --- */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>보유 포인트 (P)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueRight}>{consecutiveDays}</Text>
            <Text style={styles.statLabel}>연속 학습일</Text>
          </View>
        </View>

        {/* --- 메뉴 리스트 --- */}
        <View style={styles.menuContainer}>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => {
              playSfx('touch');
              navigation.navigate('AccountManagementScreen', { nickname: nickname });
            }}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuText}>계정 관리</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuIconWrap}>
              <Ionicons name="volume-medium-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuText}>소리 설정</Text>
            {/* 🌟 React Native의 기본 Switch 대신 원래 쓰시던 커스텀 Toggle 컴포넌트로 교체 */}
            <Toggle value={sfxOn} onChange={handleToggleSfx} />
          </View>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => {
              playSfx('touch');
              navigation.navigate('LearningSettingsScreen', {
                userLang: userLangKorean,
                userLevel: levelCode,
              });
            }}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuText}>레벨 / 언어 변경</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={() => {
              playSfx('touch');
              navigation.navigate('AppInfoScreen');
            }}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuText}>앱 정보</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textDisabled} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            activeOpacity={0.7}
            onPress={async () => {
              playSfx('touch');
              const isConfirmed = await showConfirm({
                title: '로그아웃',
                message: '정말 로그아웃 하시겠습니까?',
                confirmText: '확인',
                cancelText: '취소',
                destructive: true,
              });
              if (isConfirmed) {
                await AsyncStorage.clear();
                navigation.navigate('Login');
              }
            }}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: theme.colors.dangerSurface }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.colors.dangerSoft} />
            </View>
            <Text style={[styles.menuText, { color: theme.colors.dangerSoft }]}>로그아웃</Text>
          </TouchableOpacity>

        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // 🌟 View로 감싸고 flex: 1 할당하여 화면에 핏되게 함
  content: { 
    flex: 1,
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 24, // 하단 네비게이션 바를 고려한 여백
    justifyContent: 'space-between', // 상/중/하단 요소가 균형있게 퍼지도록
  },
  
  // --- 프로필 스타일 ---
  profileSection: { 
    alignItems: 'center', 
    marginBottom: 16, 
  },
  profileImageWrapper: { 
    width: 90, // 화면 핏을 위해 소폭 축소
    height: 90, 
    borderRadius: 45, 
    backgroundColor: theme.colors.surface, 
    position: 'relative',
    marginBottom: 10,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  profileImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 45 
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  profileName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: theme.colors.text, 
    marginBottom: 8 
  },
  levelBadge: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 16 
  },
  levelText: { 
    color: theme.colors.surface, 
    fontSize: 12, 
    fontWeight: '600' 
  },

  // --- 스탯 (포인트, 학습일) 스타일 ---
  statsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 20 
  },
  statCard: { 
    flex: 1, 
    backgroundColor: theme.colors.lightGreen, 
    borderRadius: 20, 
    paddingVertical: 18, // 세로 공간 확보를 위해 소폭 축소
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: theme.colors.darkGreen, 
    marginBottom: 4 
  },
  statValueRight: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: theme.colors.danger, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: theme.colors.textMuted 
  },

  // --- 메뉴 리스트 스타일 ---
  menuContainer: { 
    flex: 1, 
    justifyContent: 'flex-start',
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.colors.surface, 
    paddingVertical: 12, // 한 화면 핏을 위한 패딩 조절
    paddingHorizontal: 16, 
    borderRadius: 18, 
    marginBottom: 10,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.greenTint, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '700', 
    color: theme.colors.text 
  },
});