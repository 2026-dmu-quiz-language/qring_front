// screens/ChatLearn/LearningResultScreen.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LearnStackParamList } from '../constants/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const LearningResultScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>(); // 🌟 Root로 이동하기 위해 any로 타입 유연화

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>에피소드 클리어</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* 학습 완료 타이틀 */}
        <Text style={styles.completeTitle}>학습 완료!</Text>
        <Text style={styles.completeSubtitle}>
          오늘의 도파민 충전 완료!{'\n'}다음 에피소드를 열어볼까요?
        </Text>

        {/* EXP + 정답 카드 */}
        <View style={styles.cardRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EBF0E6' }]}>
              <Ionicons name="star" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValueScore}>+50</Text>
            <Text style={styles.statUnitEXP}>EXP</Text>
            <Text style={styles.statLabel}>획득한 점수</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EBF0E6' }]}>
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValueCount}>6/6</Text>
            <Text style={[styles.statUnitEXP, { color: 'transparent' }]}>-</Text>
            <Text style={styles.statLabel}>정답 횟수</Text>
          </View>
        </View>

        {/* 연속 정답 달성 바 */}
        <View style={styles.streakCard}>
          <View style={styles.streakIconWrap}>
            <Ionicons name="flag" size={20} color="#B7A07A" />
          </View>
          <View style={styles.streakContent}>
            <View style={styles.streakTextRow}>
              <Text style={styles.streakText}>연속 정답 달성!</Text>
              <Text style={styles.streakPercent}>100%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '100%' }]} />
            </View>
          </View>
        </View>

        {/* 오늘의 핵심 표현 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="bulb" size={18} color="#B7A07A" />
            <Text style={styles.summaryTitle}>오늘의 핵심 표현</Text>
          </View>
          <Text style={styles.summaryEn}>Caught red-handed</Text>
          <Text style={styles.summaryKo}>현장범으로 딱 걸리다</Text>
        </View>

        <View style={{ marginTop: 32 }} />

        {/* 🌟 해결 포인트: RootNavigator에 등록된 'MainTab'으로 이동! */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('MainTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>학습 홈으로 돌아가기 ➔</Text>
        </TouchableOpacity>

        {/* 틀린 문제 다시 보기 */}
        <TouchableOpacity style={styles.reviewButton} onPress={() => {}}>
          <View style={styles.reviewInner}>
            <Ionicons name="document-text-outline" size={18} color="#555" />
            <Text style={styles.reviewText}>틀린 문제 다시 보기</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  headerBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E5E43', 
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 50, 
  },

  completeTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  completeSubtitle: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  cardRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 45,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  statValueScore: { fontSize: 32, fontWeight: '900', color: theme.colors.secondary },
  statValueCount: { fontSize: 32, fontWeight: '900', color: theme.colors.secondary },
  statUnitEXP: { fontSize: 18, fontWeight: '800', color: theme.colors.secondary, marginTop: -2 },
  statLabel: { marginTop: 12, fontSize: 13, color: '#555', fontWeight: '600' },

  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  streakIconWrap: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#F5E6DC', justifyContent: 'center', alignItems: 'center',
  },
  streakContent: { flex: 1, marginLeft: 16 },
  streakTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  streakText: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  streakPercent: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },
  progressBarBg: { height: 10, backgroundColor: '#EAEAEA', borderRadius: 5 },
  progressBarFill: { height: 10, backgroundColor: theme.colors.primary, borderRadius: 5 },

  summaryCard: {
    backgroundColor: '#F3F4EB', 
    borderRadius: 24,
    padding: 30,
    marginTop: 24,
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#B7A07A' },
  summaryEn: { fontSize: 24, fontWeight: '900', color: theme.colors.primary, marginBottom: 10 },
  summaryKo: { fontSize: 17, fontWeight: '500', color: '#555' },

  homeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 5, 
  },
  homeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  reviewButton: { alignItems: 'center', paddingVertical: 15 },
  reviewInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
});

export default LearningResultScreen;