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
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  StartStoryResponse, 
  sendStoryChatMessage, 
  StoryChatResponse,
  archiveStorySession,
  discardStorySession
} from '../api/story';

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
  
  // 🌟 진행된 퀴즈 개수 상태 추가
  const [quizCount, setQuizCount] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: storyData?.ai_first_message || '',
      translation: storyData?.ai_first_translation || '',
      isQuiz: false,
    }
  ]);

  // 🌟 스토리를 이어가지 않고 종료할 때 저장 여부를 묻는 알림창
  const promptSaveStory = () => {
    Alert.alert(
      '스토리 저장',
      '지금까지 대화한 스토리를 저장할까요? (저장 시 50포인트 차감)',
      [
        {
          text: '아니요',
          style: 'destructive',
          onPress: async () => {
            try {
              // 폐기 API 호출
              await discardStorySession({ session_id: storyData.session_id });
              Alert.alert('알림', '대화한 스토리가 삭제됩니다.', [
                { text: '확인', onPress: () => navigation.navigate('StoryMain') }
              ]);
            } catch (error) {
              console.error('스토리 삭제 실패:', error);
              Alert.alert('오류', '스토리 삭제에 실패했습니다.');
            }
          }
        },
        {
          text: '네',
          onPress: async () => {
            try {
              // 저장 API 호출
              const response = await archiveStorySession({ session_id: storyData.session_id });
              Alert.alert(
                '저장 완료', 
                `스토리가 저장되었습니다.\n남은 포인트: ${response.user_remaining_points}`, 
                [{ text: '확인', onPress: () => navigation.navigate('StoryMain') }]
              );
            } catch (error) {
              console.error('스토리 저장 실패:', error);
              Alert.alert('오류', '스토리 저장에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleSend = async (messageToSend: string = inputText) => {
    if (!messageToSend.trim() || isSending) return;

    const userMessage = messageToSend.trim();
    setInputText(''); 
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsSending(true);

    try {
      const response = await sendStoryChatMessage({
        session_id: storyData.session_id,
        user_message: userMessage,
      });

      const newAiMsg: ChatMessage = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: response.ai_message,
        translation: response.translation,
        isQuiz: response.is_quiz,
        quiz: response.quiz,
      };
      setMessages((prev) => [...prev, newAiMsg]);

      // 🌟 퀴즈 카운트 추적 및 알림 로직
      let currentCount = quizCount;
      if (response.is_quiz) {
        currentCount += 1;
        setQuizCount(currentCount);
      }

      // 서버가 보내주는 current_quiz_count 또는 로컬 카운트가 5의 배수(5번) 도달 시
      if (currentCount > 0 && currentCount % 5 === 0 && response.is_quiz) {
        // 메시지 렌더링이 조금 안정된 후 알림창을 띄우기 위해 약간 지연
        setTimeout(() => {
          Alert.alert(
            '스토리 종료',
            '스토리가 종료되었습니다. 더 이어서 하시겠습니까? (100포인트 차감)',
            [
              {
                text: '아니요',
                style: 'cancel',
                onPress: promptSaveStory
              },
              {
                text: '네',
                // '네' 선택 시에는 아무 작업 없이 대화(채팅창)를 계속 이어나가도록 둡니다.
                onPress: () => { console.log('계속 대화하기 선택') }
              }
            ],
            { cancelable: false }
          );
        }, 500);
      }

    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
        {!isUser && (
          <View style={styles.profileAvatar}>
            <Text style={styles.profileText}>{storyData?.character_name[0]}</Text>
          </View>
        )}

        <View style={styles.messageContentWrapper}>
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

          {!isUser && item.isQuiz && item.quiz && (
            <View style={styles.quizContainer}>
              <View style={styles.quizHeader}>
                <Ionicons name="sparkles" size={16} color="#A69463" />
                <Text style={styles.quizHeaderText}>{item.quiz.question}</Text>
              </View>
              
              <View style={styles.quizOptionsBox}>
                {item.quiz.options?.map((option, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.quizOptionBtn}
                    onPress={() => handleSend(option)}
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
        <View style={styles.header}>
          {/* 뒤로가기 버튼 클릭 시에도 저장/삭제 분기 알림을 띄울 수 있도록 커스텀 처리 가능 */}
          <TouchableOpacity 
            onPress={() => {
               // 단순히 뒤로가기보다는 진행 중인 세션 처리를 위해 알림을 띄우는 것이 좋습니다.
               promptSaveStory();
            }} 
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {storyData?.situation || '스토리 학습'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

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
            onSubmitEditing={() => handleSend()}
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