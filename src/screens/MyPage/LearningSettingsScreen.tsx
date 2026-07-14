// src/screens/MyPage/LearningSettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../constants/theme';
const { colors, fonts } = theme;
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
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

// 🌟 수정 1: 스페인어 제거
const LANGUAGES = ['일본어', '중국어', '영어'];

const LearningSettingsScreen = ({ navigation, route }: any) => {
  // ─── 상태 관리 (State) ───
  const [currentLang, setCurrentLang] = useState(route?.params?.userLang || '영어');
  const [currentLevel, setCurrentLevel] = useState(route?.params?.userLevel || 2);

  // 🌟 수정 2: 초기값을 빈 문자열로 두어, 사용자가 하단에서 '새 언어'를 직접 선택했는지 구분
  const [selectedNewLang, setSelectedNewLang] = useState('');
  const [selectedNewLevel, setSelectedNewLevel] = useState(currentLevel);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ─── 백엔드 언어 이름 -> 코드 변환 맵 (스페인어 제거) ───
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

      // 🌟 수정 3: 하단에서 새 언어를 선택했다면 하단 설정 저장, 아니면 상단(현재 언어)의 변경된 레벨 저장
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
      Alert.alert('오류', '학습 설정 저장 중 문제가 발생했습니다. 다시 시도해주세요.');
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
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
                    // 🌟 수정 4: 상단 레벨 클릭 시 하단 동기화(setSelectedNewLevel) 제거
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
            {/* 🌟 수정 5: 현재 설정된 언어(currentLang)를 필터링하여 목록에서 제외 */}
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

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 0, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  marginTop: { marginTop: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EDF7E6', justifyContent: 'center', alignItems: 'center' },
  plusCircle: { backgroundColor: '#F0F2EE' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3A29', fontFamily: fonts.headline },
  langBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  langBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', fontFamily: fonts.label },
  subLabel: { fontSize: 13, color: '#6B7A68', fontFamily: fonts.label, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelCard: { flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelCardDefault: { backgroundColor: '#F5F5EC' },
  levelCardSelected: { backgroundColor: colors.secondary },
  levelText: { fontSize: 16, fontWeight: '800', color: '#2C3A29', fontFamily: fonts.headline },
  levelSubText: { fontSize: 12, color: '#6B7A68', fontWeight: '500', marginTop: 2, fontFamily: fonts.body },
  textWhite: { color: '#FFFFFF' },
  textWhiteSub: { color: '#EDF7E6' },
  langChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  langChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DCE2D6', backgroundColor: '#FFFFFF' },
  langChipSelected: { borderColor: colors.primary, backgroundColor: '#EDF7E6' },
  langChipText: { fontSize: 13, color: '#6B7A68', fontFamily: fonts.label, fontWeight: '600' },
  langChipTextSelected: { color: colors.primary, fontWeight: '700' },
  saveButton: { backgroundColor: colors.primary, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 4 },
  saveButtonDisabled: { backgroundColor: '#A0A89C' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: fonts.headline },
});

export default LearningSettingsScreen;