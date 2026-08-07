import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { BOT_CONFIG } from '../constants/botConfig';
import { startBotMatch, type BotLevel } from '../api/competition';
import { getDashboard } from '../api/dashboard';
import { getErrorMessage } from '../utils/errorMessage';

// ─── 레벨 카드 정보 ───
const LEVELS: {
  level: BotLevel;
  title: string;
  desc: string;
  icon: string;
}[] = [
  { level: '하', title: '하급 봇', desc: '여유로운 속도로 풀어요', icon: '🌱' },
  { level: '중', title: '중급 봇', desc: '제법 빠르고 정확해요', icon: '🌿' },
  { level: '상', title: '상급 봇', desc: '빈틈없는 스피드! 최고 보상', icon: '🔥' },
];

const BotLevelSelectScreen = () => {
  const navigation = useNavigation<any>();

  const [selected, setSelected] = useState<BotLevel | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

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
    try {
      console.log('📤 [봇컴피티션] 매치 시작: POST /bot/level,', selected, cost);
      const res = await startBotMatch(selected, cost);
      console.log('✅ [봇컴피티션] 매치 시작 성공, matchId:', res.matchId);
      navigation.replace('BotCompetition', {
        matchId: res.matchId,
        questions: res.questions,
        remainingPoints: res.remainingPoints,
        botLevel: selected,
      });
    } catch (err: any) {
      console.error('❌ [봇컴피티션] 매치 시작 실패:', err.message, err.response?.data);
      Alert.alert('매치 시작 실패', getErrorMessage(err));
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
          <Text style={styles.pointLabel}>💰 보유 포인트</Text>
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
                <Text style={styles.levelIcon}>{icon}</Text>
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
          <Text style={styles.notEnoughText}>포인트가 부족해요 😢</Text>
        )}
      </ScrollView>

      {/* 시작 버튼 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          {starting ? (
            <ActivityIndicator size="small" color="#fff" />
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
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
  pointLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
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
    backgroundColor: '#F9FAF5',
  },
  levelIcon: {
    fontSize: 28,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  levelDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  costBadge: {
    backgroundColor: '#F0F1E8',
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
    color: '#8a8a7a',
  },
  costTextSelected: {
    color: '#fff',
  },
  checkMark: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  notEnoughText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#dc3545',
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
    color: '#FBF6EA',
  },
});

export default BotLevelSelectScreen;
