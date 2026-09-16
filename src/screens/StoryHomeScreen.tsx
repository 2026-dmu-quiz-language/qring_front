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
  Platform, 
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

// 카테고리 아이콘. 번들러가 파일을 앱에 넣으려면 경로를 코드에 그대로 적어야 한다.
const CATEGORY_ICONS = {
  all: require('../../assets/categories.png'),
  romance: require('../../assets/romance.png'),
  book: require('../../assets/book.png'),
};

const StoryHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<{id: string, label: string, icon: any}[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // 연애 계열은 하트 아이콘, 나머지는 책 아이콘을 쓴다.
  const getCategoryIcon = (name: string) => {
    if (!name) return CATEGORY_ICONS.book;
    const isRomance = ['짝사랑', '특이한연애', '연애갈등', '로맨스'].some((keyword) =>
      name.includes(keyword),
    );
    return isRomance ? CATEGORY_ICONS.romance : CATEGORY_ICONS.book;
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
        icon: getCategoryIcon(name),
      }));

      const finalCategories = [
        { id: 'ALL', label: '전체', icon: CATEGORY_ICONS.all },
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
      const isConfirmed = window.confirm(confirmMessage);
      if (isConfirmed) {
        window.alert('포인트가 차감되었습니다!');
        navigation.navigate('ChatLearn', {
          episodeId: ep.contentId, 
          episodeTitle: ep.title,
          status: ep.status 
        });
      }
    } else {
      Alert.alert(
        '잠금 해제',
        confirmMessage,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '확인', 
            onPress: () => {
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
                          status: ep.status 
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
      <Header title="스토리 홈" leftType="none" rightType="none" />

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
                    <Image source={cat.icon} style={styles.chipIcon} resizeMode="contain" />
                    <Text
                      style={[
                        styles.chipLabel,
                        { color: isActive ? theme.colors.primary : '#666' },
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
                      navigation.navigate('ChatLearn', {
                        episodeId: ep.contentId, 
                        episodeTitle: ep.title,
                        status: ep.status 
                      });
                    }
                  }}
                >
                  {/* 1. 이미지 영역 (잠금 오버레이 포함) */}
                  <View style={styles.imageWrap}>
                    {ep.thumbnailUrl ? (
                      <Image source={{ uri: ep.thumbnailUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.cardImage, { backgroundColor: '#EFEFE1' }]} />
                    )}

                    {/* 잠금 화면 오버레이 (이미지 영역에만 덮임) */}
                    {isLocked && (
                      <View style={styles.lockedOverlay}>
                        <View style={styles.lockIconCircle}>
                          <Ionicons name="lock-closed" size={18} color="#FFF" />
                        </View>
                        <Text style={styles.lockedText}>
                          학습하려면 <Text style={styles.lockedPointsText}>{ep.requiredPoints || 0} P</Text>가 필요해요
                        </Text>
                        <View style={styles.unlockButton}>
                          <Text style={styles.unlockButtonText}>포인트로 잠금해제</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 2. 하단 텍스트 영역 (항상 선명하게 보임) */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{ep.title}</Text>
                    <View style={styles.cardMeta}>
                      <View style={styles.badgeWrap}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>퀴즈 {ep.quizCount || 0}개</Text>
                        </View>
                        
                        {ep.isCompleted && (
                          <View style={styles.badgeCompleted}>
                            <Image
                              source={require('../../assets/check.png')}
                              style={styles.badgeCheckIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.badgeTextCompleted}>학습 완료</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
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
  // 선택된 칩. 진한 초록 위에서는 아이콘 그림이 묻혀서 연한 초록 바탕에 초록 글자로 둔다.
  chipActive: { backgroundColor: '#E0E8D5', borderWidth: 1, borderColor: theme.colors.primary },
  chipInactive: { backgroundColor: '#F3F4EB', borderWidth: 1, borderColor: 'transparent' },
  chipIcon: { width: 16, height: 16 },
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
  
  // 새롭게 분리된 이미지 래퍼 영역
  imageWrap: {
    height: 140,
    width: '100%',
    position: 'relative', 
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardInfo: { padding: 20 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  
  badgeWrap: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#edf7e6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.primary },
  
  badgeCompleted: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeCheckIcon: { width: 14, height: 14 },
  badgeTextCompleted: { fontSize: 12, fontWeight: 'bold', color: '#666' },

  // 이미지 영역 안에서만 위치하도록 absoluteFill 적용 및 사이즈 축소
  lockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    zIndex: 10,
  },
  lockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  lockedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  lockedPointsText: {
    color: '#EDD59E', 
  },
  unlockButton: {
    backgroundColor: '#5D7341', 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StoryHomeScreen;