import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Text } from '../components/common/Text';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDashboard, type DashboardResponse } from '../api/dashboard';
import { getErrorMessage } from '../utils/errorMessage';
import { playSfx } from '../utils/sfx';

const C = {
  darkGreen: theme.colors.primary,
  cardBorder: 'transparent',
  badgeBg: theme.colors.greenTint,
  streakInactive: theme.colors.greenChip,
};

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// 레벨별 아이콘. 번들러가 파일을 앱에 넣으려면 경로를 코드에 그대로 적어야 한다.
const ICONS = {
  bot: require('../../assets/bot.png'),
  point: require('../../assets/point.png'),
};

const LEVEL_ICONS: Record<number, any> = {
  1: require('../../assets/level1.png'),
  2: require('../../assets/level2.png'),
  3: require('../../assets/level3.png'),
};

const AchievementGauge = ({ percent }: { percent: number }) => {
  const safePercent = isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));

  const size = 156; 
  const strokeWidth = 13; 
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  const angle = (safePercent / 100) * Math.PI;
  const endX = cx - radius * Math.cos(angle);
  const endY = cy - radius * Math.sin(angle);
  // 이 게이지는 반원이라 호가 180도를 넘을 일이 없다.
  // large-arc-flag 를 1로 주면 SVG 가 반대쪽(아래로 도는) 호를 골라서
  // 50%가 넘는 순간부터 게이지가 깨지므로 항상 0으로 둔다.
  const progressPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={size} height={size / 2 + strokeWidth / 2}>
        <Path d={bgPath} stroke={C.streakInactive} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        {safePercent > 0 && (
          <Path d={progressPath} stroke={theme.colors.primary} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        )}
      </Svg>
      <Text style={styles.arcPercent}>{safePercent}%</Text>
    </View>
  );
};

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 포인트, 오답 수, 연속 학습일은 다른 화면에서 바뀐다.
  // 탭 화면이라 언마운트되지 않으므로 돌아올 때마다 다시 불러온다.
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const res = await getDashboard();
          setData(res);
          // 이전에 실패했더라도 이번에 성공하면 에러 화면을 푼다.
          setError(null);
        } catch(err: any){
          console.log('대시보드 로딩 실패 : ', err);
          setError(getErrorMessage(err));
        }
      };
      // 갱신 중에도 기존 값을 그대로 두어 탭을 누를 때 화면이 깜빡이지 않게 한다.
      fetchData();
    }, []),
  );

  if(error){
    return(
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.danger}}>{error}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if(!data){
    return(
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: theme.colors.textMuted }}>로딩 중...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const weekdays = WEEKDAY_LABELS.map((day, i) => ({
    day,
    done: data.weeklyStudy?.[i] ?? false,
  }));

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* 🌟 우측 아이콘을 'menu'로 설정하여 이 대시보드 화면에만 3줄 아이콘이 표시됩니다! */}
      <Header 
        showLogo={true} 
        leftType="none" 
        rightType="menu" 
        userName={data.name}
      />

      <ScrollView
        style={styles.bodyContainer}
        contentContainerStyle={{ paddingBottom: 20 }}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakTitle}>연속 학습 달성</Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>{data.consecutiveDays} DAYS</Text>
            </View>
          </View>
          <View style={styles.weekRow}>
            {weekdays.map((day, i) => (
              <View key={i} style={styles.weekDay}>
                <View style={[styles.weekDot, day.done && styles.weekDotDone]}>
                  {day.done && (
                    <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                  )}
                </View>
                <Text style={styles.weekLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.achievementSection}>
          <AchievementGauge percent={data.progressRate} />
          <Text style={styles.achievementTitle}>학습 성취도</Text>
          <Text style={styles.achievementDesc}>
            {data.commentText || '아직 학습을 시작하지 않았어요. 첫 스토리를 열어보세요!'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botCompButton}
          activeOpacity={0.85}
          onPress={() => {
            playSfx('touch');
            navigation.navigate('BotLevelSelect');
          }}
        >
          <Image source={ICONS.bot} style={styles.botCompIcon} resizeMode="contain" />
          <View>
            <Text style={styles.botCompTitle}>봇 컴피티션</Text>
            <Text style={styles.botCompSub}>Q-Bot과 스피드 대결!</Text>
          </View>
        </TouchableOpacity>

        {/* 포인트만 카드로 강조하고, 나머지 값은 배경 없이 한 줄로 둔다 */}
        <View style={styles.pointCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointLabel}>보유 포인트</Text>
            <Text style={styles.pointValue}>{(data.currentPoints ?? 0).toLocaleString()} P</Text>
          </View>
          <Image source={ICONS.point} style={styles.pointIcon} resizeMode="contain" />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>완료한 스토리</Text>
            <Text style={styles.summaryValue}>{data.completedStoryCount ?? 0} 편</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>내 레벨</Text>
            <View style={styles.levelRow}>
              {/* 레벨 값이 비었거나 목록에 없으면 1레벨 아이콘을 쓴다 */}
              <Image
                source={LEVEL_ICONS[data.levelCode] ?? LEVEL_ICONS[1]}
                style={styles.levelIcon}
                resizeMode="contain"
              />
              <Text style={styles.summaryValue} numberOfLines={1}>Lv.{data.levelCode}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, styles.summaryLabelWarning]}>오답 문제</Text>
            <Text style={[styles.summaryValue, styles.summaryValueWarning]}>
              {data.incorrectQuizCount ?? 0} 문제
            </Text>
          </View>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16, 
  },

  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 15, 
    marginBottom: 20, 
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  streakTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textStrong },
  daysBadge: { backgroundColor: theme.colors.greenTint, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  daysBadgeText: { fontSize: 11, fontWeight: '700', color: C.darkGreen },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', gap: 3 },
  weekDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }, 
  weekDotDone: { backgroundColor: theme.colors.greenTint },
  weekLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.textHint },

  achievementSection: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20,
    padding: 15, 
    paddingTop: 16, 
    marginBottom: 20, 
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  gaugeWrap: { alignItems: 'center', width: '100%', marginBottom: -10 },
  arcPercent: { fontSize: 26, fontWeight: '800', color: C.darkGreen, marginTop: -38 }, 
  achievementTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textStrong, marginTop: 8 },
  achievementDesc: { fontSize: 11, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: 4 },

  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 15, 
    alignItems: 'center',
    marginBottom: 20, 
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.surface },
  ctaSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  botCompButton: {
    backgroundColor: theme.colors.tertiary,
    borderRadius: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  botCompIcon: { width: 34, height: 34 },
  botCompTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.surface },
  botCompSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  mascotSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20, 
  },
  speechBubble: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 6,
    marginBottom: 20, 
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  speechText: { fontSize: 12, fontWeight: '600', color: theme.colors.text, lineHeight: 18 },
  speechTail: {
    position: 'absolute',
    right: -6,
    bottom: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: theme.colors.white,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  mascotImageLeft: { width: 82, height: 82 }, 
  mascotRight: { flexDirection: 'row', alignItems: 'flex-end' },
  mascotImage: { width: 82, height: 82 }, 

  // 포인트 강조 카드
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  pointLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.greenMuted },
  pointValue: { fontSize: 22, fontWeight: '900', color: theme.colors.textStrong, marginTop: 4 },
  pointIcon: { width: 44, height: 44 },

  // 카드 없이 여백으로만 나누는 보조 값 줄
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 28, backgroundColor: theme.colors.greenChip },
  summaryLabel: { fontSize: 11, fontWeight: '500', color: theme.colors.textHint, marginBottom: 6 },
  summaryValue: { fontSize: 15, fontWeight: '800', color: theme.colors.textStrong },
  summaryValueWarning: { color: theme.colors.dangerSoft },
  // 오답 라벨. 경고 빨강(#dc3545)은 화면에서 튀어서 한 단계 연한 색으로 낮춘다.
  summaryLabelWarning: { color: theme.colors.dangerSoft },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelIcon: { width: 20, height: 20 },
});

export default DashboardScreen;