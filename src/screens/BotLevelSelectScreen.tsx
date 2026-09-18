import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/common/Text';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { BOT_CONFIG } from '../constants/botConfig';
import { startBotMatch, type BotLevel } from '../api/competition';
import { playSfx } from '../utils/sfx';
import { getDashboard } from '../api/dashboard';
import { getErrorMessage } from '../utils/errorMessage';
import { showAlert } from '../components/common/AlertHost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── 레벨 카드 정보 ───
const LEVELS: {
  level: BotLevel;
  title: string;
  desc: string;
  icon: any;
}[] = [
  // 아이콘은 하급부터 차례대로. 번들러가 파일을 앱에 넣으려면 경로를 코드에 그대로 적어야 한다.
  { level: '하', title: '하급 봇', desc: '여유로운 속도로 풀어요', icon: require('../../assets/time1.png') },
  { level: '중', title: '중급 봇', desc: '제법 빠르고 정확해요', icon: require('../../assets/time2.png') },
  { level: '상', title: '상급 봇', desc: '빈틈없는 스피드! 최고 보상', icon: require('../../assets/time3.png') },
];

const BotLevelSelectScreen = () => {
  const navigation = useNavigation<any>();
  // 하단 시작 버튼이 아이폰 홈 인디케이터와 갤럭시 하단 바에 가리지 않도록 그 높이만큼 올린다.
  // 인셋이 없는 기기에서는 기존 여백 28을 유지한다.
  const insets = useSafeAreaInsets();
  const bottomBarPadding = Math.max(28, insets.bottom + 12);

  const [selected, setSelected] = useState<BotLevel | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await getDashboard();
        setPoints(res.currentPoints ?? 0);
      } catch (err: any) {
        console.error('❌ [봇컴피티션] 포인트 조회 실패:', err.message);
        setPoints(0);
      }
    };
    fetchPoints();
  }, []);

  const cost = selected ? BOT_CONFIG.entryCost[selected] : 0;
  const notEnough = selected !== null && points !== null && points < cost;
  const canStart = selected !== null && !notEnough && !starting;

  const handleStart = async () => {
    if (!selected || !canStart) return;
    setStarting(true);
    setErrorMsg(null);
    try {
      console.log('📤 [봇컴피티션] 매치 시작: POST /bot/level,', selected, cost);
      const res = await startBotMatch(selected, cost);
      console.log('✅ [봇컴피티션] 매치 시작 성공, matchId:', res.matchId);
      playSfx('usePoints'); // 입장료가 차감된 시점
      navigation.replace('BotCompetition', {
        matchId: res.matchId,
        questions: res.questions,
        remainingPoints: res.remainingPoints,
        botLevel: selected,
      });
    } catch (err: any) {
      console.error(
        '❌ [봇컴피티션] 매치 시작 실패:',
        err.message,
        'status:', err.response?.status,
        'data:', JSON.stringify(err.response?.data),
      );
      const status = err.response?.status ? ` (${err.response.status})` : '';
      setErrorMsg(`${getErrorMessage(err)}${status}`);
      showAlert({ title: '매치 시작 실패', message: getErrorMessage(err) });
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="봇 컴피티션" leftType="back" rightType="none" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 인트로 */}
        <View style={styles.introRow}>
          <Image
            source={require('../../assets/Qring-img.png')}
            style={styles.introImage}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Q-Bot에게 도전하세요!</Text>
            <Text style={styles.introDesc}>
              21문제 스피드 대결 · 봇보다 빨리 정답을 맞추면 승리!
            </Text>
          </View>
        </View>

        {/* 보유 포인트 */}
        <View style={styles.pointRow}>
          <View style={styles.pointLabelRow}>
            <Image
              source={require('../../assets/point.png')}
              style={styles.pointIcon}
              resizeMode="contain"
            />
            <Text style={styles.pointLabel}>보유 포인트</Text>
          </View>
          {points === null ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.pointValue}>{points.toLocaleString()} P</Text>
          )}
        </View>

        {/* 레벨 카드 */}
        <View style={styles.levelList}>
          {LEVELS.map(({ level, title, desc, icon }) => {
            const isSelected = selected === level;
            return (
              <TouchableOpacity
                key={level}
                style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                onPress={() => setSelected(level)}
                activeOpacity={0.8}
              >
                <Image source={icon} style={styles.levelIcon} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelTitle}>{title}</Text>
                  <Text style={styles.levelDesc}>{desc}</Text>
                </View>
                <View style={[styles.costBadge, isSelected && styles.costBadgeSelected]}>
                  <Text style={[styles.costText, isSelected && styles.costTextSelected]}>
                    {BOT_CONFIG.entryCost[level]} P
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkMark}>
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {notEnough && (
          <View style={styles.notEnoughRow}>
            <Image
              source={require('../../assets/Qring-emoji3.png')}
              style={styles.notEnoughImage}
              resizeMode="contain"
            />
            <Text style={styles.notEnoughText}>포인트가 부족해요</Text>
          </View>
        )}
      </ScrollView>

      {/* 시작 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: bottomBarPadding }]}>
        {errorMsg && <Text style={styles.startErrorText}>{errorMsg}</Text>}
        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          {starting ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <Text style={styles.startButtonText}>
              {selected ? `대결 시작 (${cost} P)` : '봇 레벨을 선택하세요'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  introImage: {
    width: 64,
    height: 64,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textStrong,
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
    lineHeight: 18,
  },

  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
  },
  pointLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pointIcon: { width: 20, height: 20 },
  pointLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSub,
  },
  pointValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  levelList: {
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  levelCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceAlt,
  },
  levelIcon: {
    width: 34,
    height: 34,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textStrong,
    marginBottom: 3,
  },
  levelDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textHint,
  },
  costBadge: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  costBadgeSelected: {
    backgroundColor: theme.colors.primary,
  },
  costText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.greenMuted,
  },
  costTextSelected: {
    color: theme.colors.surface,
  },
  checkMark: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  startErrorText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger,
    marginBottom: 10,
  },
  notEnoughRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  notEnoughImage: { width: 28, height: 28 },
  notEnoughText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger,
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  startButton: {
    backgroundColor: theme.colors.tertiary,
    borderRadius: 30,
    paddingVertical: 17,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.55,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.surfaceAlt,
  },
});

export default BotLevelSelectScreen;
