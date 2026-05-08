// screens/ChatLearn/LearningResultScreen.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LearnStackParamList } from '../constants/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

// ─── 메인 컴포넌트 ───
const LearningResultScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#1a1a1a" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>에피소드 클리어</Text>

        {/* 오른쪽 빈 공간 (좌우 균형) */}
        <View style={styles.headerBtn} />
      </View>

      {/* Body */}
      <View style={styles.body}>

        {/* 학습 완료 타이틀 */}
        <Text style={styles.completeTitle}>학습 완료!</Text>
        <Text style={styles.completeSubtitle}>
          오늘의 도파민 충전 완료!{'\n'}다음 에피소드를 열어볼까요?
        </Text>

        {/* EXP + 정답 카드 */}
        <View style={styles.cardRow}>
          {/* EXP 카드 */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="star-outline" size={20} color="#3C6933" />
            </View>
            <Text style={styles.statValue}>+50</Text>
            <Text style={styles.statUnit}>EXP</Text>
            <Text style={styles.statLabel}>획득한 점수</Text>
          </View>

          {/* 정답 횟수 카드 */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#edf7e6' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#3C6933" />
            </View>
            <Text style={styles.statValue}>6/6</Text>
            <Text style={styles.statLabel}>정답 횟수</Text>
          </View>
        </View>

        {/* 연속 정답 달성 바 */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.streakIconWrap}>
              <Ionicons name="checkbox-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.streakText}>연속 정답 달성!</Text>
          </View>
          <Text style={styles.streakPercent}>100%</Text>
        </View>

        {/* 스페이서 */}
        <View style={{ flex: 1 }} />

        {/* 홈으로 돌아가기 버튼 */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('StoryHome')}
        >
          <Text style={styles.homeButtonText}>홈으로 돌아가기  →</Text>
        </TouchableOpacity>

        {/* 틀린 문제 다시 보기 */}
        <TouchableOpacity style={styles.reviewButton} onPress={() => {}}>
          <View style={styles.reviewInner}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.reviewText}>틀린 문제 다시 보기</Text>
          </View>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(250, 250, 236, 0.8)',
  },

  // Header
  header: {
    backgroundColor: 'rgba(250, 250, 236, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 32,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },

  // 완료 타이틀
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  completeSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },

  // 스탯 카드 2개 가로 배치
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d5d5c8',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#edf7e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: -2,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },

  // 연속 정답 바
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d5d5c8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 12,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  streakPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // 홈 버튼
  homeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // 틀린 문제 다시 보기
  reviewButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default LearningResultScreen;
