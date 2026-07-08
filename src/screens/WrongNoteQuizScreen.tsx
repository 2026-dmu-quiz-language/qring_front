import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import {
  getIncorrectRetry,
  submitIncorrectResult,
  type IncorrectQuiz,
} from '../api/incorrect';

const WrongNoteQuizScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any>>();
  const { episodeId, episodeTitle } = route.params as {
    episodeId: number;
    episodeTitle: string;
  };

  const [quizzes, setQuizzes] = useState<IncorrectQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [totalPoint, setTotalPoint] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getIncorrectRetry(episodeId);
        setQuizzes(data);
      } catch (err: any) {
        console.error('오답 퀴즈 로딩 실패:', err);
        setError('오답 문제를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [episodeId]);

  if (loading) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="오답 풀이" leftType="back" rightType="none" />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || quizzes.length === 0) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="오답 풀이" leftType="back" rightType="none" />
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>{error || '오답 문제가 없습니다.'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const quiz = quizzes[currentIndex];
  const parsedOptions: string[] = Array.isArray(quiz.options)
    ? quiz.options
    : JSON.parse(quiz.options as any);
  const isCorrect =
    selected !== null && parsedOptions[selected] === quiz.correctAnswer;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected !== null && parsedOptions[selected] === quiz.correctAnswer) {
      setTotalPoint((prev) => prev + 3);
    } else {
      setTotalPoint((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      try {
        const result = await submitIncorrectResult({
          contentId: episodeId,
          point: totalPoint,
        });
        Alert.alert(
          '오답 풀이 완료',
          `총점: ${result.totalPoint}`,
          [{ text: '확인', onPress: () => navigation.goBack() }]
        );
      } catch (err) {
        console.error('오답 결과 제출 실패:', err);
        navigation.goBack();
      }
    }
  };

  const getOptionStyle = (index: number) => {
    if (!submitted && selected === index) return styles.optionSelected;
    if (submitted && parsedOptions[index] === quiz.correctAnswer)
      return styles.optionCorrect;
    if (submitted && selected === index && !isCorrect) return styles.optionWrong;
    return styles.optionDefault;
  };

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="오답 풀이" leftType="back" rightType="none" />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.incorrectBadge}>
          <Ionicons name="close-circle" size={16} color="#dc3545" />
          <Text style={styles.incorrectText}>Incorrect</Text>
        </View>

        <Text style={styles.question}>{quiz.question}</Text>

        <View style={styles.hintBox}>
          <View style={styles.hintHeader}>
            <Ionicons
              name="bulb-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.hintLabel}>힌트</Text>
          </View>
          <Text style={styles.hintContent}>{quiz.hint}</Text>
        </View>

        <View style={styles.optionsWrap}>
          {parsedOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionRow, getOptionStyle(index)]}
              onPress={() => !submitted && setSelected(index)}
              disabled={submitted}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{option}</Text>
              <View
                style={[
                  styles.radio,
                  selected === index && !submitted && styles.radioSelected,
                  submitted &&
                    parsedOptions[index] === quiz.correctAnswer &&
                    styles.radioCorrect,
                  submitted &&
                    selected === index &&
                    !isCorrect &&
                    styles.radioWrong,
                ]}
              >
                {selected === index && !submitted && (
                  <View style={styles.radioInner} />
                )}
                {submitted &&
                  parsedOptions[index] === quiz.correctAnswer && (
                    <View style={styles.radioInner} />
                  )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.progressText}>
          {currentIndex + 1} / {quizzes.length}
        </Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        {!submitted ? (
          <TouchableOpacity
            style={[
              styles.submitButton,
              selected === null && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={selected === null}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>제출하기 →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {currentIndex < quizzes.length - 1 ? '다음 문제 →' : '완료'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: { padding: 24, paddingBottom: 100 },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc3545',
  },

  incorrectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
  },
  incorrectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc3545',
  },

  question: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 30,
    marginBottom: 20,
  },

  hintBox: {
    backgroundColor: '#F5F9F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hintLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  hintContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },

  optionsWrap: { gap: 12, marginBottom: 20 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionDefault: { borderColor: '#E8E8E8', backgroundColor: '#FFFFFF' },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F9FAF5',
  },
  optionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  optionWrong: { borderColor: '#dc3545', backgroundColor: '#fef2f2' },
  optionText: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1 },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  radioCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  radioWrong: { borderColor: '#dc3545', backgroundColor: '#dc3545' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },

  progressText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C5D1BC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default WrongNoteQuizScreen;
