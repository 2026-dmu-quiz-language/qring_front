// screens/Dashboard/DashboardScreen.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

// ─── 색상 ───
const C = {
  darkGreen: '#3C6933',
  cardBorder: '#d5d5c8',
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

// ─── 성취도 게이지 컴포넌트 ───
const AchievementGauge = ({ percent }: { percent: number }) => {
  return (
    <View style={styles.gaugeWrap}>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.arcPercent}>{percent}%</Text>
    </View>
  );
};

// ─── 메인 컴포넌트 ───
const DashboardScreen = () => {
  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* ── Header ── */}
      <Header title="학습" leftType="none" rightType="profile" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 인사 헤더 */}
        <View style={styles.greeting}>
          <View style={styles.greetingLeft}>
            <View style={styles.avatarCircle} />
            <View>
              <Text style={styles.greetingText}>안녕하세요, User1님!</Text>
              {/* 로고 이미지 넣을 자리 — <Image source={require('...')} style={styles.logoPlaceholder} /> */}
              <View style={styles.logoPlaceholder} />
            </View>
          </View>
        </View>

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
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // 인사
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccc',
  },
  greetingText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  logoPlaceholder: {
    // 여기에 <Image source={require('...')} /> 넣으면 됨
    height: 24,
    width: 60,
  },

  // 연속 학습
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d5d5c8',
    padding: 20,
    marginBottom: 24,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  daysBadge: {
    backgroundColor: '#edf7e6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.darkGreen,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDotDone: {
    backgroundColor: '#edf7e6',
  },
  weekLeaf: {
    fontSize: 16,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },

  // 성취도
  achievementSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gaugeWrap: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  gaugeTrack: {
    width: '80%',
    height: 12,
    borderRadius: 6,
    backgroundColor: C.streakInactive,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  arcPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: C.darkGreen,
    marginTop: 8,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 12,
  },
  achievementDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },

  // CTA
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  ctaSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // 하단 스탯
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d5d5c8',
    padding: 16,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 4,
  },
});

export default DashboardScreen;