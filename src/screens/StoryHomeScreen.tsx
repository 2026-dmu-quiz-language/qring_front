// screens/StoryHome/StoryHomeScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LearnStackParamList } from '../constants/navigation';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── API 응답 데이터 타입 정의 ───
interface ContentItem {
  contentId: number;
  categoryName: string;
  thumbnailUrl: string;
  title: string;
  quizCount: number;
  isCompleted: boolean;
  status?: string;
  requiredPoints?: number; 
}

// ─── 메인 컴포넌트 ───
const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<{id: string, label: string, emoji: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL'); // 🌟 기본값을 '전체'로 설정
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 카테고리 이름에 맞는 이모지를 반환하는 헬퍼 함수
  const getCategoryEmoji = (name: string) => {
    if (!name) return '📚';
    if (name.includes('짝사랑')) return '💘';
    if (name.includes('드라마')) return '📺';
    if (name.includes('스릴러')) return '😱';
    if (name.includes('추리')) return '🕵️‍♂️';
    if (name.includes('특이한연애')) return '💬';
    if (name.includes('연애갈등')) return '💔';
    if (name.includes('로맨스')) return '💕';
    return '📚'; // 위 조건에 안 맞을 때의 기본 이모지
  };

  useEffect(() => {
    const fetchContentList = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          Alert.alert('로그인 만료', '다시 로그인해 주세요.');
          return;
        }

        const response = await axios.post('https://q-ring.app/contentList', {
          token: token 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data: ContentItem[] = response.data;
        setContents(data);

        // 중복 제거된 카테고리 목록 추출
        const uniqueCategories = Array.from(new Set(data.map(item => item.categoryName).filter(Boolean)));
        
        // 동적 카테고리 매핑
        const mappedCategories = uniqueCategories.map(name => ({
          id: name,
          label: name,
          emoji: getCategoryEmoji(name),
        }));

        // 🌟 '전체' 카테고리를 배열 맨 앞에 추가
        const finalCategories = [
          { id: 'ALL', label: '전체', emoji: '✨' },
          ...mappedCategories
        ];

        setCategories(finalCategories);
        
      } catch (error) {
        console.error('Content List API Error:', error);
        setContents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentList();
  }, []);

  // 🌟 선택된 카테고리가 'ALL'이면 전체 데이터를, 아니면 해당 카테고리만 필터링
  const filteredContents = activeCategory === 'ALL' 
    ? contents 
    : contents.filter(item => item.categoryName === activeCategory);

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

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.chipRow}>
              {categories.map((cat) => {
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

            {filteredContents.map((ep) => (
              <TouchableOpacity
                key={ep.contentId} 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ChatLearn', {
                  episodeId: ep.contentId, 
                  episodeTitle: ep.title,
                })}
              >
                {ep.thumbnailUrl ? (
                  <Image source={{ uri: ep.thumbnailUrl }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#EFEFE1' }]} />
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{ep.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.badgeWrap}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>퀴즈 {ep.quizCount || 0}개</Text>
                      </View>
                      
                      {ep.isCompleted && (
                        <View style={styles.badgeCompleted}>
                          <Text style={styles.badgeTextCompleted}>✅ 학습 완료</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredContents.length === 0 && (
              <Text style={styles.emptyText}>해당 카테고리의 스토리가 없습니다.</Text>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 150 },
  title: { fontSize: 22, fontWeight: '800', color: '#333', lineHeight: 30 },
  subtitle: { marginTop: 6, fontSize: 14, color: '#888' },
  
  loadingWrap: { marginTop: 50, alignItems: 'center' },
  emptyText: { marginTop: 40, textAlign: 'center', color: '#999', fontSize: 15 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25 },
  chipActive: { backgroundColor: theme.colors.primary },
  chipInactive: { backgroundColor: '#F3F4EB' },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 14, fontWeight: '600' },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 0, 
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 15,
    elevation: 3,
  },
  cardImage: {
    height: 140,
    width: '100%',
  },
  cardInfo: { padding: 20 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  
  badgeWrap: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#edf7e6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.primary },
  
  badgeCompleted: { backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextCompleted: { fontSize: 12, fontWeight: 'bold', color: '#666' },
});

export default StoryHomeScreen;