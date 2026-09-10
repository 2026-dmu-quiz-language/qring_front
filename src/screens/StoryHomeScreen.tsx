import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform, // 🌟 웹/앱 호환을 위해 Platform 추가
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LearnStackParamList } from '../constants/navigation';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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

const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<{id: string, label: string, emoji: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const getCategoryEmoji = (name: string) => {
    if (!name) return '📚';
    if (name.includes('짝사랑')) return '💘';
    if (name.includes('드라마')) return '📺';
    if (name.includes('스릴러')) return '😱';
    if (name.includes('추리')) return '🕵️‍♂️';
    if (name.includes('특이한연애')) return '💬';
    if (name.includes('연애갈등')) return '💔';
    if (name.includes('로맨스')) return '💕';
    return '📚';
  };

  const fetchContentList = async () => {
    try {
      setIsLoading(true);
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

      const uniqueCategories = Array.from(new Set(data.map(item => item.categoryName).filter(Boolean)));
      
      const mappedCategories = uniqueCategories.map(name => ({
        id: name,
        label: name,
        emoji: getCategoryEmoji(name),
      }));

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

  useFocusEffect(
    useCallback(() => {
      fetchContentList();
    }, [])
  );

  // 🌟 잠금해제 버튼 클릭 처리 (웹/앱 호환 알림창 + status 파라미터 전달)
  const handleUnlockPress = (ep: ContentItem) => {
    const confirmMessage = `${ep.title}을(를) 열람하시겠습니까?\n${ep.requiredPoints || 0}포인트 차감`;

    if (Platform.OS === 'web') {
      // 웹 환경
      const isConfirmed = window.confirm(confirmMessage);
      if (isConfirmed) {
        // 실제 API 연동 시 이곳에 포인트 차감 API 호출 로직을 넣습니다.
        window.alert('포인트가 차감되었습니다!');
        navigation.navigate('ChatLearn', {
          episodeId: ep.contentId, 
          episodeTitle: ep.title,
          status: ep.status // status 값 추가
        });
      }
    } else {
      // 앱 환경
      Alert.alert(
        '잠금 해제',
        confirmMessage,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '확인', 
            onPress: () => {
              // 실제 API 연동 시 이곳에 포인트 차감 API 호출 로직을 넣습니다.
              // iOS에서 Alert 연달아 띄울 때 씹히는 현상 방지를 위해 약간의 딜레이 추가
              setTimeout(() => {
                Alert.alert(
                  '알림',
                  '포인트가 차감되었습니다!',
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        navigation.navigate('ChatLearn', {
                          episodeId: ep.contentId, 
                          episodeTitle: ep.title,
                          status: ep.status // status 값 추가
                        });
                      }
                    }
                  ]
                );
              }, 300);
            } 
          }
        ]
      );
    }
  };

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

            {filteredContents.map((ep) => {
              const isLocked = ep.status === 'LOCKED';
              
              return (
                <TouchableOpacity
                  key={ep.contentId} 
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isLocked) {
                      handleUnlockPress(ep);
                    } else {
                      // UNLOCKED 상태일 때도 status 값을 함께 전달합니다.
                      navigation.navigate('ChatLearn', {
                        episodeId: ep.contentId, 
                        episodeTitle: ep.title,
                        status: ep.status 
                      });
                    }
                  }}
                >
                  {/* 기본 카드 콘텐츠 */}
                  <View style={{ opacity: isLocked ? 0.9 : 1 }}>
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
                  </View>

                  {/* 잠금 화면 오버레이 */}
                  {isLocked && (
                    <View style={styles.lockedOverlay}>
                      <View style={styles.lockIconCircle}>
                        <Ionicons name="lock-closed" size={20} color="#FFF" />
                      </View>
                      <Text style={styles.lockedText}>
                        이 스토리를 학습하려면{'\n'}
                        <Text style={styles.lockedPointsText}>{ep.requiredPoints || 0} 포인트</Text>가 필요합니다
                      </Text>
                      <TouchableOpacity 
                        style={styles.unlockButton}
                        onPress={() => handleUnlockPress(ep)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.unlockButtonText}>포인트로 잠금해제</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

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
    position: 'relative', 
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

  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  lockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  lockedPointsText: {
    color: '#EDD59E', 
  },
  unlockButton: {
    backgroundColor: '#5D7341', 
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StoryHomeScreen;