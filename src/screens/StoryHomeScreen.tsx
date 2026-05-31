// screens/StoryHome/StoryHomeScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator, // 로딩 스피너
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
  content_id: number;
  category_name: string;
  thumbnail_url: string;
  title: string;
  quiz_count: number;    // 백엔드 응답명에 맞춰 변경될 수 있음
  is_completed: boolean; // 백엔드 응답명에 맞춰 변경될 수 있음
  status?: string;       // 추후 잠금 기능
  required_points?: number; 
}

// ─── 메인 컴포넌트 ───
const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  
  // 🌟 API 통신을 위한 상태 관리
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<{id: string, label: string, emoji: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 화면 로드 시 API 호출
  useEffect(() => {
    const fetchContentList = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          Alert.alert('로그인 만료', '다시 로그인해 주세요.');
          return;
        }

        // 백엔드 엔드포인트 주소에 맞게 수정 필요 (예: http://localhost:8080/api/v1/contentList)
        const response = await axios.post('http://localhost:8080/contentList', {
          token: token // 명세서 요구사항에 따라 body에 token 포함
        }, {
          headers: { Authorization: `Bearer ${token}` } // 안전을 위해 헤더에도 추가
        });

        const data: ContentItem[] = response.data; // 서버에서 배열 형태로 온다고 가정
        setContents(data);

        // 받아온 데이터에서 중복 없는 카테고리 목록 추출
        const uniqueCategories = Array.from(new Set(data.map(item => item.category_name)));
        
        // 카테고리 객체로 매핑 (임시 이모지 매칭)
        const mappedCategories = uniqueCategories.map(name => ({
          id: name,
          label: name,
          emoji: name.includes('로맨스') ? '💕' : (name.includes('스토리') ? '🎬' : '📚'),
        }));

        setCategories(mappedCategories);
        
        // 기본 선택 카테고리를 첫 번째 항목으로 지정
        if (mappedCategories.length > 0) {
          setActiveCategory(mappedCategories[0].id);
        }

      } catch (error) {
        console.error('Content List API Error:', error);
        // 에러 시 빈 화면이 나오지 않도록 테스트용 더미 세팅 (실제 배포 시엔 지우세요)
        setContents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentList();
  }, []);

  // 🌟 현재 선택된 카테고리에 맞는 콘텐츠만 필터링
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
          // 🌟 로딩 중일 때 표시할 스피너
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            {/* 카테고리 칩 영역 */}
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

            {/* 필터링된 콘텐츠 목록 */}
            {filteredContents.map((ep) => (
              <TouchableOpacity
                key={ep.content_id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ChatLearn', {
                  episodeId: ep.content_id,
                  episodeTitle: ep.title,
                })}
              >
                {/* 🌟 명세서의 thumbnail_url을 사용해 이미지 로드 */}
                {ep.thumbnail_url ? (
                  <Image source={{ uri: ep.thumbnail_url }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, { backgroundColor: '#EFEFE1' }]} /> // 이미지 없을 때의 대체 배경
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{ep.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.badgeWrap}>
                      {/* 퀴즈 개수 */}
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>퀴즈 {ep.quiz_count || 0}개</Text>
                      </View>
                      
                      {/* 🌟 명세서의 유저 학습 여부에 따른 완료 뱃지 */}
                      {ep.is_completed && (
                        <View style={styles.badgeCompleted}>
                          <Text style={styles.badgeTextCompleted}>✅ 학습 완료</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* 추후 잠금(status)이 구현되면 자물쇠 아이콘 등을 넣을 수 있습니다 */}
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

// ─── 스타일 ───
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
    height: 140, // 썸네일 이미지가 잘 보이게 약간 키웠습니다
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