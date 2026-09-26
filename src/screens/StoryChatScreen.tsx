import React, { useState, useRef, useEffect } from 'react';
import { 
  View,  
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { Text } from '../components/common/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { playSfx } from '../utils/sfx';
import { ChatInputBar } from '../components/common/ChatInputBar';
import { showAlert, showConfirm } from '../components/common/AlertHost';
import { theme } from '../constants/theme';
import { 
  StartStoryResponse, 
  sendStoryChatMessage, 
  StoryChatResponse,
  archiveStorySession,
  discardStorySession,
  StoryResumeResponse,
  TimelineEvent,
  extendStorySession
} from '../api/story';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  isQuiz?: boolean;
  quiz?: StoryChatResponse['quiz'];
  answerResult?: 'correct' | 'incorrect' | 'none';
}

function timelineToMessages(timeline: TimelineEvent[]): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  timeline.forEach((ev, i) => {
    if (ev.type === 'message') {
      msgs.push({
        id: `tl-${i}`, role: ev.role!, content: ev.content ?? '',
        translation: ev.translation,
      });
    } else if (ev.type === 'quiz' && msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.role === 'assistant') { last.isQuiz = true; last.quiz = ev.quiz; }
    } else if (ev.type === 'quiz_result' && msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.role === 'user') { last.answerResult = ev.result; }
    }
  });
  return msgs;
}

