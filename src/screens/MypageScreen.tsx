// screens/MyPage/MyPageScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme'
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

// 💡 백엔드 기본 서버 주소 (본인 환경에 맞게 확인해주세요)
const API_BASE_URL = 'https://q-ring.app/api/v1';

// ─── 색상 ───
const C = {
  green: '#5a7247',
  darkGreen: '#3C6933',
  cardBg: '#FFFFFF',
  cardBorder: '#d5d5c8',
  badgeBg: '#edf7e6',
  logoutBg: '#FEF2F2',
  logoutText: '#BA1A1A',
};

// ─── 백엔드 응답 데이터 타입 정의 ───
interface MyPageData {
  nickname: string;
  levelCode: number;
  levelDesc: string;
  language: string; // 'ko', 'en', 'ja', 'zh' 등
  points: number;
  consecutiveDays: number;
}

// ─── 백엔드 언어 코드('en') -> 한글 명칭('영어') 변환 맵 ───
const LANGUAGE_MAP: { [key: string]: string } = {
  ko: '한국어',
  en: '영어',
  ja: '일본어',
  zh: '중국어',
};

// ─── 메뉴 아이템 타입 ───
interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  hasNotification?: boolean;
  isLogout?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'account', label: '계정 관리', icon: 'person-outline' },
  { id: 'sound', label: '소리 설정', icon: 'volume-high-outline' },
  { id: 'levelLang', label: '레벨 / 언어 변경', icon: 'options-outline' },
  { id: 'logout', label: '로그아웃', icon: 'log-out-outline', isLogout: true },
];

// ─── 메뉴 아이콘 ───
const MenuIcon = ({ name, isLogout }: { name: keyof typeof Ionicons.glyphMap; isLogout?: boolean }) => {
  const color = isLogout ? C.logoutText : C.green;
  const bg = isLogout ? C.logoutBg : C.badgeBg;

  return (
    <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
};

// ─── 메인 컴포넌트 ───
const MyPageScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<MyPageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 🌟 마이페이지 API 호출 함수
  const fetchMyPageData = async () => {
    try {
      setIsLoading(true);
      // 저장된 토큰 가져오기 (없을 경우 임시 토큰 사용)
      const token = (await AsyncStorage.getItem('accessToken')) || 'your-auth-token-example';

      // POST 방식으로 프론트가 토큰을 JSON 바디에 담아 전송
      const response = await axios.post(
        `${API_BASE_URL}/mypage`,
        {}, // 바디 내용이 없으면 빈 객체 {} 전송
        {
          headers: {
            Authorization: `Bearer ${token}`, // 헤더에 토큰 첨부
          },
        }
      );

      if (response.data) {
        setUserData(response.data);
      }
    } catch (error: any) {
      console.error('마이페이지 정보 조회 에러:', error);
      Alert.alert('알림', '마이페이지 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🌟 화면이 로드될 때 API 호출
  useEffect(() => {
    fetchMyPageData();
  }, []);

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="마이페이지" leftType="back" rightType="none" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>정보를 불러오는 중...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // 데이터 조회 실패 시 기본값 fallback 처리
  const nickname = userData?.nickname || '사용자';
  const levelCode = userData?.levelCode || 1;
  const levelDesc = userData?.levelDesc || '기초';
  const points = userData?.points || 0;
  const consecutiveDays = userData?.consecutiveDays || 0;
  
  // 백엔드 언어 코드('en')를 한글 명칭('영어')으로 변환 (매칭 안 되면 '영어' 기본값)
  const userLangKorean = userData?.language ? (LANGUAGE_MAP[userData.language] || '영어') : '영어';

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="마이페이지" leftType="back" rightType="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 영역 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrap}>
            <View style={styles.profileImage} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>{nickname}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.{levelCode} {levelDesc}</Text>
          </View>
        </View>

        {/* 스탯 카드 (누적 점수 대신 API 응답인 보유 포인트 & 연속 학습일 매핑) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue1}>{points.toLocaleString()}</Text>
            <Text style={styles.statLabel}>보유 포인트 (P)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue2}>{consecutiveDays}</Text>
            <Text style={styles.statLabel}>연속 학습일</Text>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                item.isLogout && styles.menuRowLogout,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.id === 'account') {
                  navigation.navigate('AccountManagementScreen', { nickname: nickname });
                } else if (item.id === 'levelLang') {
                  // 🌟 API로 받아온 실제 언어(한글명)와 레벨 정보를 파라미터로 실어서 넘겨줍니다!
                  navigation.navigate('LearningSettingsScreen', {
                    userLang: userLangKorean,
                    userLevel: levelCode,
                  });
                } else if (item.isLogout) {
                  Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
                    { text: '취소', style: 'cancel' },
                    { text: '확인', style: 'destructive', onPress: async () => {
                      await AsyncStorage.clear();
                      navigation.navigate('Login');
                    }}
                  ]);
                }
              }}
            >
              <View style={styles.menuLeft}>
                <MenuIcon name={item.icon} isLogout={item.isLogout} />
                <Text style={[
                  styles.menuLabel,
                  item.isLogout && { color: C.logoutText },
                ]}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.menuRight}>
                {item.hasNotification && <View style={styles.notificationDot} />}
                {!item.isLogout && (
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },

  // 프로필
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  levelBadge: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // 스탯
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 25,
    borderColor: C.cardBorder,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3C6933',
  },
  statValue2: {
    fontSize: 24,
    fontWeight: '800',
    color: '#BA1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },

  // 메뉴
  menuList: {
    gap: 10,
  },
  menuRow: {
    backgroundColor: C.cardBg,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowLogout: {
    borderColor: '#f5d5d5',
    backgroundColor: '#fff',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
  },
});

export default MyPageScreen;