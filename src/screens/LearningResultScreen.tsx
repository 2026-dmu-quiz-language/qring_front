// screens/ChatLearn/LearningResultScreen.tsx

import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Text } from '../components/common/Text';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { playSfx } from '../utils/sfx';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

const LearningResultScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>(); 

  const { score = 0, correctCount = 0, totalQuestions = 6 } = route.params || {};

  useEffect(() => {
    playSfx('result');
  }, []);

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>

      <Header 
        title="에피소드 클리어" 
        leftType="close" 
        rightType="none" 
        onLeftPress={() => navigation.navigate('MainTab')} 
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.completeTitle}>학습 완료!</Text>
        <Text style={styles.completeSubtitle}>
          오늘의 도파민 충전 완료!{'\n'}다음 에피소드를 열어볼까요?
        </Text>

        <View style={styles.cardRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: theme.colors.greenTint }]}>
              <Ionicons name="star" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValueScore}>+{score}</Text>
            <Text style={styles.statUnitEXP}>EXP</Text>
            <Text style={styles.statLabel}>획득한 점수</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: theme.colors.greenTint }]}>
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValueCount}>{correctCount}/{totalQuestions}</Text>
            <Text style={[styles.statUnitEXP, { color: 'transparent' }]}>-</Text>
            <Text style={styles.statLabel}>정답 횟수</Text>
          </View>
        </View>

        <View style={styles.feedbackCard}>
          <Image
            source={
              score >= 70
                ? require('../../assets/Qring-emoji1.png')
                : score >= 40
                  ? require('../../assets/Qring-emoji2.png')
                  : require('../../assets/Qring-emoji3.png')
            }
            style={styles.feedbackImage}
            resizeMode="contain"
          />
          <View style={styles.feedbackBubble}>
            <View style={styles.feedbackTail} />
            <Text style={styles.feedbackText}>
              {score >= 70
                ? '대단해요!\n오늘 완벽하게 해냈어요!'
                : score >= 40
                  ? '좋아요!\n조금만 더 하면 완벽해요!'
                  : '괜찮아요!\n다시 도전하면 더 잘할 수 있어요!'}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 32 }} />

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('MainTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>학습 홈으로 돌아가기 ➔</Text>
        </TouchableOpacity>

        {/* 🌟 수정됨: MainTab이라는 탭 네비게이터를 거쳐서 그 안의 WrongNote 스크린으로 이동하게끔 경로 명시 */}
        <TouchableOpacity 
          style={styles.reviewButton} 
          onPress={() => navigation.navigate('MainTab', { screen: 'WrongNote' })}
        >
          <View style={styles.reviewInner}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.textSub} />
            <Text style={styles.reviewText}>틀린 문제 다시 보기</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 50 },
  completeTitle: { fontSize: 32, fontWeight: '900', color: theme.colors.textStrong, textAlign: 'center' },
  completeSubtitle: { marginTop: 15, fontSize: 16, color: theme.colors.textSub, textAlign: 'center', lineHeight: 24 },
  cardRow: { flexDirection: 'row', gap: 16, marginTop: 45 },
  statCard: { flex: 1, backgroundColor: theme.colors.white, borderRadius: 24, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statValueScore: { fontSize: 32, fontWeight: '900', color: theme.colors.secondary },
  statValueCount: { fontSize: 32, fontWeight: '900', color: theme.colors.secondary },
  statUnitEXP: { fontSize: 18, fontWeight: '800', color: theme.colors.secondary, marginTop: -2 },
  statLabel: { marginTop: 12, fontSize: 13, color: theme.colors.textSub, fontWeight: '600' },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 8 },
  feedbackImage: { width: 110, height: 110 },
  feedbackBubble: {
    flexShrink: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackTail: {
    position: 'absolute',
    left: -6,
    top: '40%' as any,
    width: 0,
    height: 0,
    borderRightWidth: 8,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightColor: theme.colors.white,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  feedbackText: { fontSize: 15, fontWeight: '700', color: theme.colors.text, lineHeight: 22 },
  homeButton: { backgroundColor: theme.colors.primary, borderRadius: 20, paddingVertical: 20, alignItems: 'center', marginBottom: 5 },
  homeButtonText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.surface },
  reviewButton: { alignItems: 'center', paddingVertical: 15 },
  reviewInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textSub },
});

export default LearningResultScreen;