// screens/StoryHome/StoryHomeScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LearnStackParamList } from '../constants/navigation';
import type { Category, Episode } from '../constants/content';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

// ─── 데이터 ───
const CATEGORIES: Category[] = [
  { id: 'romance', label: '로맨스', emoji: '💕' },
  { id: 'story', label: '스토리', emoji: '🎬' },
];

// 🌟 1. 더미 컬러를 부드러운 큐링 테마 컬러로 변경하고 부제목을 추가해 생동감을 줬습니다.
const EPISODES: Episode[] = [
  { id: 1, title: 'EP.1 달콤한 첫 만남', quizCount: 6, rating: 4.9, bgColor: '#AAB87B' }, 
  { id: 2, title: 'EP.2 엇갈린 오해', quizCount: 8, rating: 4.9, bgColor: '#B7A07A' },
  { id: 3, title: 'EP.3 다시 만난 우연', quizCount: 5, rating: 4.7, bgColor: '#889873' },
];

// ─── 메인 컴포넌트 ───
const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  const [activeCategory, setActiveCategory] = useState('romance');

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="스토리 홈" leftType="none" rightType="profile" />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>어떤 컨텐츠를 풀어볼까요?</Text>
        <Text style={styles.subtitle}>
          오늘 나의 도파민을 채워줄 컨텐츠를 골라보세요.
        </Text>

        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.chip,
                  isActive ? styles.chipActive : styles.chipInactive,
                ]}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: isActive ? '#fff' : '#666' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {EPISODES.map((ep) => (
          <TouchableOpacity
            key={ep.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ChatLearn', {
              episodeId: ep.id,
              episodeTitle: ep.title,
            })}
          >
            {/* 🌟 나중에 여기에 진짜 썸네일 이미지가 들어갈 자리입니다 */}
            <View style={[styles.cardImage, { backgroundColor: ep.bgColor }]} />

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{ep.title}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>퀴즈 {ep.quizCount}개</Text>
                </View>
                <Text style={styles.rating}>☆ {ep.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    // 🌟 3. 하단 바텀 네비게이션에 카드가 가려지지 않도록 여백을 150으로 대폭 늘렸습니다.
    paddingBottom: 150, 
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    lineHeight: 30,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#888',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20, // 타이틀과 칩 사이의 여백 추가
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipInactive: {
    backgroundColor: '#F3F4EB', // 회원가입 폼에서 썼던 예쁜 크림색으로 통일
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    // 🌟 2. 답답했던 테두리(border)를 과감히 삭제하고 부드러운 그림자만 남겼습니다.
    borderWidth: 0, 
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // 그림자를 더 연하고 고급스럽게
    shadowRadius: 15,
    elevation: 3,
  },
  cardImage: {
    height: 130, // 비율을 살짝 조정
  },
  cardInfo: {
    // 🌟 3. 카드 안쪽 여백을 14 -> 20으로 늘려서 숨통을 틔워줬습니다.
    padding: 20, 
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12, // 타이틀과 뱃지 사이 여백 확대
  },
  badge: {
    backgroundColor: '#edf7e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  rating: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
  },
});

export default StoryHomeScreen;