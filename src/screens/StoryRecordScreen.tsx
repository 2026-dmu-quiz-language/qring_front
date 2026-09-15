import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchStoryRecord, StoryRecordResponse, TimelineItem } from '../api/story';
// 🌟 Header 컴포넌트 추가
import { Header } from '../components/layout/Header';

export default function StoryRecordScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [record, setRecord] = useState<StoryRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecord();
  }, [sessionId]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const data = await fetchStoryRecord(sessionId);
      setRecord(data);
    } catch (error) {
      console.error('스토리 기록을 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTimelineItem = ({ item, index }: { item: TimelineItem; index: number }) => {
    if (item.type === 'message') {
      const isUser = item.role === 'user';
      return (
        <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
          {!isUser && (
            <View style={styles.profileAvatar}>
               <Text style={styles.profileText}>{record?.character_name?.[0]}</Text>
            </View>
          )}
          
          <View style={[
            styles.messageBubble, 
            isUser ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
              {item.content}
            </Text>
            {!isUser && item.translation ? (
               <Text style={styles.translationText}>{item.translation}</Text>
            ) : null}
          </View>
        </View>
      );
    }

    if (item.type === 'quiz' && item.quiz) {
      const options = item.quiz.options || item.quiz.tiles || [];
      return (
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <Ionicons name="sparkles" size={16} color="#A69463" />
            <Text style={styles.quizHeaderText}>{item.quiz.question}</Text>
          </View>
          
          <View style={styles.quizOptionsBox}>
            {options.map((option, idx) => (
              <View key={idx} style={styles.quizOptionBtn}>
                <Text style={styles.quizOptionText}>{option}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (item.type === 'quiz_result') {
      return null; 
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🌟 기존 하드코딩된 헤더 대신 공통 Header 컴포넌트 사용 */}
      <Header title={record ? record.situation : '로딩 중...'} leftType="back" rightType="none" />

      {loading ? (
        <ActivityIndicator size="large" color="#6B8E23" style={{ marginTop: '50%' }} />
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
  container: { flex: 1, backgroundColor: '#F5F6F1' },
  chatContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E8D5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileText: { color: '#6B8E23', fontWeight: 'bold' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  assistantBubble: { backgroundColor: '#FFFFFF', borderRadius: 16, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#A3B880', borderRadius: 16, borderTopRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#333' },
  userMessageText: { color: '#111', fontWeight: '500' },
  translationText: { fontSize: 13, color: '#888', marginTop: 8 },
  quizContainer: { marginLeft: 48, marginRight: 20, marginBottom: 20 },
  quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  quizHeaderText: { fontSize: 13, color: '#A69463', fontWeight: '600', marginLeft: 6 },
  quizOptionsBox: { backgroundColor: '#FAF9F4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  quizOptionBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E6E6', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 },
  quizOptionText: { fontSize: 14, color: '#333', fontWeight: '500' }
});