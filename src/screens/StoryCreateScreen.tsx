import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
// 🌟 취소선 경고 해결을 위해 안전 영역은 별도 라이브러리에서 가져옵니다.
import { SafeAreaView } from 'react-native-safe-area-context'; 
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
  
  // 누적 퀴즈 개수 상태
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

  // 스토리 종료 시 저장 여부를 묻는 알림창
  const promptSaveStory = () => {
    Alert.alert(
      '스토리 저장',
      '지금까지 대화한 스토리를 저장할까요? (저장 시 50포인트 차감)',
      [
        {
          text: '아니요 (삭제)',
          style: 'destructive',
          onPress: async () => {
            try {
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
          text: '네 (저장)',
          onPress: async () => {
            try {
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
    
    // 1. 유저 메시지를 화면에 먼저 추가
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

      // 🌟 퀴즈 카운트 추적
      let currentCount = quizCount;
      if (response.is_quiz) {
        currentCount += 1;
        setQuizCount(currentCount);
      }

      // 🌟 매 5번째 퀴즈(5, 10, 15...) 도달 시 반복해서 알림창 띄우기
      if (currentCount > 0 && currentCount % 5 === 0 && response.is_quiz) {
        setTimeout(() => {
          Alert.alert(
            '스토리 연장',
            '퀴즈 5개를 완료했습니다. 더 이어서 하시겠습니까? (100포인트 차감)',
            [
              {
                text: '아니요',
                style: 'cancel',
                onPress: promptSaveStory
              },
              {
                text: '네',
                onPress: () => { 
                  // 100포인트 차감 API 호출 로직이 필요하다면 여기에 추가
                  console.log(`${currentCount}번째 퀴즈 완료 -> 스토리 계속 진행`);
                }
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
            
            {/* 🌟 수정 1: 빈 문자열 렌더링 에러 방지를 위해 삼항 연산자 사용 */}
            {!isUser && item.translation ? (
              <Text style={styles.translationText}>{item.translation}</Text>
            ) : null}
          </View>

          {/* 🌟 수정 2: 퀴즈 UI 분기 처리에도 삼항 연산자 적용 */}
          {!isUser && item.isQuiz && item.quiz ? (
            <View style={styles.quizContainer}>
              <View style={styles.quizHeader}>
                <Ionicons name="sparkles" size={16} color="#A69463" />
                <Text style={styles.quizHeaderText}>{item.quiz.question}</Text>
              </View>
              
              <View style={styles.quizOptionsBox}>
                
                {/* 1. 객관식 퀴즈 (options 배열이 있을 때) */}
                {item.quiz.options && item.quiz.options.length > 0 ? (
                  item.quiz.options.map((option, idx) => (
                    <TouchableOpacity 
                      key={`opt-${idx}`} 
                      style={styles.quizOptionBtn}
                      onPress={() => handleSend(option)}
                    >
                      <Text style={styles.quizOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))
                ) : null}

                {/* 2. 단어 배열 퀴즈 (tiles 배열이 있을 때) */}
                {item.quiz.tiles && item.quiz.tiles.length > 0 ? (
                  <View style={styles.tilesWrapper}>
                    {item.quiz.tiles.map((tile, idx) => (
                      <TouchableOpacity 
                        key={`tile-${idx}`} 
                        style={styles.tileBtn}
                        // 타일을 클릭하면 하단 입력창에 단어가 띄어쓰기와 함께 추가됨
                        onPress={() => setInputText((prev) => (prev ? prev + ' ' + tile : tile))}
                      >
                        <Text style={styles.tileText}>{tile}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

              </View>
            </View>
          ) : null}
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
          <TouchableOpacity 
            onPress={() => promptSaveStory()} 
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
  
  /* 퀴즈 공통 영역 */
  quizContainer: { marginTop: 12, width: '100%' },
  quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  quizHeaderText: { fontSize: 13, color: '#A69463', fontWeight: '600', marginLeft: 6, flexShrink: 1 },
  quizOptionsBox: { backgroundColor: '#FAF9F4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EFEFEF' },
  
  /* 객관식 퀴즈 영역 */
  quizOptionBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6E6E6', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 },
  quizOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  
  /* 🌟 단어 배열(Tiles) 전용 영역 */
  tilesWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tileBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C5D0B5', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tileText: { fontSize: 14, color: '#5D7341', fontWeight: '600' },

  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE' },
  plusBtn: { marginRight: 12 },
  textInput: { flex: 1, backgroundColor: '#EBEBE0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#6B8E23', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});