export default function StoryChatScreen({ route, navigation }: any) {
  const storyData: StartStoryResponse | undefined = route.params?.storyData;
  const resumeData: StoryResumeResponse | undefined = route.params?.resumeData;
  
  const sessionId = storyData?.session_id ?? resumeData?.session_id ?? '';
  const characterName = storyData?.character_name ?? resumeData?.character_name ?? '';
  const situation = storyData?.situation ?? resumeData?.situation ?? '';

  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const isCompletedRef = useRef(resumeData?.is_completed ?? false);
  const [canExtendStory, setCanExtendStory] = useState(true);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    resumeData?.timeline ? timelineToMessages(resumeData.timeline)
    : [{ 
        id: 'init-msg', 
        role: 'assistant',
        content: storyData?.ai_first_message || '',
        translation: storyData?.ai_first_translation || '', 
        isQuiz: false 
      }]
  );

  const scrollToBottom = () => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      scrollToBottom();
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleDiscard = async () => {
    try {
      await discardStorySession({ session_id: sessionId });
      await showAlert({ title: '알림', message: '대화한 스토리가 삭제됩니다.' });
    } catch (error: any) {
      console.error('스토리 삭제 실패:', error);
      const errorMsg = error?.response?.data?.message || error?.message || '스토리 삭제에 실패했습니다.';
      await showAlert({
        title: '오류',
        message: `${errorMsg}\n메인 화면으로 이동합니다.`,
      });
    }
    navigation.navigate('MainTab', { screen: 'Story' });
  };

  const handleArchive = async () => {
    try {
      const response = await archiveStorySession({ session_id: sessionId });
      playSfx('usePoints');
      await showAlert({
        title: '저장 완료',
        message: `스토리가 저장되었습니다.\n남은 포인트: ${response.user_remaining_points}`,
      });
    } catch (error: any) {
      console.error('스토리 저장 실패:', error);
      const errorMsg = error?.response?.data?.message || error?.message || '스토리 저장에 실패했습니다.';
      await showAlert({
        title: '오류',
        message: `${errorMsg}\n메인 화면으로 이동합니다.`,
      });
    }
    navigation.navigate('MainTab', { screen: 'Story' });
  };

  const promptSaveStory = async () => {
    const isConfirmed = await showConfirm({
      title: '스토리 저장',
      message: '이 스토리를 보관함에 저장할까요? (포인트가 차감될 수 있습니다)',
      confirmText: '저장하기',
      cancelText: '저장 안 함 (삭제)',
    });

    if (isConfirmed) {
      await handleArchive();
    } else {
      await handleDiscard();
    }
  };

  const handleExtend = async () => {
    try {
      setIsSending(true);
      const response = await extendStorySession({ session_id: sessionId });
      
      playSfx('usePoints');
      showAlert({
        title: '연장 완료',
        message: `스토리가 연장되었습니다!\n남은 포인트: ${response.user_remaining_points}`,
      });

      setCanExtendStory(response.can_extend);
      isCompletedRef.current = false;

      const newAiMsg: ChatMessage = {
        id: Date.now().toString() + '-ai-extend',
        role: 'assistant',
        content: response.ai_message,
        isQuiz: false,
      };
      setMessages((prev) => [...prev, newAiMsg]);
      playSfx('receiveChat');
      scrollToBottom();

    } catch (error: any) {
      console.error('스토리 연장 실패:', error);
      const errorMsg = error?.response?.data?.message || error?.message || '연장에 실패했습니다.';
      await showAlert({ title: '오류', message: `${errorMsg}\n스토리를 종료합니다.` });
      promptSaveStory(); 
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (isCompletedRef.current) {
      promptSaveStory();
      return;
    }
    
    void (async () => {
      const isConfirmed = await showConfirm({
        title: '대화 나가기',
        message: '대화는 저장되어 있어요. 나중에 이어서 할 수 있습니다.',
        confirmText: '나가기',
        cancelText: '취소',
        cancelable: true,
      });
      if (isConfirmed) {
        navigation.navigate('MainTab', { screen: 'Story' });
      }
    })();
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
    playSfx('sendChat');
    setIsSending(true);
    scrollToBottom(); 

    try {
      const response = await sendStoryChatMessage({
        session_id: sessionId,
        user_message: userMessage,
      });

      if (response.answer_result && response.answer_result !== 'none') {
        setMessages((prev) => prev.map((m) =>
          m.id === newUserMsg.id ? { ...m, answerResult: response.answer_result as any } : m
        ));
        if (response.answer_result === 'correct') {
          playSfx('correct');
        }
      }

      const newAiMsg: ChatMessage = {
        id: Date.now().toString() + '-ai',
        role: 'assistant',
        content: response.ai_message,
        translation: response.translation,
        isQuiz: response.is_quiz,
        quiz: response.quiz,
      };
      setMessages((prev) => [...prev, newAiMsg]);

      playSfx(response.is_quiz ? 'quiz' : 'receiveChat');
      scrollToBottom(); 

      if (response.is_completed) {
        isCompletedRef.current = true;
        // 🌟 수정 포인트: 마지막 메시지를 유저가 충분히 읽을 수 있도록 2.5초 지연 후 종료 알림창 표시
        setTimeout(async () => {
          if (canExtendStory) {
            const isConfirmed = await showConfirm({
              title: '스토리 연장',
              message: '퀴즈를 모두 풀었어요!\n100포인트를 사용하여 대화를 연장하시겠습니까?',
              confirmText: '연장하기',
              cancelText: '종료하기',
            });
            if (isConfirmed) {
              await handleExtend();
            } else {
              await promptSaveStory();
            }
          } else {
            const isConfirmed = await showConfirm({
              title: '스토리 종료',
              message: '최대 연장 횟수에 도달하여 스토리가 종료됩니다.\n이 스토리를 보관함에 저장할까요?',
              confirmText: '저장하기',
              cancelText: '저장 안 함 (삭제)',
            });
            if (isConfirmed) {
              await handleArchive();
            } else {
              await handleDiscard();
            }
          }
        }, 2500);
      }

    } catch (error: any) {
      console.error('메시지 전송 실패:', error);
      setMessages((prev) => prev.filter((m) => m.id !== newUserMsg.id)); 
      setInputText(userMessage);

      // 🌟 수정 포인트: 서버 또는 네트워크의 상세 오류 메시지 추출하여 출력
      const errorMsg = error?.response?.data?.message || error?.message || '네트워크 연결이 불안정하거나 서버 오류가 발생했습니다.';
      showAlert({ title: '전송 실패', message: `${errorMsg}\n메시지를 다시 보내주세요.` });
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.profileText}>{characterName?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={styles.messageContentWrapper}>
          <View style={[
            styles.bubble, 
            isUser ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
              {item.content}
            </Text>
            {!isUser && item.translation ? (
              <Text style={styles.translationText}>{item.translation}</Text>
            ) : null}
          </View>

          {isUser && item.answerResult && item.answerResult !== 'none' ? (
            <Text style={item.answerResult === 'correct' ? styles.resultCorrect : styles.resultWrong}>
              {item.answerResult === 'correct' ? '✓ 정답' : '✗ 오답'}
            </Text>
          ) : null}

          {!isUser && item.isQuiz && item.quiz ? (
            <View style={styles.quizContainer}>
              <View style={styles.quizHeader}>
                <Ionicons name="sparkles" size={16} color={theme.colors.tertiary} />
                <Text style={styles.quizHeaderText}>{item.quiz.question}</Text>
              </View>
              <View style={styles.quizOptionsBox}>
                {!item.quiz.options?.length && !item.quiz.tiles?.length ? (
                  <Text style={styles.quizHint}>
                    ✏️ 직접 입력해 보세요{item.quiz.hint ? `\n💡 힌트: ${item.quiz.hint}` : ''}
                  </Text>
                ) : null}
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
                {item.quiz.tiles && item.quiz.tiles.length > 0 ? (
                  <View style={styles.tilesWrapper}>
                    {item.quiz.tiles.map((tile, idx) => (
                      <TouchableOpacity 
                        key={`tile-${idx}`} 
                        style={styles.tileBtn}
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
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: theme.colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.headerContainer}>
          <View style={styles.topBar}>
            <View style={styles.leftSection}>
              <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.centerSection}>
              <Text style={styles.title} numberOfLines={1}>
                {situation || '스토리 학습'}
              </Text>
            </View>
            <View style={styles.rightSection} />
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.chatArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListHeaderComponent={
            <View style={styles.timeLabelContainer}>
              <Text style={styles.timeLabel}>오늘, 스토리 시작</Text>
            </View>
          }
        />

        <View style={[
          styles.inputContainer, 
          { 
            paddingBottom: isKeyboardVisible 
              ? 8 
              : Platform.OS === 'ios' 
                ? Math.max(insets.bottom, 12) 
                : 12
          }
        ]}>
          <ChatInputBar
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSend()}
            editable={!isCompletedRef.current}
            sending={isSending}
            maxLength={200}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerContainer: { width: '100%', backgroundColor: 'transparent', paddingBottom: 10, paddingTop: 10 },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: 'transparent' },
  leftSection: { width: 40, alignItems: 'flex-start' },
  centerSection: { flex: 1, alignItems: 'center' },
  rightSection: { width: 40, alignItems: 'flex-end' },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  iconButton: { padding: 4, marginLeft: -5 },
  
  chatArea: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  
  timeLabelContainer: { alignItems: 'center', marginBottom: 20 },
  timeLabel: { backgroundColor: theme.colors.greenChip, color: theme.colors.textSub, fontSize: 12, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.white, marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  profileText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 },
  
  messageContentWrapper: { maxWidth: '75%' },
  bubble: { 
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20,
    elevation: 1, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  assistantBubble: { backgroundColor: theme.colors.white, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: theme.colors.primary, borderTopRightRadius: 4 },
  
  bubbleText: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  userBubbleText: { color: theme.colors.white, fontWeight: '500' },
  
  translationText: { fontSize: 13, color: theme.colors.textMuted, marginTop: 8 },
  resultCorrect: { fontSize: 12, color: theme.colors.primary, fontWeight: 'bold', marginTop: 6, alignSelf: 'flex-end' },
  resultWrong: { fontSize: 12, color: theme.colors.dangerSoft, fontWeight: 'bold', marginTop: 6, alignSelf: 'flex-end' },
  
  inputContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 10, 
    backgroundColor: 'transparent'
  },

  quizContainer: { marginTop: 12, width: '100%' },
  quizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  quizHeaderText: { fontSize: 13, color: theme.colors.tertiary, fontWeight: '600', marginLeft: 6, flexShrink: 1 },
  quizOptionsBox: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.colors.border },
  quizOptionBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 },
  quizOptionText: { fontSize: 14, color: theme.colors.text, fontWeight: '500' },
  tilesWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tileBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.greenBorder, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tileText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  quizHint: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 20 },
});