// src/screens/MyPage/LearningSettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/common/Text';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../constants/theme';
const { colors, fonts } = theme;
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '../../components/common/AlertHost';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const LANGUAGES = ['일본어', '중국어', '영어'];

// UI 모드 타입 정의 (CHANGE: 레벨 변경, ADD: 새 언어 추가)
type ModeType = 'CHANGE' | 'ADD';

const LearningSettingsScreen = ({ navigation, route }: any) => {
  // ─── 상태 관리 (State) ───
  const [activeTab, setActiveTab] = useState<ModeType>('CHANGE'); // 현재 선택된 모드 탭

  const [currentLang, setCurrentLang] = useState(route?.params?.userLang || '영어');
  const [currentLevel, setCurrentLevel] = useState(route?.params?.userLevel || 2);

  // 새 언어 추가용 상태
  const [selectedNewLang, setSelectedNewLang] = useState('');
  const [selectedNewLevel, setSelectedNewLevel] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const insets = useSafeAreaInsets();

  const getAuthToken = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return token || '';
  };

  useEffect(() => {
    if (route?.params?.userLang) {
      setCurrentLang(route.params.userLang);
    }
    if (route?.params?.userLevel) {
      setCurrentLevel(route.params.userLevel);
    }
  }, [route?.params]);

  // 새 언어 기본 선택 처리 (현재 사용 중인 언어를 제외한 첫 번째 언어 자동 선택)
  useEffect(() => {
    const availableLangs = LANGUAGES.filter((lang) => lang !== currentLang);
    if (availableLangs.length > 0 && !selectedNewLang) {
      setSelectedNewLang(availableLangs[0]);
    }
  }, [currentLang]);

  const LANGUAGE_CODE_MAP: { [key: string]: string } = {
    일본어: 'JA',
    중국어: 'ZH',
    영어: 'EN',
  };

  // ─── API: 학습 설정 저장 ───
  const handleSaveSettings = async () => {
    // 탭 모드에 맞춰 저장할 대상 설정
    const isChangeMode = activeTab === 'CHANGE';
    const targetLang = isChangeMode ? currentLang : selectedNewLang;
    const targetLevel = isChangeMode ? currentLevel : selectedNewLevel;

    if (!targetLang) {
      showAlert({ title: '안내', message: '추가할 언어를 선택해주세요.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getAuthToken();

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
        navigation.navigate('MainTab');
      }
    } catch (error) {
      console.error('학습 설정 저장 에러:', error);
      showAlert({
        title: '오류',
        message: '학습 설정 저장 중 문제가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header title="학습 설정" leftType="back" rightType="none" />

      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 8, 20) },
        ]}
      >
        <View style={{ flex: 1 }}>
          {/* 🌟 1. 모드 전환 세그먼트 탭 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'CHANGE' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('CHANGE')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'CHANGE' && styles.tabTextActive,
                ]}
              >
                레벨 변경
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'ADD' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('ADD')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'ADD' && styles.tabTextActive,
                ]}
              >
                새 언어 추가
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🌟 2. 조건부 렌더링 카드 영역 */}
          {activeTab === 'CHANGE' ? (
            /* [상황 1] 레벨 변경 모드 */
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.headerTitleWrap}>
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="settings-sharp"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.cardTitle}>현재 학습 레벨 변경</Text>
                </View>
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>{currentLang}</Text>
                </View>
              </View>

              <Text style={styles.subLabel}>변경할 레벨을 선택하세요</Text>
              <View style={styles.levelRow}>
                {LEVELS.map((item) => {
                  const isSelected = currentLevel === item.level;
                  return (
                    <TouchableOpacity
                      key={`cur-${item.level}`}
                      style={[
                        styles.levelCard,
                        isSelected
                          ? styles.levelCardSelected
                          : styles.levelCardDefault,
                      ]}
                      onPress={() => setCurrentLevel(item.level)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.levelText,
                          isSelected && styles.textWhite,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.levelSubText,
                          isSelected && styles.textWhiteSub,
                        ]}
                      >
                        {item.subLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* [상황 2] 새 언어 추가 모드 */
            <View style={styles.card}>
              <View style={styles.headerTitleWrap}>
                <View style={[styles.iconCircle, styles.plusCircle]}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>새로운 언어 추가</Text>
              </View>

              <Text style={styles.subLabel}>학습할 언어 선택</Text>
              <View style={styles.langChipContainer}>
                {LANGUAGES.filter((lang) => lang !== currentLang).map((lang) => {
                  const isSelected = selectedNewLang === lang;
                  return (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.langChip,
                        isSelected && styles.langChipSelected,
                      ]}
                      onPress={() => setSelectedNewLang(lang)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.langChipText,
                          isSelected && styles.langChipTextSelected,
                        ]}
                      >
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
                      style={[
                        styles.levelCard,
                        isSelected
                          ? styles.levelCardSelected
                          : styles.levelCardDefault,
                      ]}
                      onPress={() => setSelectedNewLevel(item.level)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.levelText,
                          isSelected && styles.textWhite,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.levelSubText,
                          isSelected && styles.textWhiteSub,
                        ]}
                      >
                        {item.subLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* 저장하기 버튼 */}
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>
              {activeTab === 'CHANGE' ? '레벨 변경 저장' : '새 언어로 시작하기'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 0, backgroundColor: colors.background },
  content: { flex: 1, padding: 20, justifyContent: 'space-between' },

  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fonts.label,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
    fontFamily: fonts.headline,
  },

  // 카드 스타일
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greenTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircle: { backgroundColor: colors.headerIconBackground },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.titleGreen,
    fontFamily: fonts.headline,
  },
  langBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.label,
  },
  subLabel: {
    fontSize: 13,
    color: colors.greenMuted,
    fontFamily: fonts.label,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelCard: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCardDefault: { backgroundColor: colors.surfaceAlt },
  levelCardSelected: { backgroundColor: colors.primary },
  levelText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: fonts.headline,
  },
  levelSubText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: fonts.label,
  },
  textWhite: { color: colors.surface },
  textWhiteSub: { color: colors.greenChip },
  langChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    marginTop: 4,
  },
  langChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.greenChip,
    backgroundColor: colors.surface,
  },
  langChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.greenTint,
  },
  langChipText: {
    fontSize: 14,
    color: colors.greenMuted,
    fontFamily: fonts.label,
    fontWeight: '600',
  },
  langChipTextSelected: { color: colors.primary, fontWeight: '700' },
  saveButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: colors.greenMutedLight,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.headline,
  },
});

export default LearningSettingsScreen;