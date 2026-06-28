// screens/ChatLearn/ChatLearnScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
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

interface DisplayMessage {
  type: 'script' | 'quiz';
  script?: Script;
  quiz?: Quiz;
}

interface QuizResult {
  tryCount: number;
  hintUsed: boolean;
}

const ChatBubble = ({ text }: { text: string }) => (
  <View style={styles.bubbleRow}>
    <View style={styles.avatar} />
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
  </View>
);

const ChoiceQuiz = ({ quiz, hint, onComplete }: { quiz: Quiz; hint: string; onComplete: (result: QuizResult) => void; }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [tryCount, setTryCount] = useState(1);
  
  const parsedOptions: string[] = typeof quiz.options === 'string' 
    ? JSON.parse(quiz.options) 
    : quiz.options;

  const handleSubmit = () => {
    if (selected === null) return;
    const answer = parsedOptions[selected];
    const correct = answer === quiz.correctAnswer;
    setSubmitted(true);
    setIsCorrect(correct);
    setModalVisible(true);
  };

  const getOptionStyle = (index: number) => {
    if (!submitted && selected === index) return styles.optionSelected;
    if (submitted && parsedOptions[index] === quiz.correctAnswer) return styles.optionCorrect;
    if (submitted && selected === index && parsedOptions[index] !== quiz.correctAnswer) return styles.optionWrong;
    return styles.optionDefault;
  };

  const getRadioStyle = (index: number) => {
    if (!submitted && selected === index) return styles.radioSelected;
    if (submitted && parsedOptions[index] === quiz.correctAnswer) return styles.radioCorrect;
    if (submitted && selected === index && parsedOptions[index] !== quiz.correctAnswer) return styles.radioWrong;
    return styles.radioDefault;
  };

  const showCheck = (index: number) => {
    if (!submitted && selected === index) return true;
    if (submitted && parsedOptions[index] === quiz.correctAnswer) return true;
    return false;
  };

  return (
    <View style={styles.quizCard}>
      <View style={styles.dragHandle} />
      <Text style={styles.quizLabel}>
        {quiz.quizType === 'fill_in_blank' ? '빈칸 채우기' : '객관식'}
      </Text>
      <Text style={styles.quizQuestion}>{quiz.question}</Text>

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
      {showHint && !submitted && (
        <Text style={styles.hintContent}>{hint}</Text>
      )}

      <Modal transparent visible={isModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isCorrect ? theme.colors.primary : '#dc3545' }]}>
              {isCorrect ? '정답입니다! 🎉' : '아쉽네요! 🥲'}
            </Text>
            <Text style={styles.modalDesc}>
              {isCorrect
                ? quiz.explanation || '완벽하게 이해하셨네요!\n다음 스토리로 넘어가볼까요?'
                : '오답입니다.\n다시 한번 확인해 볼까요?'}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isCorrect ? theme.colors.primary : '#dc3545' }]}
              onPress={() => {
                setModalVisible(false);
                if (isCorrect) {
                  onComplete({ tryCount, hintUsed: showHint });
                } else {
                  setTryCount(prev => prev + 1);
                  setSubmitted(false);
                  setSelected(null);
                }
              }}
            >
              <Text style={styles.modalButtonText}>
                {isCorrect ? '다음으로 ➔' : '다시 풀기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SubjectiveQuiz = ({ quiz, hint, onComplete }: { quiz: Quiz; hint: string; onComplete: (result: QuizResult) => void; }) => {
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
    setModalVisible(true);
  };

  return (
    <View style={styles.quizCard}>
      <View style={styles.dragHandle} />
      <Text style={styles.quizLabel}>주관식</Text>
      <Text style={styles.quizQuestion}>{quiz.question}</Text>

      <TextInput
        style={styles.textInput}
        placeholder="답을 입력하세요"
        placeholderTextColor="#aaa"
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
      {showHint && !submitted && (
        <Text style={styles.hintContent}>{hint}</Text>
      )}

      <Modal transparent visible={isModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: isCorrect ? theme.colors.primary : '#dc3545' }]}>
              {isCorrect ? '정답입니다! 🎉' : '아쉽네요! 🥲'}
            </Text>
            <Text style={styles.modalDesc}>
              {isCorrect
                ? quiz.explanation || '완벽하게 이해하셨네요!\n다음 스토리로 넘어가볼까요?'
                : `정답은 "${quiz.correctAnswer}" 입니다.\n다시 도전해볼까요?`}
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isCorrect ? theme.colors.primary : '#dc3545' }]}
              onPress={() => {
                setModalVisible(false);
                if (isCorrect) {
                  onComplete({ tryCount, hintUsed: showHint });
                } else {
                  setTryCount(prev => prev + 1);
                  setSubmitted(false);
                  setAnswer('');
                }
              }}
            >
              <Text style={styles.modalButtonText}>
                {isCorrect ? '다음으로 ➔' : '다시 풀기'}
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
  
  // 🌟 추가: route.params에서 language 정보를 받습니다.
  const { episodeId, episodeTitle, language } = route.params;

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(1);
  const [episodeComplete, setEpisodeComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🌟 수정: getChatData 호출 시 언어 정보도 함께 넘겨줍니다.
        const data = await getChatData(episodeId, language);
        
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
  }, [episodeId, language]); // language가 변경될 때도 데이터를 다시 불러오도록 의존성 배열에 추가

  const handleTap = () => {
    if (episodeComplete) return;
    if (visibleCount >= messages.length) return;
    const lastVisible = messages[visibleCount - 1];
    
    if (lastVisible?.type === 'quiz') return;

    const nextCount = visibleCount + 1;
    setVisibleCount(nextCount);

    if (nextCount >= messages.length && messages[nextCount - 1]?.type !== 'quiz') {
      setEpisodeComplete(true);
    }
  };

  const currentQuiz = messages.slice(0, visibleCount).find(
    (msg, i) => msg.type === 'quiz' && i === visibleCount - 1
  );

  const handleQuizComplete = (quizId: number, result: QuizResult) => {
    resultRef.current.push({
      quizId: quizId,
      tryCount: result.tryCount,
      correct: true,
      hintOpened: result.hintUsed,
    });

    if (visibleCount >= messages.length) {
      setEpisodeComplete(true);
    } else {
      setVisibleCount((prev) => prev + 1);
    }
  };

  const handleShowResult = async () => {
    setSubmitting(true);
    const totalQuizCount = messages.filter(m => m.type === 'quiz').length;
    try {
      // 🌟 수정: submitResult 호출 시 언어 정보도 함께 넘겨줍니다.
      const response = await submitResult({
        episodeId: episodeId, 
        language: language, 
        result: resultRef.current,
      });
      navigation.navigate('LearningResult', {
        score: response.score ?? 0,
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
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#dc3545', marginBottom: 8 }}>
            데이터를 불러올 수 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 }}>
            {error}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title={episodeTitle} leftType="back" rightType="menu" />

      <ScrollView
        style={[styles.body, currentQuiz && styles.bodyWithQuiz]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        onTouchEnd={handleTap}
      >
        {messages.slice(0, visibleCount).map((msg, index) => {
          if (msg.type === 'quiz') return null;
          return <ChatBubble key={index} text={msg.script!.scriptContent} />;
        })}
      </ScrollView>

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

      {episodeComplete && (
        <View style={styles.resultButtonWrap}>
          <TouchableOpacity
            style={[styles.resultButton, submitting && styles.nextButtonDisabled]}
            onPress={handleShowResult}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.resultButtonText}>
              {submitting ? '결과 확인 중...' : '결과 보기'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: theme.colors.background },
  bodyWithQuiz: {},
  bodyContent: { padding: 20, paddingBottom: 400 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.white, marginRight: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  bubble: {
    backgroundColor: theme.colors.white, borderRadius: 20, borderTopLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12,
    maxWidth: '75%', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  bubbleText: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },

  quizCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 15, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 20,
  },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20 },
  quizLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginBottom: 6 },
  quizQuestion: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 24 },

  optionsWrap: { gap: 12, marginBottom: 24 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 16, borderWidth: 1.5,
  },
  optionDefault: { borderColor: '#E8E8E8', backgroundColor: '#FFFFFF' },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: '#F9FAF5' },
  optionCorrect: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '15' },
  optionWrong: { borderColor: '#dc3545', backgroundColor: '#fef2f2' },
  optionText: { fontSize: 15, fontWeight: '600', color: '#333' },

  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDefault: { borderColor: '#D0D0D0' },
  radioSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  radioCorrect: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  radioWrong: { borderColor: '#dc3545', backgroundColor: '#dc3545' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  textInput: {
    borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
    fontSize: 15, color: '#333', backgroundColor: '#FAFAFA', marginBottom: 24,
  },

  nextButton: { backgroundColor: theme.colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  nextButtonDisabled: { backgroundColor: '#C5D1BC' },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  hintButton: { marginTop: 16, alignItems: 'center' },
  hintText: { fontSize: 13, fontWeight: '600', color: '#888', textDecorationLine: 'underline' },
  hintContent: { fontSize: 13, color: theme.colors.primary, textAlign: 'center', marginTop: 8 },

  resultButtonWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20,
    backgroundColor: theme.colors.background,
  },
  resultButton: {
    backgroundColor: theme.colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center',
  },
  resultButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    width: '80%', backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  modalDesc: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButton: { width: '100%', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

export default ChatLearnScreen;