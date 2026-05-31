import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { Ionicons } from '@expo/vector-icons';
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
  // 🌟 1. NaN 방어: 서버에서 값이 안 오거나 에러가 나서 숫자가 아니면 무조건 0으로 처리
  const safePercent = isNaN(percent) ? 0 : percent;

  const size = 120;
  const strokeWidth = 12; 
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; 
  
  // 🌟 2. 안전한 값(safePercent)으로 계산하도록 수정
  const strokeDashoffset = circumference - (circumference * safePercent) / 100;

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={C.streakInactive} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
          rotation="180" 
          // 🌟 3. transform-origin 에러 해결: origin="x,y" 대신 originX, originY 사용
          originX={size / 2} originY={size / 2}
        />
        {safePercent > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={theme.colors.primary} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            rotation="180"
            originX={size / 2} originY={size / 2}
          />
        )}
      </Svg>
      {/* 🌟 화면에 찍히는 텍스트도 안전한 값으로 출력 */}
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

  console.log('👀 서버가 준 데이터:', data);
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

      <ScrollView style={styles.bodyContainer}>

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
          <Text style={styles.ctaSub}>▶ 약 15분 소요</Text>
        </TouchableOpacity>

        {/* 오늘의 핵심 표현 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="bulb" size={16} color="#B7A07A" />
            <Text style={styles.summaryTitle}>오늘의 핵심 표현</Text>
          </View>
          <Text style={styles.summaryEn}>Caught red-handed</Text>
          <Text style={styles.summaryKo}>현장범으로 딱 걸리다</Text>
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
            <Text style={styles.statValue}>Lv.{data.levelCode}</Text>
            <Text style={styles.statDesc}>{data.levelDesc}</Text>
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
    paddingTop: 24, // 🌟 상단 여백 아주 미세하게 더 추가 (20 -> 24)
    paddingBottom: 100, 
  },

  // 연속 학습
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 16, 
    marginBottom: 28, // 🌟 카드 사이 여백 미세 확장! (24 -> 28)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  streakTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  daysBadge: { backgroundColor: '#edf7e6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  daysBadgeText: { fontSize: 11, fontWeight: '700', color: C.darkGreen },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { alignItems: 'center', gap: 4 },
  weekDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0e8', justifyContent: 'center', alignItems: 'center' },
  weekDotDone: { backgroundColor: '#edf7e6' },
  weekLeaf: { fontSize: 14 },
  weekLabel: { fontSize: 11, fontWeight: '600', color: '#999' },

  // 성취도
  achievementSection: {
    alignItems: 'center',
    backgroundColor: '#EFEFE1',
    borderRadius: 20,
    padding: 16,
    paddingTop: 20,
    marginBottom: 28, // 🌟 미세 확장 (24 -> 28)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  gaugeWrap: { alignItems: 'center', width: '100%', marginBottom: -15 },
  arcPercent: { fontSize: 28, fontWeight: '800', color: C.darkGreen, marginTop: -40 },
  achievementTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginTop: 10 },
  achievementDesc: { fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18, marginTop: 6 },

  // CTA
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 18, 
    alignItems: 'center',
    marginBottom: 28, // 🌟 미세 확장 (24 -> 28)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // 오늘의 핵심 표현 카드
  summaryCard: {
    backgroundColor: '#F3F4EB', 
    borderRadius: 20,
    padding: 16, 
    alignItems: 'center',
    marginBottom: 28, // 🌟 미세 확장 (24 -> 28)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  summaryTitle: { fontSize: 13, fontWeight: 'bold', color: '#B7A07A' },
  summaryEn: { fontSize: 18, fontWeight: '900', color: theme.colors.primary, marginBottom: 4 },
  summaryKo: { fontSize: 14, fontWeight: '500', color: '#555' },

  // 하단 스탯
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F4E6',
    borderRadius: 30, 
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1a1a1a', marginTop: 4 },
  statDesc: { fontSize: 12, fontWeight: '500', color: '#888', marginTop: 2 },
});

export default DashboardScreen;