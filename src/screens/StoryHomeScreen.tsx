import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/common/Text';
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
import { showAlert, showConfirm } from '../components/common/AlertHost';

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
        showAlert({ title: '로그인 만료', message: '다시 로그인해 주세요.' });
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

  // 🌟 API 명세서에 맞춘 해금 로직
  const handleUnlockPress = (ep: ContentItem) => {
    const confirmMessage = `${ep.title}을(를) 열람하시겠습니까?\n${ep.requiredPoints || 0}포인트 차감`;

    const unlockAndNavigate = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) return;

        // 1. URL Path에 contentId를 넣고, Request Body는 빈 객체({})로 전송
        const response = await axios.post(
          `https://q-ring.app/content/${ep.contentId}/unlock`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // API 응답에서 남은 포인트(balanceAfter) 가져오기
        const balanceAfter = response.data.balanceAfter;

        await showAlert({
          title: '해금 완료',
          message: `해금되었습니다!\n남은 포인트: ${balanceAfter}P`,
        });

        navigation.navigate('ChatLearn', {
          episodeId: ep.contentId,
          episodeTitle: ep.title,
          status: 'UNLOCKED'
        });
      } catch (error: any) {
        console.error('해금 API 에러:', error);
        // 서버에서 보내주는 에러 메시지가 있다면 표시, 없으면 기본 메시지
        const errorMsg = error.response?.data?.message || '포인트가 부족하거나 오류가 발생했습니다.';
        await showAlert({ title: '잠금 해제 실패', message: errorMsg });
      }
    };

    void (async () => {
      const isConfirmed = await showConfirm({
        title: '잠금 해제',
        message: confirmMessage,
        confirmText: '확인',
        cancelText: '취소',
        cancelable: true, // 해금하지 않는 쪽이 안전하므로 뒤로가기로 닫아도 된다
      });
      if (isConfirmed) await unlockAndNavigate();
    })();
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
                        { color: isActive ? theme.colors.primary : theme.colors.textSub },
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
                  <View style={styles.imageWrap}>
                    {ep.thumbnailUrl ? (
                      <Image source={{ uri: ep.thumbnailUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.cardImage, { backgroundColor: theme.colors.surfaceAlt }]} />
                    )}

                    {isLocked && (
                      <View style={styles.lockedOverlay}>
                        <View style={styles.lockIconCircle}>
                          <Ionicons name="lock-closed" size={18} color={theme.colors.surface} />
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
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.text, lineHeight: 30 },
  subtitle: { marginTop: 6, fontSize: 14, color: theme.colors.textMuted },
  loadingWrap: { marginTop: 50, alignItems: 'center' },
  emptyText: { marginTop: 40, textAlign: 'center', color: theme.colors.textHint, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25 },
  chipActive: { backgroundColor: theme.colors.greenChip, borderWidth: 1, borderColor: theme.colors.primary },
  chipInactive: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: 'transparent' },
  chipIcon: { width: 16, height: 16 },
  chipLabel: { fontSize: 14, fontWeight: '600' },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 0, 
    marginTop: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, 
    shadowRadius: 15,
    elevation: 3,
    position: 'relative', 
  },
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
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: theme.colors.text },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  badgeWrap: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: theme.colors.greenTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.primary },
  badgeCompleted: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeCheckIcon: { width: 14, height: 14 },
  badgeTextCompleted: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSub },
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
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  lockedPointsText: {
    color: '#EDD59E', 
  },
  unlockButton: {
    backgroundColor: theme.colors.primary, 
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default StoryHomeScreen;