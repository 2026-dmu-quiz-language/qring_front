import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput } from '../components/common/Text';
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
  type IncorrectResultItem,
  type IncorrectSourceType,
} from '../api/incorrect';
import { playSfx } from '../utils/sfx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** 서버가 JSON 문자열로도, 배열로도, null 로도 보내와서 전부 받아낸다. */
const parseWords = (value: string | string[] | null | undefined): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const WrongNoteQuizScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any>>();

  // 하단 버튼이 아이폰 홈 인디케이터와 갤럭시 하단 바에 가리지 않도록 그 높이만큼 올린다.
  // 인셋이 작은 기기에서는 기존 여백 32를 유지한다.
  const insets = useSafeAreaInsets();
  const bottomBarPadding = Math.max(32, insets.bottom + 12);
  const { sourceType, episodeId } = route.params as {
    /** 묶음 종류. STORY 면 스토리 한 편, COMPETITION 이면 레벨 하나 */
    sourceType: IncorrectSourceType;
    /** STORY 면 콘텐츠 id, COMPETITION 이면 레벨 번호 */
    episodeId: number;
    episodeTitle: string;
  };

  const [quizzes, setQuizzes] = useState<IncorrectQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  // 단어 배열 문제에서 고른 단어들의 순서. options 의 인덱스를 담는다.
  const [placed, setPlaced] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<IncorrectResultItem[]>([]);
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('📤 [오답풀이] API 호출 시작: POST /incorrect/retry,', sourceType, episodeId);
      try {
        const data = await getIncorrectRetry(sourceType, episodeId);
        console.log('✅ [오답풀이] API 응답 성공:', JSON.stringify(data));
        setQuizzes(data);
      } catch (err: any) {
        console.error('❌ [오답풀이] API 호출 실패:', err.message);
        if (err.response) {
          console.error('❌ [오답풀이] 서버 응답:', err.response.status, JSON.stringify(err.response.data));
        }
        setError('오답 문제를 불러올 수 없습니다.');
      } finally {
        console.log('📋 [오답풀이] 로딩 완료');
        setLoading(false);
      }
    };
    fetchData();
  }, [sourceType, episodeId]);

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

  if (completed !== null) {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <Header title="오답 풀이" leftType="none" rightType="none" />
        <View style={styles.centerWrap}>
          <Ionicons name="checkmark-circle" size={64} color={theme.colors.primary} />
          <Text style={styles.completedTitle}>오답 풀이 완료!</Text>
          {completed >= 0 && (
            <Text style={styles.completedScore}>총점: {completed}</Text>
          )}
        </View>
        <View style={[styles.bottomBar, { paddingBottom: bottomBarPadding }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => navigation.navigate('MainTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const quiz = quizzes[currentIndex];

  const parsedOptions: string[] = parseWords(quiz.options);
  const isSubjective = quiz.quizType === 'subjective';
  // 봇 컴피티션에서 넘어온 단어 배열 문제
  const isWordArrange = quiz.quizType === 'word_arrange';

  // 화면에 뿌릴 단어들. 서버가 이미 섞어서 tiles 로 준다.
  const answerTiles = parseWords(quiz.answerTiles);
  const tiles = parseWords(quiz.tiles);
  const wordBank = tiles.length > 0
    ? tiles
    : [...answerTiles, ...parseWords(quiz.distractorTiles)];

  // 단어 배열 문제는 안내문 대신 한국어 문장을 보여준다.
  const questionText = isWordArrange && quiz.korean ? quiz.korean : quiz.question;

  // 고른 단어를 순서대로 이어 붙인 답
  const arranged = placed.map((i) => wordBank[i]);

  const normalize = (v: string) => v.trim().toLowerCase();

  const isCorrect = isWordArrange
    ? answerTiles.length > 0
      // 정답 순서가 오면 그 순서와 정확히 같은지 본다.
      ? arranged.length === answerTiles.length &&
        arranged.every((word, i) => word === answerTiles[i])
      : normalize(arranged.join(' ')) === normalize(quiz.correctAnswer)
    : isSubjective
      ? normalize(answer) === normalize(quiz.correctAnswer)
      : selected !== null && parsedOptions[selected] === quiz.correctAnswer;

  const canSubmit = isWordArrange
    ? placed.length > 0
    : isSubjective
      ? answer.trim().length > 0
      : selected !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    if (isCorrect) {
      playSfx('correct');
    } else {
      // 오답음 파일이 준비되면 여기에 playSfx('incorrect')를 넣으면 된다.
    }
    setResults((prev) => [
      ...prev,
      {
        quizContentId: quiz.quizContentId,
        correct: isCorrect,
        // 이 문제가 원래 어디 것이었는지. 서버가 지울 오답 기록을 찾는 데 쓴다.
        originSourceType: quiz.sourceType,
      },
    ]);
  };

  const handleNext = async () => {
    console.log('🔥 [handleNext] 호출됨, currentIndex:', currentIndex, 'quizzes.length:', quizzes.length);
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setAnswer('');
      setPlaced([]);
      setSubmitted(false);
    } else {
      try {
        console.log('📤 [오답결과] API 호출 시작: POST /incorrect/result');
        console.log('📤 [오답결과] 전송 데이터:', JSON.stringify({ sourceType, contentId: episodeId, results }));
        const res = await submitIncorrectResult({
          sourceType,
          contentId: episodeId,
          results,
        });
        console.log('✅ [오답결과] API 응답 성공:', JSON.stringify(res));
        setCompleted(res.totalPoint);
      } catch (err: any) {
        console.error('❌ [오답결과] API 호출 실패:', err.message);
        if (err.response) {
          console.error('❌ [오답결과] 서버 응답:', err.response.status, JSON.stringify(err.response.data));
        }
        setCompleted(-1);
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // 안드로이드는 엣지 투 엣지라 운영체제가 화면을 줄여주지 않으므로 직접 밀어 올린다.
        behavior="padding"
        // 헤더가 이 영역 바깥 위쪽에 있어서, 화면 틀이 시작되는 상단 인셋만큼 보정한다.
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : insets.top}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.incorrectBadge}>
            <Ionicons name="close-circle" size={16} color={theme.colors.danger} />
            <Text style={styles.incorrectText}>Incorrect</Text>
          </View>

          <Text style={styles.question}>{questionText}</Text>

          {/* 컴피티션 전용 문제는 힌트가 없다. 빈 상자만 남지 않게 통째로 숨긴다. */}
          {quiz.hint ? (
            <View style={styles.hintBox}>
              <View style={styles.hintHeader}>
                <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.hintLabel}>힌트</Text>
              </View>
              <Text style={styles.hintContent}>{quiz.hint}</Text>
            </View>
          ) : null}

          {isWordArrange ? (
            <>
              {/* 고른 단어가 순서대로 쌓이는 곳. 누르면 다시 빼낼 수 있다. */}
              <View
                style={[
                  styles.answerArea,
                  submitted && isCorrect && styles.answerAreaCorrect,
                  submitted && !isCorrect && styles.answerAreaWrong,
                ]}
              >
                {placed.length === 0 ? (
                  <Text style={styles.answerAreaHint}>
                    아래 단어를 눌러 순서대로 배열하세요
                  </Text>
                ) : (
                  placed.map((wordIndex, orderIndex) => (
                    <TouchableOpacity
                      key={`placed-${wordIndex}-${orderIndex}`}
                      style={styles.placedChip}
                      onPress={() =>
                        !submitted &&
                        setPlaced((prev) => prev.filter((_, i) => i !== orderIndex))
                      }
                      disabled={submitted}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.placedChipText}>{wordBank[wordIndex]}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* 아직 안 쓴 단어들 */}
              <View style={styles.wordBank}>
                {wordBank.map((word, index) => {
                  const used = placed.includes(index);
                  return (
                    <TouchableOpacity
                      key={`bank-${index}`}
                      style={[styles.bankChip, used && styles.bankChipUsed]}
                      onPress={() =>
                        !submitted && !used && setPlaced((prev) => [...prev, index])
                      }
                      disabled={submitted || used}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.bankChipText, used && styles.bankChipTextUsed]}>
                        {word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {submitted && !isCorrect && (
                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctAnswerLabel}>정답</Text>
                  <Text style={styles.correctAnswerText}>{quiz.correctAnswer}</Text>
                </View>
              )}
            </>
          ) : isSubjective ? (
            <>
              <TextInput
                style={[
                  styles.textInput,
                  submitted && isCorrect && styles.textInputCorrect,
                  submitted && !isCorrect && styles.textInputWrong,
                ]}
                placeholder="답을 입력하세요"
                placeholderTextColor={theme.colors.textHint}
                value={answer}
                onChangeText={setAnswer}
                editable={!submitted}
              />
              {submitted && !isCorrect && (
                <View style={styles.correctAnswerBox}>
                  <Text style={styles.correctAnswerLabel}>정답</Text>
                  <Text style={styles.correctAnswerText}>{quiz.correctAnswer}</Text>
                </View>
              )}
            </>
          ) : (
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
          )}

          <Text style={styles.progressText}>
            {currentIndex + 1} / {quizzes.length}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 하단 버튼은 키보드 회피 영역 밖에 둔다.
          주관식 입력 중에는 문제와 입력창만 키보드 위로 올라가고, 버튼은 제자리에서 키보드에 가려진다. */}
      <View style={[styles.bottomBar, { paddingBottom: bottomBarPadding }]}>
        {!submitted ? (
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
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
    color: theme.colors.danger,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textStrong,
    marginTop: 16,
  },
  completedScore: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 8,
  },

  incorrectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: theme.colors.dangerSurface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
  },
  incorrectText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger,
  },

  question: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textStrong,
    lineHeight: 30,
    marginBottom: 20,
  },

  hintBox: {
    backgroundColor: theme.colors.greenTint,
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
    color: theme.colors.textSub,
    lineHeight: 20,
  },

  textInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: 20,
  },
  textInputCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  textInputWrong: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerSurface,
  },
  correctAnswerBox: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  correctAnswerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textStrong,
  },

  // ─ 단어 배열 ─
  answerArea: {
    minHeight: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.greenBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  answerAreaCorrect: { borderColor: theme.colors.primary, borderStyle: 'solid' },
  answerAreaWrong: { borderColor: theme.colors.danger, borderStyle: 'solid' },
  answerAreaHint: { fontSize: 13, color: theme.colors.textHint },
  placedChip: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  placedChipText: { fontSize: 14, fontWeight: '700', color: theme.colors.surface },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  bankChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.greenBorder,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bankChipUsed: { backgroundColor: theme.colors.greenChip, borderColor: theme.colors.greenChip },
  bankChipText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  bankChipTextUsed: { color: theme.colors.greenMutedLight },

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
  optionDefault: { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceAlt,
  },
  optionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  optionWrong: { borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerSurface },
  optionText: { fontSize: 15, fontWeight: '600', color: theme.colors.text, flex: 1 },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.textDisabled,
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
  radioWrong: { borderColor: theme.colors.danger, backgroundColor: theme.colors.danger },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
  },

  progressText: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.colors.textHint,
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
    backgroundColor: theme.colors.greenBorder,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.surface,
  },
});

export default WrongNoteQuizScreen;
