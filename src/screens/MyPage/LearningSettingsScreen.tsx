// src/screens/MyPage/LearningSettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../constants/theme';
const { colors, fonts } = theme;
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '../../components/common/AlertHost';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 💡 백엔드 기본 서버 주소 (환경에 맞게 수정해주세요)
const BASE_URL = 'https://q-ring.app/api/v1';

interface LevelOption {
  level: number;
  label: string;
  subLabel: string;
}

const LEVELS: LevelOption[] = [
  { level: 1, label: 'Lv.1', subLabel: '기초' },
  { level: 2, label: 'Lv.2', subLabel: '중급' },
  { level: 3, label: 'Lv.3', subLabel: '고급' },
];

// 🌟 스페인어 제거됨
const LANGUAGES = ['일본어', '중국어', '영어'];

const LearningSettingsScreen = ({ navigation, route }: any) => {
  // ─── 상태 관리 (State) ───
  const [currentLang, setCurrentLang] = useState(route?.params?.userLang || '영어');
  const [currentLevel, setCurrentLevel] = useState(route?.params?.userLevel || 2);

  // 🌟 초기값을 빈 문자열로 두어, 사용자가 하단에서 '새 언어'를 직접 선택했는지 구분
  const [selectedNewLang, setSelectedNewLang] = useState('');
  const [selectedNewLevel, setSelectedNewLevel] = useState(currentLevel);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 갤럭시 내비게이션 바(제스처 24, 3버튼 48)에 저장 버튼이 가리지 않도록 실제 높이를 받아온다.
  const insets = useSafeAreaInsets();

  const getAuthToken = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return token || '';
  };

  // ─── 초기 로드 시 파라미터 체크 ───
  useEffect(() => {
    if (route?.params?.userLang) {
      setCurrentLang(route.params.userLang);
    }
    if (route?.params?.userLevel) {
      setCurrentLevel(route.params.userLevel);
      setSelectedNewLevel(route.params.userLevel);
    }
  }, [route?.params]);

  // ─── 백엔드 언어 이름 -> 코드 변환 맵 ───
  const LANGUAGE_CODE_MAP: { [key: string]: string } = {
    '일본어': 'JA',
    '중국어': 'ZH',
    '영어': 'EN',
  };

  // ─── API: 학습 설정 저장 함수 ───
  const handleSaveSettings = async () => {
    try {
      setIsSubmitting(true);
      const token = await getAuthToken();

      // 🌟 하단에서 새 언어를 선택했다면 하단 설정 저장, 아니면 상단(현재 언어)의 변경된 레벨 저장
      const targetLang = selectedNewLang ? selectedNewLang : currentLang;
      const targetLevel = selectedNewLang ? selectedNewLevel : currentLevel;

      const payload = {
        language: LANGUAGE_CODE_MAP[targetLang] || 'EN',
        levelCode: targetLevel,
      };

      const response = await axios.post(
        `${BASE_URL}/mypage/learning`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status >= 200 && response.status < 300) {
        setCurrentLang(targetLang);
        setCurrentLevel(targetLevel);

        // 즉시 대시보드(MainTab)로 이동
        navigation.navigate('MainTab');
      }
    } catch (error) {
      console.error('학습 설정 저장 에러:', error);
      showAlert({ title: '오류', message: '학습 설정 저장 중 문제가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header 
        title="학습 설정" 
        leftType="back" 
        rightType="none" 
      />

      {/* 🌟 ScrollView 제거 및 View 로 대체 */}
      <View style={[styles.scroll, styles.content, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
        
        {/* 🌟 카드 영역들이 안드로이드/아이폰 비율에 맞춰 분배되도록 래핑 */}
        <View style={{ flex: 1, justifyContent: 'space-evenly' }}>
          {/* 1. 현재 학습 설정 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.headerTitleWrap}>
                <View style={styles.iconCircle}>
                  <Ionicons name="settings-sharp" size={18} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>현재 학습 설정</Text>
              </View>
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>현재 언어: {currentLang}</Text>
              </View>
            </View>

            <Text style={styles.subLabel}>현재 학습 레벨</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((item) => {
                const isSelected = currentLevel === item.level;
                return (
                  <TouchableOpacity
                    key={`cur-${item.level}`}
                    style={[styles.levelCard, isSelected ? styles.levelCardSelected : styles.levelCardDefault]}
                    onPress={() => {
                      // 상단 레벨 클릭 시 하단 동기화(setSelectedNewLevel) 제거
                      setCurrentLevel(item.level);
                      setSelectedNewLang(''); // 상단을 조작하면 하단 새 언어 선택 상태 해제
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.levelText, isSelected && styles.textWhite]}>{item.label}</Text>
                    <Text style={[styles.levelSubText, isSelected && styles.textWhiteSub]}>{item.subLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. 새로운 언어 추가 카드 */}
          <View style={[styles.card, styles.marginTop]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconCircle, styles.plusCircle]}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>새로운 언어 추가 / 변경</Text>
            </View>

            {/* 언어 칩 리스트 */}
            <View style={styles.langChipContainer}>
              {/* 현재 설정된 언어(currentLang)를 필터링하여 목록에서 제외 */}
              {LANGUAGES.filter(lang => lang !== currentLang).map((lang) => {
                const isSelected = selectedNewLang === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langChip, isSelected && styles.langChipSelected]}
                    onPress={() => setSelectedNewLang(lang)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.subLabel}>시작 레벨 선택</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((item) => {
                const isSelected = selectedNewLevel === item.level;
                return (
                  <TouchableOpacity
                    key={`new-${item.level}`}
                    style={[styles.levelCard, isSelected ? styles.levelCardSelected : styles.levelCardDefault]}
                    onPress={() => {
                      setSelectedNewLevel(item.level);
                      // 만약 언어 칩을 선택하지 않고 하단 레벨만 눌렀다면, 남아있는 새 언어 중 첫 번째를 자동 지정
                      if (!selectedNewLang) {
                        const availableLangs = LANGUAGES.filter(l => l !== currentLang);
                        if (availableLangs.length > 0) setSelectedNewLang(availableLangs[0]);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.levelText, isSelected && styles.textWhite]}>{item.label}</Text>
                    <Text style={[styles.levelSubText, isSelected && styles.textWhiteSub]}>{item.subLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 설정 저장하기 버튼 */}
        <TouchableOpacity 
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
          onPress={handleSaveSettings}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>설정 저장하기</Text>
          )}
        </TouchableOpacity>

      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 0, backgroundColor: colors.background },
  scroll: { flex: 1 },
  // 🌟 iOS와 Android의 하단 여백 다르게 처리하여 짤림 방지, 버튼이 맨 아래 고정되도록 space-between 설정
  // 하단 여백은 기기마다 달라서 JSX 에서 insets 로 직접 넣는다.
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  marginTop: { marginTop: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF7E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircle: { backgroundColor: '#F0F2EE' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3A29', fontFamily: fonts.headline },
  langBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  langBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', fontFamily: fonts.label },
  subLabel: { fontSize: 13, color: '#6B7A68', fontFamily: fonts.label, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelCard: { flex: 1, paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  levelCardDefault: { backgroundColor: '#F5F4E6' },
  levelCardSelected: { backgroundColor: colors.primary },
  levelText: { fontSize: 16, fontWeight: '800', color: '#3C6933', fontFamily: fonts.headline },
  levelSubText: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 4, fontFamily: fonts.body },
  textWhite: { color: '#FFFFFF' },
  textWhiteSub: { color: '#E0E8D5' },
  langChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, marginTop: 4 },
  langChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E0E8D5', backgroundColor: '#FFFFFF' },
  langChipSelected: { borderColor: colors.primary, backgroundColor: '#EDF7E6' },
  langChipText: { fontSize: 14, color: '#6B7A68', fontFamily: fonts.label, fontWeight: '600' },
  langChipTextSelected: { color: colors.primary, fontWeight: '700' },
  saveButton: { 
    backgroundColor: colors.primary, 
    height: 54, 
    borderRadius: 27, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 28, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 8, 
    elevation: 4 
  },
  saveButtonDisabled: { backgroundColor: '#A0A89C', shadowOpacity: 0 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: fonts.headline },
});

export default LearningSettingsScreen;