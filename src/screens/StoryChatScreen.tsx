import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StartStoryResponse, sendStoryChatMessage, StoryChatResponse } from '../api/story';

// 화면에서 렌더링할 통합 메시지 타입
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  isQuiz?: boolean;
  quiz?: StoryChatResponse['quiz'];
}

export default function StoryChatScreen({ route, navigation }: any) {
  const storyData: StartStoryResponse = route.params?.storyData;
  const flatListRef = useRef<FlatList>(null);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 초기 메시지 세팅 (생성 API에서 받은 ai_first_message)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: storyData?.ai_first_message || '',
      translation: storyData?.ai_first_translation || '',
      isQuiz: false,
    }
  ]);

  // 메시지 전송 로직
  const handleSend = async (messageToSend: string = inputText) => {
    if (!messageToSend.trim() || isSending) return;

    const userMessage = messageToSend.trim();
    setInputText(''); // 입력창 초기화
    
    // 1. 유저 메시지를 화면에 먼저 추가
    const newUserMsg: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsSending(true);

    try {
      // 2. API 호출
      const response = await sendStoryChatMessage({
        session_id: storyData.session_id,
        user_message: userMessage,
      });

      // 3. AI 응답을 화면에 추가 (퀴즈 여부 포함)
      const newAiMsg: ChatMessage = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: response.ai_message,
        translation: response.translation,
        isQuiz: response.is_quiz,
        quiz: response.quiz,
      };
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      // 필요 시 에러 처리 (예: Toast 알림)
    } finally {
      setIsSending(false);
    }
  };

  // 개별 메시지 렌더링 함수
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
        {/* AI 프로필 */}
        {!isUser && (
          <View style={styles.profileAvatar}>
            <Text style={styles.profileText}>{storyData?.character_name[0]}</Text>
          </View>
        )}

        <View style={styles.messageContentWrapper}>
          {/* 말풍선 */}
          <View style={[
            styles.messageBubble, 
            isUser ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
              {item.content}
            </Text>
            {!isUser && item.translation && (
              <Text style={styles.translationText}>{item.translation}</Text>
            )}
          </View>

          {/* 🌟 퀴즈 UI (is_quiz가 true일 때 말풍선 하단에 추가 렌더링) */}
          {!isUser && item.isQuiz && item.quiz && (
            <View style={styles.quizContainer}>
              <View style={styles.quizHeader}>
                <Ionicons name="sparkles" size={16} color="#A69463" />
                <Text style={styles.quizHeaderText}>{item.quiz.question}</Text>
              </View>
              
              <View style={styles.quizOptionsBox}>
                {/* 객관식 보기 렌더링 */}
                {item.quiz.options?.map((option, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.quizOptionBtn}
                    onPress={() => handleSend(option)} // 보기 클릭 시 자동으로 메시지 전송
                  >
                    <Text style={styles.quizOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {storyData?.situation || '스토리 학습'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 채팅 내역 영역 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.chatArea}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.timeLabelContainer}>
              <Text style={styles.timeLabel}>오늘, 새로운 스토리 시작</Text>
            </View>
          }
        />

        {/* 하단 입력창 */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.plusBtn}>
            <Ionicons name="add-circle-outline" size={28} color="#666" />
          </TouchableOpacity>
          <TextInput 
            style={styles.textInput}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()} // 키보드 엔터(완료) 시 전송
            editable={!isSending}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() || isSending) && { opacity: 0.5 }]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F1' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#F9FAF4' },
  iconBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  chatArea: { paddingHorizontal: 20, paddingVertical: 20 },
  timeLabelContainer: { alignItems: 'center', marginBottom: 20 },
  timeLabel: { backgroundColor: '#E0E1D6', color: '#555', fontSize: 12, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D5DFCA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileText: { color: '#5D7341', fontWeight: 'bold', fontSize: 16 },
  
  messageContentWrapper: { maxWidth: '80%' },
  
  messageBubble: { padding: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  assistantBubble: { backgroundColor: '#FFF', borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#A3B880', borderTopRightRadius: 4 },
  
  messageText: { fontSize: 15, color: '#333', lineHeight: 22 },
  userMessageText: { color: '#111', fontWeight: '500' },
  translationText: { fontSize: 13, color: '#888', marginTop: 8 },
  
  /* 🌟 퀴즈 영역 스타일 */
  quizContainer: { marginTop: 12, width: '100%' },
  quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  quizHeaderText: { fontSize: 13, color: '#A69463', fontWeight: '600', marginLeft: 6, flexShrink: 1 },
  quizOptionsBox: { backgroundColor: '#FAF9F4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  quizOptionBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E6E6', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 },
  quizOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
  plusBtn: { marginRight: 12 },
  textInput: { flex: 1, backgroundColor: '#EBEBE0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#6B8E23', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});