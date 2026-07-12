import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { getIncorrectList, type IncorrectEpisode } from '../api/incorrect';

const WrongNoteScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [episodes, setEpisodes] = useState<IncorrectEpisode[]>([]);
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
        <Header title="오답 노트" leftType="none" rightType="profile" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="오답 노트" leftType="none" rightType="profile" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="오답 노트" leftType="none" rightType="profile" />

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
              key={ep.contentId}
              style={styles.episodeCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('WrongNoteQuiz', {
                  episodeId: ep.contentId,
                  episodeTitle: ep.storyName,
                })
              }
            >
              <View style={styles.episodeInfo}>
                <Text style={styles.episodeTitle}>{ep.storyName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bbb" />
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
    color: '#dc3545',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
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
    color: '#999',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});

export default WrongNoteScreen;
