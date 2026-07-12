import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { useNavigation } from '@react-navigation/native';
import { getDashboard, type DashboardResponse } from '../api/dashboard';
import { getErrorMessage } from '../utils/errorMessage';

// ─── 색상 ───
const C = {
  darkGreen: '#3C6933',
  cardBorder: 'transparent',
  badgeBg: '#edf7e6',
  streakInactive: '#d5d5c8',
};

// ─── 요일 데이터 ───
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── 반원 게이지 컴포넌트 ───
const AchievementGauge = ({ percent }: { percent: number }) => {
  const safePercent = isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));

  const size = 156; // 🌟 꽉 찬 느낌을 위해 소폭 확장 (150 -> 156)
  const strokeWidth = 13; // 🌟 두께 확장 (12 -> 13)
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  const angle = (safePercent / 100) * Math.PI;
  const endX = cx - radius * Math.cos(angle);
  const endY = cy - radius * Math.sin(angle);
  const largeArc = safePercent > 50 ? 1 : 0;
  const progressPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;

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

// ─── 메인 컴포넌트 ───
const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboard();
        setData(res);
      } catch(err: any){
        console.log('대시보드 로딩 실패 : ', err);
        setError(getErrorMessage(err));
      }
    };
    fetchData();
  }, []);

  if(error){
    return(
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#dc3545'}}>{error}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if(!data){
    return(
      <ScreenWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, color: '#888' }}>로딩 중...</Text>
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
      <Header 
        showLogo={true} 
        leftType="none" 
        rightType="profile" 
        userName={data.name}
      />

      <ScrollView style={styles.bodyContainer} showsVerticalScrollIndicator={false}>

        {/* 연속 학습 달성 카드 */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakTitle}>연속 학습 달성</Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>🌿 {data.consecutiveDays} DAYS</Text>
            </View>
          </View>
          <View style={styles.weekRow}>
            {weekdays.map((day, i) => (
              <View key={i} style={styles.weekDay}>
                <View style={[styles.weekDot, day.done && styles.weekDotDone]}>
                  {day.done && (
                    <Text style={styles.weekLeaf}>🌿</Text>
                  )}
                </View>
                <Text style={styles.weekLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 학습 성취도 */}
        <View style={styles.achievementSection}>
          <AchievementGauge percent={data.progressRate} />
          <Text style={styles.achievementTitle}>학습 성취도</Text>
          <Text style={styles.achievementDesc}>
            {data.commentText || '아직 학습을 시작하지 않았어요. 첫 스토리를 열어보세요!'}
          </Text>
        </View>

        {/* CTA 버튼 */}
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={() => navigation.navigate('Content')}>
          <Text style={styles.ctaTitle}>🚀 오늘의 썰 풀기 시작!</Text>
          <Text style={styles.ctaSub}>▶ 약 5분 소요</Text>
        </TouchableOpacity>

        {/* 마스코트 말풍선 */}
        <View style={styles.mascotSection}>
          <Image
            source={require('../../assets/Qring-img3.png')}
            style={styles.mascotImageLeft}
            resizeMode="contain"
          />
          <View style={styles.mascotRight}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>오늘도 와주셨군요!{'\n'}열심히 해봐요!</Text>
              <View style={styles.speechTail} />
            </View>
            <Image
              source={require('../../assets/Qring-img.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 하단 스탯 카드 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statLabel}>완료한 스토리</Text>
            <Text style={styles.statValue}>{data.completedStoryCount ?? 0} 편</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🌿</Text>
            <Text style={styles.statLabel}>내 레벨</Text>
            <Text style={styles.statValue}>Lv.{data.levelCode} {data.levelDesc}</Text>
          </View>
        </View>

        <View style={styles.statsRowLast}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>❌</Text>
            <Text style={styles.statLabel}>오답 문제 수</Text>
            <Text style={styles.statValue}>3 문제</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statLabel}>보유 포인트</Text>
            <Text style={styles.statValue}>1,250 P</Text>
          </View>
        </View>
        
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16, // 🌟 상단 여백 회복 (12 -> 16)
  },

  // 연속 학습
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 15, // 🌟 내부 볼륨 키움 (12 -> 15)
    marginBottom: 20, // 🌟 간격 균형 조정 (14 -> 20)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  streakTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  daysBadge: { backgroundColor: '#edf7e6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  daysBadgeText: { fontSize: 11, fontWeight: '700', color: C.darkGreen },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', gap: 3 },
  weekDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0e8', justifyContent: 'center', alignItems: 'center' }, // 🌟 다시 크기 키움 (28 -> 32)
  weekDotDone: { backgroundColor: '#edf7e6' },
  weekLeaf: { fontSize: 13 },
  weekLabel: { fontSize: 11, fontWeight: '600', color: '#999' },

  // 성취도
  achievementSection: {
    alignItems: 'center',
    backgroundColor: '#EFEFE1',
    borderRadius: 20,
    padding: 15, // 🌟 내부 공간 확장 (12 -> 15)
    paddingTop: 16, 
    marginBottom: 20, // 🌟 간격 확장 (14 -> 20)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  gaugeWrap: { alignItems: 'center', width: '100%', marginBottom: -10 },
  arcPercent: { fontSize: 26, fontWeight: '800', color: C.darkGreen, marginTop: -38 }, 
  achievementTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginTop: 8 },
  achievementDesc: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 17, marginTop: 4 },

  // CTA
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 15, // 🌟 버튼 두께 다시 튼실하게 변경 (12 -> 15)
    alignItems: 'center',
    marginBottom: 20, // 🌟 간격 확장 (14 -> 20)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 3 },

  // 마스코트 말풍선
  mascotSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20, // 🌟 간격 확장 (14 -> 20)
  },
  speechBubble: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 6,
    marginBottom: 20, // 🌟 마스코트 성장에 맞춰 높이 복귀 (15 -> 20)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  speechText: { fontSize: 12, fontWeight: '600', color: '#333', lineHeight: 18 },
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
  mascotImageLeft: { width: 82, height: 82 }, // 🌟 딱 좋은 황금 밸런스 크기로 확대 (70 -> 82)
  mascotRight: { flexDirection: 'row', alignItems: 'flex-end' },
  mascotImage: { width: 82, height: 82 }, // 🌟 딱 좋은 황금 밸런스 크기로 확대 (70 -> 82)

  // 하단 스탯
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statsRowLast: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 105,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F4E6',
    borderRadius: 22, 
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '500' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginTop: 2 },
});

export default DashboardScreen;