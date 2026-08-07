import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';

// ─── 색상 ───
const C = {
  darkGreen: '#4E5E43',
  chipGreen: '#6F9F63',
  chipGreenShadow: '#4F7A45',
  barTrack: '#D9DBC9',
  botBarFill: '#D3E3A6',
  usedChipBg: '#E2E3D6',
  usedChipText: '#B4B5A3',
  dashedBorder: '#C9CBB4',
  buttonBg: '#B7A07A',
  buttonText: '#FBF6EA',
  vsBg: '#EDE5D2',
  vsText: '#9B8A6B',
};

// ─── 더미 문제 (단어 조합) ───
type WordComboQuiz = {
  sentence: string;
  words: string[];
  answer: string[];
};

const DUMMY_QUIZZES: WordComboQuiz[] = [
  {
    sentence: '나는 어제 사과를 먹었다.',
    words: ['I', 'apple', 'ate', 'yesterday', 'an'],
    answer: ['I', 'ate', 'an', 'apple', 'yesterday'],
  },
  {
    sentence: '그녀는 매일 아침 커피를 마신다.',
    words: ['coffee', 'She', 'every', 'drinks', 'morning'],
    answer: ['She', 'drinks', 'coffee', 'every', 'morning'],
  },
  {
    sentence: '우리는 지금 영어를 공부하고 있다.',
    words: ['studying', 'now', 'We', 'English', 'are'],
    answer: ['We', 'are', 'studying', 'English', 'now'],
  },
];

const BotCompetitionScreen = () => {
  const navigation = useNavigation<any>();

  const [currentIndex, setCurrentIndex] = useState(0);
  // 정답 영역에 놓인 단어들 (words 배열의 인덱스)
  const [placed, setPlaced] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // 더미 진행률: 유저는 푼 문제 수 기준, 봇은 고정값
  const myPercent = Math.round((currentIndex / DUMMY_QUIZZES.length) * 100);
  const botPercent = 65;

  const quiz = DUMMY_QUIZZES[currentIndex % DUMMY_QUIZZES.length];

  const handlePickWord = (index: number) => {
    if (feedback || placed.includes(index)) return;
    setPlaced((prev) => [...prev, index]);
  };

  const handleRemoveWord = (orderIndex: number) => {
    if (feedback) return;
    setPlaced((prev) => prev.filter((_, i) => i !== orderIndex));
  };

  const handleSubmit = () => {
    if (feedback || placed.length !== quiz.words.length) return;
    const isCorrect = placed
      .map((i) => quiz.words[i])
      .every((word, i) => word === quiz.answer[i]);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      setFeedback(null);
      if (isCorrect) {
        setPlaced([]);
        setCurrentIndex((prev) => (prev + 1) % DUMMY_QUIZZES.length);
      }
    }, 1000);
  };

  const canSubmit = placed.length === quiz.words.length && !feedback;

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topIconButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={C.darkGreen} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topIconButton} activeOpacity={0.7}>
          <Ionicons name="pause" size={22} color={C.darkGreen} />
        </TouchableOpacity>
      </View>

      {/* VS 헤더 */}
      <View style={styles.vsSection}>
        <View style={styles.playerColumn}>
          <View style={styles.myAvatarRing}>
            <Image
              source={require('../../assets/Qring-emoji1.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.myName}>Me</Text>
            <Text style={styles.percentText}>{myPercent}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.myBarFill, { width: `${Math.max(myPercent, 4)}%` }]} />
          </View>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsBadgeText}>VS</Text>
        </View>

        <View style={styles.playerColumn}>
          <View style={styles.botAvatarRing}>
            <Image
              source={require('../../assets/Qring-img.png')}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.botName}>Q-Bot</Text>
            <Text style={styles.percentText}>{botPercent}%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.botBarFill, { width: `${botPercent}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 문제 카드 */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{quiz.sentence}</Text>
          <Text style={styles.questionSub}>주어진 단어를 순서대로 조합하세요.</Text>

          <View
            style={[
              styles.answerArea,
              feedback === 'correct' && styles.answerAreaCorrect,
              feedback === 'wrong' && styles.answerAreaWrong,
            ]}
          >
            {placed.map((wordIndex, orderIndex) => (
              <TouchableOpacity
                key={`${wordIndex}-${orderIndex}`}
                style={styles.placedChip}
                onPress={() => handleRemoveWord(orderIndex)}
                activeOpacity={0.8}
              >
                <Text style={styles.placedChipText}>{quiz.words[wordIndex]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {feedback && (
            <Text
              style={[
                styles.feedbackText,
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
              ]}
            >
              {feedback === 'correct' ? '정답이에요!' : '순서가 달라요, 다시 조합해보세요'}
            </Text>
          )}
        </View>

        {/* 단어 보기 */}
        <View style={styles.wordBank}>
          {quiz.words.map((word, index) => {
            const used = placed.includes(index);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.bankChip, used && styles.bankChipUsed]}
                onPress={() => handlePickWord(index)}
                disabled={used}
                activeOpacity={0.7}
              >
                <Text style={[styles.bankChipText, used && styles.bankChipTextUsed]}>
                  {word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 정답 확인 버튼 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>정답 확인</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // VS 헤더
  vsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  playerColumn: {
    flex: 1,
  },
  myAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: C.chipGreen,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  botAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#DDDED2',
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  avatarImage: {
    width: '82%',
    height: '82%',
  },
  vsBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 44,
    alignSelf: 'center',
    alignItems: 'center',
  },
  vsBadgeText: {
    backgroundColor: C.vsBg,
    color: C.vsText,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  myName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  botName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: C.barTrack,
    overflow: 'hidden',
  },
  myBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: C.chipGreen,
  },
  botBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: C.botBarFill,
  },

  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // 문제 카드
  questionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2b2b2b',
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ABAC9C',
    textAlign: 'center',
    marginBottom: 20,
  },
  answerArea: {
    minHeight: 128,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.dashedBorder,
    borderRadius: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: 8,
    padding: 12,
  },
  answerAreaCorrect: {
    borderColor: C.chipGreen,
    backgroundColor: C.chipGreen + '10',
  },
  answerAreaWrong: {
    borderColor: '#dc3545',
    backgroundColor: '#dc354510',
  },
  placedChip: {
    backgroundColor: C.chipGreen,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderBottomWidth: 4,
    borderBottomColor: C.chipGreenShadow,
  },
  placedChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.white,
  },
  feedbackText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackCorrect: { color: C.chipGreen },
  feedbackWrong: { color: '#dc3545' },

  // 단어 보기
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  bankChip: {
    backgroundColor: theme.colors.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bankChipUsed: {
    backgroundColor: C.usedChipBg,
    shadowOpacity: 0,
    elevation: 0,
  },
  bankChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  bankChipTextUsed: {
    color: C.usedChipText,
  },

  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  submitButton: {
    backgroundColor: C.buttonBg,
    borderRadius: 30,
    paddingVertical: 17,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.buttonText,
  },
});

export default BotCompetitionScreen;
