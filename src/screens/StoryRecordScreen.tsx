import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { Text } from '../components/common/Text';
import { Ionicons } from '@expo/vector-icons';
import { fetchStoryRecord, StoryRecordResponse, TimelineItem } from '../api/story';
import { Header } from '../components/layout/Header';
import { theme } from '../constants/theme';

export default function StoryRecordScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [record, setRecord] = useState<StoryRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRecord(); }, [sessionId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await fetchStoryRecord(sessionId);
      setRecord(data);
    } catch (error) {
      console.error('스토리 기록을 불러오는데 실패했습니다:', error);
    } finally { setLoading(false); }
  };

  const renderTimelineItem = ({ item, index }: { item: TimelineItem; index: number }) => {
    if (item.type === 'message') {
      const isUser = item.role === 'user';
      return (
        <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
          {!isUser && (
            <View style={styles.profileAvatar}><Text style={styles.profileText}>{record?.character_name?.[0]}</Text></View>
          )}
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text>
            {!isUser && item.translation ? <Text style={styles.translationText}>{item.translation}</Text> : null}
          </View>
        </View>
      );
    }

    if (item.type === 'quiz' && item.quiz) {
      const options = item.quiz.options || item.quiz.tiles || [];
      return (
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <Ionicons name="sparkles" size={16} color={theme.colors.tertiary} />
            <Text style={styles.quizHeaderText}>{item.quiz.question}</Text>
          </View>
          <View style={styles.quizOptionsBox}>
            {options.map((option, idx) => (
              <View key={idx} style={styles.quizOptionBtn}><Text style={styles.quizOptionText}>{option}</Text></View>
            ))}
          </View>
        </View>
      );
    }

    // 🌟 연장 이벤트 렌더링 추가
    if (item.type === 'extension') {
      return (
        <View style={styles.extensionContainer}>
          <Text style={styles.extensionText}>
            대화가 연장되었습니다 (차감 {item.charged_points}P)
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={record ? record.situation : '로딩 중...'} leftType="back" rightType="none" />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: '50%' }} />
      ) : (
        <FlatList
          data={record?.timeline || []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderTimelineItem}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceAlt },
  chatContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.greenChip, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileText: { color: theme.colors.primary, fontWeight: 'bold' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  assistantBubble: { backgroundColor: theme.colors.surface, borderRadius: 16, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: theme.colors.secondary, borderRadius: 16, borderTopRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22, color: theme.colors.text }, userMessageText: { color: theme.colors.textStrong, fontWeight: '500' }, translationText: { fontSize: 13, color: theme.colors.textMuted, marginTop: 8 },
  quizContainer: { marginLeft: 48, marginRight: 20, marginBottom: 20 }, quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }, quizHeaderText: { fontSize: 13, color: theme.colors.tertiary, fontWeight: '600', marginLeft: 6 },
  quizOptionsBox: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border }, quizOptionBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 }, quizOptionText: { fontSize: 14, color: theme.colors.text, fontWeight: '500' },
  // 🌟 연장 이벤트 스타일
  extensionContainer: { alignItems: 'center', marginVertical: 16 },
  extensionText: { backgroundColor: theme.colors.greenChip, color: theme.colors.textSub, fontSize: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14, overflow: 'hidden' }
});