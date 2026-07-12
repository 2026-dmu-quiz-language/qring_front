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

// 💡 백엔드 기본 서버 주소 (환경에 맞게 수정해주세요)
const BASE_URL = 'https://api.your-qring-server.com';

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

const LANGUAGES = ['일본어', '중국어', '영어', '스페인어'];

// 💡 네비게이션 param으로 이미 로드된 정보를 전달받을 수 있도록 route를 추가합니다.
export const LearningSettingsScreen = ({ navigation, route }: any) => {
  // ─── 상태 관리 (State) ───
  // [1] 현재 학습 설정: route.params에 값이 있으면 그것을 사용하고, 없으면 기본값('영어', 2) 사용
  const [currentLang, setCurrentLang] = useState(route?.params?.userLang || '영어');
  const [currentLevel, setCurrentLevel] = useState(route?.params?.userLevel || 2);

  // [2] 변경할 새로운 학습 설정 (기존 설정으로 초기화)
  const [selectedNewLang, setSelectedNewLang] = useState(currentLang);
  const [selectedNewLevel, setSelectedNewLevel] = useState(currentLevel);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 [임시 토큰 조회 함수] : 실제 운영 시에는 AsyncStorage 나 전역 상태에서 가져옵니다.
  const getAuthToken = async () => {
    return 'your-auth-token-example';
  };

  // ─── 초기 로드 시 파라미터 체크 ───
  useEffect(() => {
    // 만약 마이페이지에서 넘어올 때 파라미터가 있었다면 상단 '현재 학습 설정'에 바로 반영
    if (route?.params?.userLang) setCurrentLang(route.params.userLang);
    if (route?.params?.userLevel) setCurrentLevel(route.params.userLevel);
  }, [route?.params]);

  // ─── API: 학습 설정 저장 함수 ───
  const handleSaveSettings = async () => {
    try {
      setIsSubmitting(true);
      const token = await getAuthToken();

      // 명세 반영: /mypage/learning 엔드포인트로 POST 요청하며 JSON 형식으로 데이터 전송
      const payload = {
        token: token,
        language: selectedNewLang,
        level: selectedNewLevel,
      };

      const response = await axios.post(`${BASE_URL}/mypage/learning`, payload);

      // 백엔드 요청 성공 시 처리
      if (response.status === 200 || response.status === 201 || response.data) {
        // 현재 설정 상태도 업데이트해 줍니다.
        setCurrentLang(selectedNewLang);
        setCurrentLevel(selectedNewLevel);

        Alert.alert(
          '설정 저장 성공 🎉',
          `${selectedNewLang} (Lv.${selectedNewLevel}) 학습 설정이 변경되었습니다.`,
          [{ text: '확인', onPress: () => navigation?.goBack() }]
        );
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
        
        {/* 1. 현재 학습 설정 카드 (프론트 데이터 바인딩 완료) */}
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
                  // 상단 카드 클릭 시 바로 변경할 설정값으로 반영되도록 편의성 추가
                  onPress={() => {
                    setCurrentLevel(item.level);
                    setSelectedNewLevel(item.level);
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
            {LANGUAGES.map((lang) => {
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
                  onPress={() => setSelectedNewLevel(item.level)}
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