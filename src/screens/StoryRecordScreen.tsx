import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchStoryRecord, StoryRecordResponse, TimelineItem } from '../api/story';

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
    // 1. 일반 메시지 렌더링 (Assistant vs User)
    if (item.type === 'message') {
      const isUser = item.role === 'user';
      return (
        <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
          {!isUser && (
            <View style={styles.profileAvatar}>
               {/* 캡처본처럼 캐릭터 이미지가 들어갈 자리 */}
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
            {/* AI 메시지 한글 번역 (필요시 노출) */}
            {!isUser && item.translation && (
               <Text style={styles.translationText}>{item.translation}</Text>
            )}
          </View>
        </View>
      );
    }

    // 2. 퀴즈 출제 블록 렌더링
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

    // 3. 퀴즈 결과 (보통 유저 메시지 직후에 오므로, UI상 별도 말풍선보다는 생략하거나 뱃지로 처리)
    if (item.type === 'quiz_result') {
      return null; // 유저 메시지 자체가 정답을 말하고 있으므로 UI 중복 방지를 위해 렌더링 제외
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {record ? record.situation : '로딩 중...'}
        </Text>
        <View style={{ width: 24 }} /> {/* 타이틀 중앙 정렬용 여백 */}
      </View>

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
  container: {
    flex: 1,
    backgroundColor: '#F5F6F1', // 학습 화면 배경색과 동일한 베이지 톤
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F6F1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 12,
  },
  chatContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E8D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    color: '#6B8E23',
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4, // 11.50.33 캡처본 기준 AI 말풍선 꼬리 디테일
  },
  userBubble: {
    backgroundColor: '#A3B880', // 우측 유저 메시지 올리브 그린 색상
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: '#111',
    fontWeight: '500',
  },
  translationText: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  // 🌟 11.50.09 캡처본 기준 퀴즈 영역 스타일
  quizContainer: {
    marginLeft: 48, // 프로필 이미지 크기만큼 들여쓰기
    marginRight: 20,
    marginBottom: 20,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  quizHeaderText: {
    fontSize: 13,
    color: '#A69463', // 반짝이 아이콘과 동일한 골드브라운 톤
    fontWeight: '600',
    marginLeft: 6,
  },
  quizOptionsBox: {
    backgroundColor: '#FAF9F4', // 약간 따뜻한 퀴즈 박스 배경
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  quizOptionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quizOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  }
});