// screens/Dashboard/DashboardScreen.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { Ionicons } from '@expo/vector-icons';

// ─── 색상 ───
const C = {
  darkGreen: '#3C6933',
  cardBorder: 'transparent',
  badgeBg: '#edf7e6',
  streakInactive: '#d5d5c8',
};

// ─── 요일 데이터 ───
const WEEKDAYS = [
  { label: 'M', done: true },
  { label: 'T', done: true },
  { label: 'W', done: true },
  { label: 'T', done: true },
  { label: 'F', done: true },
  { label: 'S', done: false },
  { label: 'S', done: false },
];

// ─── 반원 게이지 컴포넌트 ───
const AchievementGauge = ({ percent }: { percent: number }) => {
  const size = 120;
  const strokeWidth = 12; 
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; 
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  return (
    <View style={styles.gaugeWrap}>
      <Svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={C.streakInactive} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
          rotation="180" origin={`${size / 2}, ${size / 2}`}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={theme.colors.primary} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset} rotation="180" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={styles.arcPercent}>{percent}%</Text>
    </View>
  );
};

// ─── 메인 컴포넌트 ───
const DashboardScreen = () => {
  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      
      <Header 
        showLogo={true} 
        leftType="none" 
        rightType="profile" 
      />

      <View style={styles.bodyContainer}>

        {/* 연속 학습 달성 카드 */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakTitle}>연속 학습 달성</Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>🌿 5 DAYS</Text>
            </View>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, i) => (
              <View key={i} style={styles.weekDay}>
                <View style={[styles.weekDot, day.done && styles.weekDotDone]}>
                  {day.done && (
                    <Text style={styles.weekLeaf}>🌿</Text>
                  )}
                </View>
                <Text style={styles.weekLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 학습 성취도 */}
        <View style={styles.achievementSection}>
          <AchievementGauge percent={75} />
          <Text style={styles.achievementTitle}>학습 성취도</Text>
          <Text style={styles.achievementDesc}>
            이번 주 엄청난 성장을 보여주고 있어요!{'\n'}이대로 쭉 가보자고요 🌱
          </Text>
        </View>

        {/* CTA 버튼 */}
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
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
            <Text style={styles.statValue}>12 편</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🌿</Text>
            <Text style={styles.statLabel}>내 레벨</Text>
            <Text style={styles.statValue}>Lv.2 일상 회화</Text>
          </View>
        </View>
        
      </View>
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
});

export default DashboardScreen;