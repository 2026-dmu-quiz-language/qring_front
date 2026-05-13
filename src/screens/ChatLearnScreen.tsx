// screens/ChatLearn/ChatLearnScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { LearnStackParamList } from '../constants/navigation';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
//import { LearningResult } from '../screens/LearningResultScreen'

// ─── 메시지 타입 ───
interface Message {
  id: number;
  text: string;
  isQuizBreak: boolean;
  quiz?: Quiz;
}

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

// ─── 더미 데이터 ───
const DUMMY_MESSAGES: Message[] = [
  { id: 1, text: '나 대학교 다닐 때 시험기간마다 도서관 3층 64번 자리에만 앉았음.', isQuizBreak: false },
  { id: 2, text: '창가 자리라서 햇빛도 잘 들고 에어컨 바람도 안 와서 딱 좋았거든.', isQuizBreak: false },
  { id: 3, text: '근데 어느 날부터 그 자리에 항상 먼저 와있는 애가 있는 거임.', isQuizBreak: false },
  { id: 4, text: '65번 자리에 앉아서 책 읽고 있더라고.', isQuizBreak: false },
  { id: 5, text: '처음엔 짜증났음. 내 자리 옆에 왜 앉냐고.', isQuizBreak: false },
  { id: 6, text: '그런데 그 애가 책상에 A4 용지 하나를 올려두고 가는 거야.', isQuizBreak: false },
  { id: 7, text: '거기에 연필로 "64번 자리 비워둘게요" 이렇게 적어둔 거임.', isQuizBreak: false },
  { id: 8, text: '뭔가 이상하다 싶었는데 일단 고맙긴 해서 그냥 앉았음.', isQuizBreak: false },
  { id: 9, text: '다음 날도 똑같더라고. 65번에 그 애 있고, 64번엔 쪽지.', isQuizBreak: false },
  {
    id: 10,
    text: '',
    isQuizBreak: true,
    quiz: {
      question: "다음 중 '짜증나다, 화나다'의 영어 표현으로 알맞은 것은?",
      options: ["annoyed",
              "amused",
              "amazed",
              "ashamed"],
      correctIndex: 0,
    },
  },
];

// ─── 채팅 버블 컴포넌트 ───
const ChatBubble = ({ message }: { message: Message }) => {

  return (
    <View style={styles.bubbleRow}>
      <View style={styles.avatar} />
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{message.text}</Text>
      </View>
    </View>
  );
};

// ─── 퀴즈 브레이크 ───
const QuizBreak = ({ quiz, onComplete }: { quiz: Quiz; onComplete: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (index: number) => {
    if (!submitted) setSelected(index);
  };

  const handleSubmit = () => {
    if (selected !== null) setSubmitted(true);
  };

  const getOptionStyle = (index: number) => {
    if (!submitted && selected === index) return styles.optionSelected;
    if (submitted && index === quiz.correctIndex) return styles.optionCorrect;
    if (submitted && selected === index && index !== quiz.correctIndex) return styles.optionWrong;
    return styles.optionDefault;
  };

  const getRadioStyle = (index: number) => {
    if (!submitted && selected === index) return styles.radioSelected;
    if (submitted && index === quiz.correctIndex) return styles.radioCorrect;
    if (submitted && selected === index && index !== quiz.correctIndex) return styles.radioWrong;
    return styles.radioDefault;
  };

  const showCheck = (index: number) => {
    if (!submitted && selected === index) return true;
    if (submitted && index === quiz.correctIndex) return true;
    return false;
  };

  return (
    <View style={styles.quizCard}>
      <Text style={styles.quizTitle}>정답을 선택하세요</Text>
      <Text style={styles.quizQuestion}>{quiz.question}</Text>

      {/* 선택지 */}
      <View style={styles.optionsWrap}>
        {quiz.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleSelect(index)}
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

      {/* 제출/결과 버튼 */}
      <TouchableOpacity
        style={[styles.nextButton, selected === null && styles.nextButtonDisabled]}
        onPress={submitted ? onComplete : handleSubmit}
        disabled={selected === null}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>
          {submitted
            ? selected === quiz.correctIndex ? '정답! 🎉  다음으로' : '오답!  다음으로'
            : '확인'}
        </Text>
      </TouchableOpacity>

      {/* 힌트 */}
      {!submitted && (
        <TouchableOpacity style={styles.hintButton} onPress={() => {}}>
          <Text style={styles.hintText}>힌트보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── 메인 컴포넌트 ───
const ChatLearnScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  const route = useRoute<RouteProp<LearnStackParamList, 'ChatLearn'>>();
  const { episodeTitle } = route.params;

  // 보여줄 메시지 수 (한 문장씩 시간차로 추가)
  const [visibleCount, setVisibleCount] = useState(1);

  // 화면 터치 시 다음 메시지 표시 (퀴즈면 멈춤)
  const handleTap = () => {
    if (visibleCount >= DUMMY_MESSAGES.length) return;
    if (visibleCount > 0 && DUMMY_MESSAGES[visibleCount - 1]?.isQuizBreak) return;
    setVisibleCount((prev) => prev + 1);
  };

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* ── Header ── */}
      <Header title={episodeTitle} leftType="back" rightType="menu" />

      {/* ── Body — 스토리 채팅 영역 ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        onTouchEnd={handleTap}
      >
        {/* 여기에 스토리 채팅 버블 들어갈 자리 */}
        {DUMMY_MESSAGES.slice(0, visibleCount).map((msg) => {
          if (msg.isQuizBreak && msg.quiz) {
            return (
              <QuizBreak
                key={msg.id}
                quiz={msg.quiz}
                onComplete={() => navigation.navigate('LearningResult')}
              />
            );
          }
          return <ChatBubble key={msg.id} message={msg} />;
        })}
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // 버블 한 줄 (프로필 + 말풍선)
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  // 프로필 동그라미
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  // 말풍선
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '70%',
  },
  bubbleText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },

  // ── 퀴즈 카드 ──
  quizCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 230,
    marginLeft: 20,
    marginHorizontal: -20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  quizQuestion: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },

  // ── 선택지 ──
  optionsWrap: {
    gap: 10,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionDefault: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f7eb',
  },
  optionCorrect: {
    borderColor: '#3C6933',
    backgroundColor: '#e6f4e0',
  },
  optionWrong: {
    borderColor: '#dc3545',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },

  // ── 라디오 ──
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDefault: {
    borderColor: '#D0D0D0',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  radioCorrect: {
    borderColor: '#3C6933',
    backgroundColor: '#3C6933',
  },
  radioWrong: {
    borderColor: '#dc3545',
    backgroundColor: '#dc3545',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },

  // ── 버튼 ──
  nextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── 힌트 ──
  hintButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default ChatLearnScreen;
