// screens/ChatLearn/ChatLearnScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal, // 🌟 팝업창을 만들기 위해 Modal 추가!
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { LearnStackParamList } from '../constants/navigation';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

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
      options: ["annoyed", "amused", "amazed", "ashamed"],
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

// ─── 퀴즈 브레이크 (바텀 시트 + 팝업 스타일) ───
const QuizBreak = ({ quiz, onComplete }: { quiz: Quiz; onComplete: () => void }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // 🌟 팝업창(모달) 상태 관리 추가
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (index: number) => {
    if (!submitted) setSelected(index);
  };

  // 🌟 정답 확인 버튼을 눌렀을 때의 로직
  const handleSubmit = () => {
    if (selected !== null) {
      setSubmitted(true);
      setIsCorrect(selected === quiz.correctIndex); // 정답 여부 판별
      setModalVisible(true); // 팝업창 띄우기
    }
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
      <View style={styles.dragHandle} />
      
      <Text style={styles.quizTitle}>✨ 정답을 선택하세요</Text>
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

      {/* 🌟 제출 버튼 (제출 후에는 비활성화 상태 유지) */}
      <TouchableOpacity
        style={[styles.nextButton, (selected === null || submitted) && styles.nextButtonDisabled]}
        onPress={handleSubmit}
        disabled={selected === null || submitted}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>정답 확인하기</Text>
      </TouchableOpacity>

      {/* 힌트 */}
      {!submitted && (
        <TouchableOpacity style={styles.hintButton} onPress={() => {}}>
          <Text style={styles.hintText}>힌트보기</Text>
        </TouchableOpacity>
      )}

      {/* 🌟 결과 팝업창 (Modal) */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 정답/오답에 따른 텍스트 분기 */}
            <Text style={[styles.modalTitle, { color: isCorrect ? theme.colors.primary : '#dc3545' }]}>
              {isCorrect ? '정답입니다! 🎉' : '아쉽네요! 🥲'}
            </Text>
            <Text style={styles.modalDesc}>
              {isCorrect ? '완벽하게 이해하셨네요!\n다음 스토리로 넘어가볼까요?' : '오답입니다.\n다시 한번 확인해 볼까요?'}
            </Text>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: isCorrect ? theme.colors.primary : '#dc3545' }]} 
              onPress={() => {
                setModalVisible(false);
                if (isCorrect) onComplete(); // 정답이면 다음 화면으로 이동
                else setSubmitted(false); // 오답이면 모달 닫고 다시 풀게 함
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

// ─── 메인 컴포넌트 ───
const ChatLearnScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<LearnStackParamList>>();
  const route = useRoute<RouteProp<LearnStackParamList, 'ChatLearn'>>();
  const { episodeTitle } = route.params;

  const [visibleCount, setVisibleCount] = useState(1);

  const handleTap = () => {
    if (visibleCount >= DUMMY_MESSAGES.length) return;
    if (visibleCount > 0 && DUMMY_MESSAGES[visibleCount - 1]?.isQuizBreak) return;
    setVisibleCount((prev) => prev + 1);
  };

  const isQuizVisible = DUMMY_MESSAGES.slice(0, visibleCount).some(msg => msg.isQuizBreak);

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title={episodeTitle} leftType="back" rightType="menu" />

      <ScrollView
        style={[styles.body, isQuizVisible && styles.bodyWithQuiz]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        onTouchEnd={handleTap}
      >
        {DUMMY_MESSAGES.slice(0, visibleCount).map((msg) => {
          if (msg.isQuizBreak) return null; 
          return <ChatBubble key={msg.id} message={msg} />;
        })}
      </ScrollView>

      {isQuizVisible && DUMMY_MESSAGES[visibleCount - 1]?.quiz && (
        <QuizBreak
          quiz={DUMMY_MESSAGES[visibleCount - 1].quiz!}
          onComplete={() => navigation.navigate('LearningResult')}
        />
      )}
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
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
  quizTitle: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 8 },
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

  nextButton: { backgroundColor: theme.colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  nextButtonDisabled: { backgroundColor: '#C5D1BC' },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  hintButton: { marginTop: 16, alignItems: 'center' },
  hintText: { fontSize: 13, fontWeight: '600', color: '#888', textDecorationLine: 'underline' },

  // 🌟 모달(팝업) 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 배경을 살짝 어둡게
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ChatLearnScreen;