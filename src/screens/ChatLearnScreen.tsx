// screens/ChatLearn/ChatLearnScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  // 🌟 KeyboardAvoidingView와 Platform 추가
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput } from '../components/common/Text';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { LearnStackParamList } from '../constants/navigation';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { getChatData, submitResult } from '../api/content';
import type { Script, Quiz, QuizResultItem } from '../api/content';
import { getErrorMessage } from '../utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';
import WordBreakText from '../components/common/WordBreakText';
import { playSfx } from '../utils/sfx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '../utils/useKeyboardVisible';
import { ChatInputBar } from '../components/common/ChatInputBar';

interface DisplayMessage {
  type: 'script' | 'quiz';
  script?: Script;
  quiz?: Quiz;
}

// ✅ lastAnswer 추가
interface QuizResult {
  tryCount: number;
  hintUsed: boolean;
  lastAnswer: string;
  correct: boolean;
}

const ChatBubble = ({ text }: { text: string }) => (
  <View style={styles.bubbleRow}>
    <View style={styles.avatar}>
      <Ionicons name="person" size={20} color={theme.colors.primary} />
    </View>
    <View style={styles.bubble}>
      <WordBreakText text={text} textStyles={styles.bubbleText} />
    </View>
  </View>
);

// 문제창 아래 여백.
// 아이폰은 기존 값을 유지한다.
// 갤럭시는 하단 시스템 바에 힌트보기 버튼이 가리지 않도록 그 높이만큼 더한다.
// 단, 키보드가 떠 있으면 키보드가 하단 바를 덮으므로 더하지 않는다. 더하면 키보드와 문제창 사이가 벌어진다.
// 키보드가 올라오면 키보드가 하단 안전영역을 덮으므로 인셋을 더하지 않는다.
// 더하면 카드가 쓸 수 있는 높이만 줄어든다.
const useQuizCardBottomPadding = () => {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  return 20 + (keyboardVisible ? 0 : insets.bottom);
};

