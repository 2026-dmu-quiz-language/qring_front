import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/common/Text';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { getIncorrectList, type IncorrectEntry } from '../api/incorrect';

const WrongNoteScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [episodes, setEpisodes] = useState<IncorrectEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        console.log('📤 [오답노트] API 호출 시작: POST /incorrect');
        try {
          const data = await getIncorrectList();
          console.log('✅ [오답노트] API 응답 성공:', JSON.stringify(data));
          setEpisodes(data);
        } catch (err: any) {
          console.error('❌ [오답노트] API 호출 실패:', err.message);
          if (err.response) {
            console.error('❌ [오답노트] 서버 응답:', err.response.status, JSON.stringify(err.response.data));
          }
          setError('오답 목록을 불러올 수 없습니다.');
        } finally {
          console.log('📋 [오답노트] 로딩 완료');
          setLoading(false);
        }
      };
      fetchData();
    }, []),
  );

  if (loading) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="오답 노트" leftType="none" rightType="none" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="오답 노트" leftType="none" rightType="none" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="오답 노트" leftType="none" rightType="none" />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >

        {episodes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>아직 오답 기록이 없습니다.</Text>
          </View>
        ) : (
          episodes.map((ep) => (
            <TouchableOpacity
              // 같은 스토리도 레벨별로 따로 내려오고, 스토리와 컴피티션은 contentId 가 겹칠 수 있다.
              // 셋을 묶어야 항목이 고유해진다.
              key={`${ep.sourceType}-${ep.contentId}-${ep.level}`}
              style={styles.episodeCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('WrongNoteQuiz', {
                  sourceType: ep.sourceType,
                  episodeId: ep.contentId,
                  episodeTitle: ep.label,
                  level: ep.level,
                })
              }
            >
              <View style={styles.episodeInfo}>
                <Text style={styles.episodeTitle} numberOfLines={1}>
                  {ep.label}
                </Text>
                {/* 컴피티션은 label 에 이미 '레벨 N' 이 들어 있어 뱃지를 겹쳐 붙이지 않는다.
                    레벨 값이 안 오면 '레벨 ' 만 남으므로 아예 그리지 않는다. */}
                {ep.sourceType === 'STORY' && ep.level != null ? (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>레벨 {ep.level}</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textDisabled} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 120 },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 20,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textHint,
  },
  episodeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  episodeInfo: {
    flex: 1,
    // 제목과 레벨 뱃지를 한 줄에 나란히 둔다.
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textStrong,
    // 제목이 길어도 뱃지를 밀어내지 않게 제목 쪽이 줄어든다.
    flexShrink: 1,
  },
  levelBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: theme.colors.greenTint,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

export default WrongNoteScreen;
