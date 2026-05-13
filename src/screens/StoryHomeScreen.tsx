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

const EPISODES: Episode[] = [
  { id: 1, title: 'EP.1', quizCount: 6, rating: 4.9, bgColor: '#16213e' },
  { id: 2, title: 'EP.2', quizCount: 8, rating: 4.9, bgColor: '#2d3436' },
  { id: 3, title: 'EP.3', quizCount: 5, rating: 4.7, bgColor: '#2c3e50' },
];

// ─── 메인 컴포넌트 ───
const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  const [activeCategory, setActiveCategory] = useState('romance');

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* ── Header ── */}
      <Header title="스토리 홈" leftType="none" rightType="profile" />

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>어떤 컨텐츠를 풀어볼까요?</Text>
        <Text style={styles.subtitle}>
          오늘 나의 도파민을 채워줄 컨텐츠를 골라보세요.
        </Text>

        {/* Category chips */}
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
                    { color: isActive ? '#fff' : '#555' },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Episode cards */}
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
            {/* 카드 이미지 영역 */}
            <View style={[styles.cardImage, { backgroundColor: ep.bgColor }]} />

            {/* 카드 정보 */}
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
  // Body
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Title
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 30,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#888',
  },

  // Category chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipInactive: {
    backgroundColor: '#f5f2eb',
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Episode cards
  card: {
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: '#d5d5c8',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImage: {
    height: 180,
  },
  cardInfo: {
    padding: 14,
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#edf7e6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  rating: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
});

export default StoryHomeScreen;
