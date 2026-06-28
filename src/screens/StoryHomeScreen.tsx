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

interface ContentItem {
  content_id: number;
  category_name: string;
  thumbnail_url: string;
  title: string;
  quiz_count: number;
  is_completed: boolean;
  status?: string;
  required_points?: number; 
}

const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<{id: string, label: string, emoji: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌟 추가: 유저의 현재 언어 설정을 저장할 상태 (기본값 'en')
  const [userLanguage, setUserLanguage] = useState<string>('en');

  useEffect(() => {
    const fetchContentList = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          Alert.alert('로그인 만료', '다시 로그인해 주세요.');
          return;
        }

        // 🌟 추가: 유저가 설정한 언어 정보를 AsyncStorage에서 가져옵니다.
        // 만약 아직 설정된 언어가 없다면 기본값으로 'en'을 사용합니다.
        const storedLanguage = await AsyncStorage.getItem('userLanguage');
        if (storedLanguage) {
          setUserLanguage(storedLanguage);
        }

        const response = await axios.post('http://localhost:8080/contentList', {
          token: token 
        }, {
          headers: { Authorization: `Bearer ${token}` } 
        });

        const data: ContentItem[] = response.data; 
        setContents(data);

        const uniqueCategories = Array.from(new Set(data.map(item => item.category_name)));
        
        const mappedCategories = uniqueCategories.map(name => ({
          id: name,
          label: name,
          emoji: name.includes('로맨스') ? '💕' : (name.includes('스토리') ? '🎬' : '📚'),
        }));

        setCategories(mappedCategories);
        
        if (mappedCategories.length > 0) {
          setActiveCategory(mappedCategories[0].id);
        }

      } catch (error) {
        console.error('Content List API Error:', error);
        setContents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentList();
  }, []);

  const filteredContents = contents.filter(item => item.category_name === activeCategory);

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
                key={ep.content_id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ChatLearn', {
                  episodeId: ep.content_id,
                  episodeTitle: ep.title,
                  language: userLanguage, // 🌟 수정: 언어 정보를 파라미터로 함께 넘겨줍니다.
                })}
              >
                {ep.thumbnail_url ? (
                  <Image source={{ uri: ep.thumbnail_url }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#EFEFE1' }]} />
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{ep.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.badgeWrap}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>퀴즈 {ep.quiz_count || 0}개</Text>
                      </View>
                      
                      {ep.is_completed && (
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