const ChoiceQuiz = ({ quiz, hint, onComplete }: { quiz: Quiz; hint: string; onComplete: (result: QuizResult) => void; }) => {
  const cardBottomPadding = useQuizCardBottomPadding();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [tryCount, setTryCount] = useState(1);
  
  const parsedOptions: string[] = Array.isArray(quiz.options)
    ? quiz.options
    : JSON.parse(quiz.options);

  const handleSubmit = () => {
    if (selected === null) return;
    const answer = parsedOptions[selected];
    const correct = answer === quiz.correctAnswer;
    setSubmitted(true);
    setIsCorrect(correct);
    if (correct) {
      playSfx('correct');
    } else {
      // 오답음 파일이 준비되면 여기에 playSfx('incorrect')를 넣으면 된다.
    }
    setModalVisible(true);
  };

  const getOptionStyle = (index: number) => {
    if (!submitted && selected === index) return styles.optionSelected;
    if (submitted && isCorrect && parsedOptions[index] === quiz.correctAnswer) return styles.optionCorrect;
    if (submitted && !isCorrect && selected === index) return styles.optionWrong;
    return styles.optionDefault;
  };

  const getRadioStyle = (index: number) => {
    if (!submitted && selected === index) return styles.radioSelected;
    if (submitted && isCorrect && parsedOptions[index] === quiz.correctAnswer) return styles.radioCorrect;
    if (submitted && !isCorrect && selected === index) return styles.radioWrong;
    return styles.radioDefault;
  };

  const showCheck = (index: number) => {
    if (!submitted && selected === index) return true;
    if (submitted && isCorrect && parsedOptions[index] === quiz.correctAnswer) return true;
    return false;
  };

  return (
    <View style={[styles.quizCard, { paddingBottom: cardBottomPadding }]}>
      <View style={styles.dragHandle} />
      <ScrollView
        style={styles.quizScroll}
        contentContainerStyle={styles.quizScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.quizLabel}>
        {quiz.quizType === 'fill_in_blank' ? '빈칸 채우기' : '객관식'}
      </Text>
      <Text style={styles.quizQuestion}>{quiz.question}</Text>

      {showHint && !submitted && (
        <View style={styles.hintBox}>
          <Text style={styles.hintContent}>{hint}</Text>
        </View>
      )}

      <View style={styles.optionsWrap}>
        {parsedOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => !submitted && setSelected(index)}
            style={[styles.optionRow, getOptionStyle(index)]}
            activeOpacity={0.7}
            disabled={submitted}
          >
            <Text style={styles.optionText}>{option}</Text>
            <View style={[styles.radio, getRadioStyle(index)]}>
              {showCheck(index) && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, (selected === null || submitted) && styles.nextButtonDisabled]}
        onPress={handleSubmit}
        disabled={selected === null || submitted}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>정답 확인하기</Text>
      </TouchableOpacity>

      {!submitted && (
        <TouchableOpacity style={styles.hintButton} onPress={() => setShowHint(true)}>
          <Text style={styles.hintText}>힌트보기</Text>
        </TouchableOpacity>
      )}
      </ScrollView>
      <Modal transparent visible={isModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isCorrect ? theme.colors.primary : theme.colors.danger }]}>
              {isCorrect ? '정답입니다! 🎉' : tryCount >= 3 ? '기회를 모두 사용했어요 😢' : '아쉽네요! 🥲'}
            </Text>
            <Text style={styles.modalDesc}>
              {isCorrect
                ? quiz.explanation || '완벽하게 이해하셨네요!\n다음 스토리로 넘어가볼까요?'
                : tryCount >= 3
                  ? '다음 문제로 넘어갈게요.\n복습에서 다시 도전해보세요!'
                  : `오답입니다. (${tryCount}/3)\n다시 한번 확인해 볼까요?`}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isCorrect ? theme.colors.primary : theme.colors.danger }]}
              onPress={() => {
                setModalVisible(false);
                if (isCorrect || tryCount >= 3) {
                  onComplete({ tryCount: isCorrect ? tryCount : 4, hintUsed: showHint, lastAnswer: parsedOptions[selected!], correct: isCorrect });
                } else {
                  setTryCount(prev => prev + 1);
                  setSubmitted(false);
                  setSelected(null);
                }
              }}
            >
              <Text style={styles.modalButtonText}>
                {isCorrect || tryCount >= 3 ? '다음으로 ➔' : '다시 풀기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SubjectiveQuiz = ({ quiz, hint, onComplete }: { quiz: Quiz; hint: string; onComplete: (result: QuizResult) => void; }) => {
  const cardBottomPadding = useQuizCardBottomPadding();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [tryCount, setTryCount] = useState(1);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    const trimmed = answer.trim().toLowerCase();
    const correct = trimmed === quiz.correctAnswer.toLowerCase();
    setSubmitted(true);
    setIsCorrect(correct);
    if (correct) {
      playSfx('correct');
    } else {
      // 오답음 파일이 준비되면 여기에 playSfx('incorrect')를 넣으면 된다.
    }
    setModalVisible(true);
  };

  return (
    <View style={[styles.quizCard, { paddingBottom: cardBottomPadding }]}>
      <View style={styles.dragHandle} />
      <ScrollView
        style={styles.quizScroll}
        contentContainerStyle={styles.quizScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.quizLabel}>주관식</Text>
      <Text style={styles.quizQuestion}>{quiz.question}</Text>

      {showHint && !submitted && (
        <View style={styles.hintBox}>
          <Text style={styles.hintContent}>{hint}</Text>
        </View>
      )}

      <TextInput
        style={styles.textInput}
        placeholder="답을 입력하세요"
        placeholderTextColor={theme.colors.textHint}
        value={answer}
        onChangeText={setAnswer}
        editable={!submitted}
      />

      <TouchableOpacity
        style={[styles.nextButton, (!answer.trim() || submitted) && styles.nextButtonDisabled]}
        onPress={handleSubmit}
        disabled={!answer.trim() || submitted}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>정답 확인하기</Text>
      </TouchableOpacity>

      {!submitted && (
        <TouchableOpacity style={styles.hintButton} onPress={() => setShowHint(true)}>
          <Text style={styles.hintText}>힌트보기</Text>
        </TouchableOpacity>
      )}
      </ScrollView>
      <Modal transparent visible={isModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isCorrect ? theme.colors.primary : theme.colors.danger }]}>
              {isCorrect ? '정답입니다! 🎉' : tryCount >= 3 ? '기회를 모두 사용했어요 😢' : '아쉽네요! 🥲'}
            </Text>
            <Text style={styles.modalDesc}>
              {isCorrect
                ? quiz.explanation || '완벽하게 이해하셨네요!\n다음 스토리로 넘어가볼까요?'
                : tryCount >= 3
                  ? '다음 문제로 넘어갈게요.\n복습에서 다시 도전해보세요!'
                  : `오답입니다. (${tryCount}/3)\n다시 도전해볼까요?`}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isCorrect ? theme.colors.primary : theme.colors.danger }]}
              onPress={() => {
                setModalVisible(false);
                if (isCorrect || tryCount >= 3) {
                  onComplete({ tryCount: isCorrect ? tryCount : 4, hintUsed: showHint, lastAnswer: answer.trim(), correct: isCorrect });
                } else {
                  setTryCount(prev => prev + 1);
                  setSubmitted(false);
                  setAnswer('');
                }
              }}
            >
              <Text style={styles.modalButtonText}>
                {isCorrect || tryCount >= 3 ? '다음으로 ➔' : '다시 풀기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ChatLearnScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  const route = useRoute<RouteProp<LearnStackParamList, 'ChatLearn'>>();
  const resultRef = useRef<QuizResultItem[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // 키보드 회피 보정값에 상단 인셋을 쓴다.
  const insets = useSafeAreaInsets();

  const { episodeId, episodeTitle } = route.params;

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(1);
  const [episodeComplete, setEpisodeComplete] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getChatData(episodeId);
        
        if (!data || !data.scripts || data.scripts.length === 0) {
          setError(`스크립트 데이터가 없습니다.`);
          return;
        }

        const quizMap = new Map<number, Quiz>();
        if (data.quizzes) {
            data.quizzes.forEach((q: Quiz) => quizMap.set(q.scriptId, q));
        }

        const display: DisplayMessage[] = [];
        
        data.scripts.forEach((s: Script) => {
          display.push({ type: 'script', script: s });
          
          const linkedQuiz = quizMap.get(s.scriptId);
          if (linkedQuiz) {
            display.push({ type: 'quiz', quiz: linkedQuiz });
          }
        });

        setMessages(display);
      } catch (err: any) {
        setError(getErrorMessage(err));
        console.error('❌ [에러발생] 채팅 데이터 로딩 실패:', err.message);
        if (err.response) {
          console.error('❌ [서버 에러 상세]:', JSON.stringify(err.response.data, null, 2));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [episodeId]); // language가 변경될 때도 데이터를 다시 불러오도록 의존성 배열에 추가

  const handleTap = () => {
    if (episodeComplete) return;
    if (visibleCount >= messages.length) return;
    const lastVisible = messages[visibleCount - 1];
    
    if (lastVisible?.type === 'quiz') return;

    const nextCount = visibleCount + 1;
    setVisibleCount(nextCount);
    // 다음에 열리는 게 퀴즈면 퀴즈 등장 소리, 대사면 채팅 소리를 낸다.
    playSfx(messages[nextCount - 1]?.type === 'quiz' ? 'quiz' : 'receiveChat');

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    if (nextCount >= messages.length && messages[nextCount - 1]?.type !== 'quiz') {
      setEpisodeComplete(true);
      setShowResultModal(true);
    }
  };

  const currentQuiz = messages.slice(0, visibleCount).find(
    (msg, i) => msg.type === 'quiz' && i === visibleCount - 1
  );

  const handleQuizComplete = (quizId: number, result: QuizResult) => {
    // ✅ 서버 명세에 맞게 필드명 수정
    resultRef.current.push({
      quizId: quizId,
      attemptCount: result.tryCount,
      correct: result.correct,
      lastAnswer: result.lastAnswer,
      hintUsed: result.hintUsed,
    });

    if (visibleCount >= messages.length) {
      setEpisodeComplete(true);
      setShowResultModal(true);
    } else {
      setVisibleCount((prev) => prev + 1);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleShowResult = async () => {
    setShowResultModal(false);
    const totalQuizCount = messages.filter(m => m.type === 'quiz').length;
    try {
      // 🌟 수정: submitResult 호출 시 언어 정보도 함께 넘겨줍니다.
      const response = await submitResult({
        episodeId: episodeId,
        result: resultRef.current,
      });
      navigation.navigate('LearningResult', {
        score: response.totalScore ?? 0,
        correctCount: response.correctCount ?? resultRef.current.length,
        totalQuestions: totalQuizCount,
      });
    } catch (e) {
      console.log('결과 제출 실패:', e);
      navigation.navigate('LearningResult', {
        score: 0,
        correctCount: resultRef.current.length,
        totalQuestions: totalQuizCount,
      });
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title={episodeTitle} leftType="back" rightType="menu" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>로딩 중...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <Header title={episodeTitle} leftType="back" rightType="menu" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.danger, marginBottom: 8 }}>
            데이터를 불러올 수 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
            {error}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title={episodeTitle} leftType="back" rightType="none" />

      {/* 🌟 1. 화면 전체를 감싸서 키보드가 올라올 때 밀어 올릴 준비를 합니다 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // 안드로이드는 엣지 투 엣지라 운영체제가 화면을 줄여주지 않으므로 직접 밀어 올린다.
        behavior="padding"
        // KeyboardAvoidingView 는 자기 위치를 부모 기준으로 재기 때문에
        // 화면 맨 위에서 떨어진 만큼(상단 안전영역) 직접 보정해줘야 한다.
        keyboardVerticalOffset={insets.top}
      >
        <Pressable style={{ flex: 1 }} onPress={handleTap}>
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            // 🌟 2. absolute를 뺐으므로 이제 억지 패딩(350px)이 필요 없습니다! 깔끔하게 원상복구!
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.slice(0, visibleCount).map((msg, index) => {
              if (msg.type === 'quiz') return null;
              return <ChatBubble key={index} text={msg.script!.scriptContent} />;
            })}
          </ScrollView>
        </Pressable>

        {/* 🌟 3. 메시지 바 (퀴즈가 없을 때만 바닥에 위치). 입력은 안 되고 모양만 있다. */}
        {!currentQuiz && <ChatInputBar readOnly />}

        {/* 🌟 4. 퀴즈 영역 (absolute를 뺐기 때문에 이제 키보드가 올라오면 그 위에 찰떡같이 얹혀서 올라갑니다) */}
        {!episodeComplete && currentQuiz?.quiz && (
          currentQuiz.quiz.quizType === 'subjective' ? (
            <SubjectiveQuiz
              quiz={currentQuiz.quiz}
              hint={currentQuiz.quiz.hint}
              onComplete={(result) => handleQuizComplete(currentQuiz.quiz!.quizId, result)}
            />
          ) : (
            <ChoiceQuiz
              quiz={currentQuiz.quiz}
              hint={currentQuiz.quiz.hint}
              onComplete={(result) => handleQuizComplete(currentQuiz.quiz!.quizId, result)}
            />
          )
        )}
      </KeyboardAvoidingView>

      {/* 모달은 키보드에 밀리지 않도록 가장 바깥에 둡니다 */}
      <Modal transparent visible={showResultModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContent}>
            <Text style={styles.resultModalTitle}>학습 완료! 🎉</Text>
            <Text style={styles.resultModalDesc}>
              모든 문제를 풀었어요!{'\n'}결과를 확인해볼까요?
            </Text>
            <TouchableOpacity
              style={styles.resultModalButton}
              onPress={handleShowResult}
              activeOpacity={0.8}
            >
              <Text style={styles.resultModalButtonText}>결과 보기 ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: theme.colors.background },
  bodyWithQuiz: {},
  bodyContent: { padding: 20, paddingBottom: 20 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.white, marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  bubble: { //채팅 버블
    backgroundColor: theme.colors.white, borderRadius: 20, borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12,
    maxWidth: '75%', elevation: 1, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  bubbleText: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },

  quizCard: {
    // 공간이 모자라면 카드가 줄어들고, 줄어든 만큼 안쪽 ScrollView 가 스크롤된다.
    flexShrink: 1,
    left: 0, 
    right: 0, 
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    paddingHorizontal: 24, 
    paddingTop: 15, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // 기본값. 실제 값은 useQuizCardBottomPadding이 기기와 키보드 상태에 맞춰 덮어쓴다.
    shadowColor: theme.colors.primary, 
    shadowOffset: { width: 0, height: -5 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    elevation: 20,
  },
  quizScroll: { flexShrink: 1 },
  quizScrollContent: { paddingBottom: 4 },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: 20 },
  quizLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginBottom: 6 },
  quizQuestion: { fontSize: 15, color: theme.colors.textSub, lineHeight: 22, marginBottom: 24 },

  optionsWrap: { gap: 12, marginBottom: 24 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5,
  },
  optionDefault: { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
  optionCorrect: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '15' },
  optionWrong: { borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerSurface },
  optionText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },

  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDefault: { borderColor: theme.colors.textDisabled },
  radioSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  radioCorrect: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  radioWrong: { borderColor: theme.colors.danger, backgroundColor: theme.colors.danger },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.surface },

  textInput: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
    fontSize: 15, color: theme.colors.text, backgroundColor: theme.colors.surface, marginBottom: 24,
  },

  nextButton: { backgroundColor: theme.colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  nextButtonDisabled: { backgroundColor: theme.colors.greenBorder },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: theme.colors.surface },

  hintButton: { marginTop: 16, alignItems: 'center' },
  hintText: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, textDecorationLine: 'underline' },
  hintBox: {
    backgroundColor: theme.colors.greenTint, borderRadius: 12, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
  },
  hintContent: { fontSize: 13, color: theme.colors.primary, lineHeight: 20 },

  resultButtonWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20,
    backgroundColor: theme.colors.background,
  },
  resultButton: {
    backgroundColor: theme.colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center',
  },
  resultButtonText: { fontSize: 16, fontWeight: '700', color: theme.colors.surface },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '80%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 30, alignItems: 'center',
    elevation: 5, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  modalDesc: { fontSize: 15, color: theme.colors.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButton: { width: '100%', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '700', color: theme.colors.surface },

  resultModalContent: {
    width: '80%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 30, alignItems: 'center',
    elevation: 5, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  resultModalTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.textStrong, marginBottom: 12 },
  resultModalDesc: { fontSize: 15, color: theme.colors.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  resultModalButton: {
    width: '100%', backgroundColor: theme.colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  resultModalButtonText: { fontSize: 16, fontWeight: '700', color: theme.colors.surface },

});

export default ChatLearnScreen;