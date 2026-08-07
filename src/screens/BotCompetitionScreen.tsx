import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { BOT_CONFIG, getBotSolveTime, type QuizType } from '../constants/botConfig';
import {
  pauseBotMatch,
  submitBotMatchResult,
  type BotQuestion,
  type BotMatchAnswer,
  type BotMatchResultResponse,
} from '../api/competition';

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
  wrong: '#dc3545',
};

// ─── 유틸 ───

// "[\"A\",\"B\"]" 형태의 JSON 문자열 필드 파싱
const parseJsonArray = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

// 서버 quizType → 봇 설정 키
const toBotQuizType = (quizType: BotQuestion['quizType']): QuizType => {
  if (quizType === 'multiple_choice') return 'multiple';
  if (quizType === 'subjective') return 'short';
  return 'wordCombo';
};

const normalize = (s: string) => s.trim().toLowerCase();

type RoundWinner = 'user' | 'bot' | 'none';

type MatchPhase = 'playing' | 'submitting' | 'done' | 'submitError';

const BotCompetitionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any>>();
  const { questions = [] } = (route.params ?? {}) as {
    matchId?: number;
    questions?: BotQuestion[];
    remainingPoints?: number;
    botLevel?: string;
  };

  const total = questions.length;
  const winTarget = Math.floor(total / 2) + 1; // 과반수 (21문제 → 11)

  // ─── 매치 전체 상태 ───
  const [index, setIndex] = useState(0);
  const [myWins, setMyWins] = useState(0);
  const [botWins, setBotWins] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>('playing');
  const [result, setResult] = useState<BotMatchResultResponse | null>(null);

  const answersRef = useRef<BotMatchAnswer[]>([]);
  const streakRef = useRef({ current: 0, max: 0 });
  const penaltyRef = useRef(0); // 유저 오답 누적으로 봇이 빨라진 초
  const myWinsRef = useRef(0);
  const botWinsRef = useRef(0);

  // ─── 라운드 상태 ───
  const [roundWinner, setRoundWinner] = useState<RoundWinner | null>(null);
  const [userFailed, setUserFailed] = useState(false); // 유저가 오답 제출 후 봇을 기다리는 중
  const [botFailed, setBotFailed] = useState(false); // 봇이 먼저 끝났는데 틀림
  const [botProgress, setBotProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const pausedRef = useRef(false);
  const resolvedRef = useRef(false);
  const userFailedRef = useRef(false);
  const lastUserAnswerRef = useRef('');

  // ─── 입력 상태 ───
  const [selected, setSelected] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [placed, setPlaced] = useState<number[]>([]);

  const quiz: BotQuestion | undefined = questions[index];
  const section = Math.floor(index / BOT_CONFIG.questionsPerSection) + 1;

  // ─── 문제 데이터 파싱 ───
  const options = useMemo(
    () => (quiz ? parseJsonArray(quiz.options) : []),
    [quiz],
  );
  const answerTiles = useMemo(
    () => (quiz ? parseJsonArray(quiz.answerTiles) : []),
    [quiz],
  );
  const wordBank = useMemo(() => {
    if (!quiz || quiz.quizType !== 'word_arrange') return [];
    let tiles = parseJsonArray(quiz.tiles);
    if (tiles.length === 0) {
      tiles = [...answerTiles, ...parseJsonArray(quiz.distractorTiles)];
    }
    return [...tiles].sort(() => Math.random() - 0.5);
  }, [quiz, answerTiles]);
  const acceptableAnswers = useMemo(
    () => (quiz ? parseJsonArray(quiz.acceptableAnswers).map(normalize) : []),
    [quiz],
  );

  // ─── 라운드 종료 처리 ───
  const resolveRound = (winner: RoundWinner) => {
    if (resolvedRef.current || !quiz) return;
    resolvedRef.current = true;
    setRoundWinner(winner);

    const userIsCorrect = winner === 'user';
    answersRef.current.push({
      sourceType: quiz.sourceType,
      sourceQuizContentId: quiz.sourceQuizContentId,
      roundNo: index + 1,
      userAnswer: lastUserAnswerRef.current,
      userIsCorrect,
      botIsCorrect: quiz.botIsCorrect,
    });

    // 최대 연속 정답 추적
    if (userIsCorrect) {
      streakRef.current.current += 1;
      streakRef.current.max = Math.max(streakRef.current.max, streakRef.current.current);
    } else {
      streakRef.current.current = 0;
    }

    if (winner === 'user') {
      myWinsRef.current += 1;
      setMyWins(myWinsRef.current);
    } else if (winner === 'bot') {
      botWinsRef.current += 1;
      setBotWins(botWinsRef.current);
    }

    setTimeout(() => {
      if (index < total - 1) {
        setIndex((prev) => prev + 1);
      } else {
        finishMatch();
      }
    }, 1400);
  };

  // ─── 매치 종료 → 결과 제출 ───
  const finishMatch = async () => {
    setPhase('submitting');
    try {
      console.log('📤 [봇컴피티션] 결과 제출: POST /bot/result, answers:', answersRef.current.length);
      const res = await submitBotMatchResult({
        answers: answersRef.current,
        streakCount: streakRef.current.max,
      });
      console.log('✅ [봇컴피티션] 결과 제출 성공:', JSON.stringify(res));
      setResult(res);
      setPhase('done');
    } catch (err: any) {
      console.error('❌ [봇컴피티션] 결과 제출 실패:', err.message, err.response?.data);
      setPhase('submitError');
    }
  };

  // ─── 봇 타이머: 라운드마다 리셋 ───
  useEffect(() => {
    if (!quiz || phase !== 'playing') return;

    const solveTime = getBotSolveTime(
      toBotQuizType(quiz.quizType),
      section,
      penaltyRef.current,
    );
    let remain = solveTime;
    let botDone = false;

    // 라운드 상태 초기화
    resolvedRef.current = false;
    userFailedRef.current = false;
    lastUserAnswerRef.current = '';
    setRoundWinner(null);
    setUserFailed(false);
    setBotFailed(false);
    setBotProgress(0);
    setSelected(null);
    setAnswerText('');
    setPlaced([]);

    const timer = setInterval(() => {
      if (pausedRef.current || resolvedRef.current || botDone) return;
      remain -= 0.1;
      setBotProgress(Math.min(1 - remain / solveTime, 1));
      if (remain <= 0) {
        botDone = true;
        if (quiz.botIsCorrect) {
          resolveRound('bot');
        } else if (userFailedRef.current) {
          resolveRound('none'); // 둘 다 틀림
        } else {
          setBotFailed(true); // 봇은 틀렸고 유저는 계속 도전 가능
        }
      }
    }, 100);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase]);

  const botFailedRef = useRef(false);
  useEffect(() => {
    botFailedRef.current = botFailed;
  }, [botFailed]);

  // ─── 유저 제출 ───
  const checkUserAnswer = (): { userAnswer: string; correct: boolean } => {
    if (!quiz) return { userAnswer: '', correct: false };
    if (quiz.quizType === 'multiple_choice') {
      const userAnswer = selected !== null ? options[selected] : '';
      return {
        userAnswer,
        correct:
          normalize(userAnswer) === normalize(quiz.answer) ||
          acceptableAnswers.includes(normalize(userAnswer)),
      };
    }
    if (quiz.quizType === 'subjective') {
      const userAnswer = answerText.trim();
      return {
        userAnswer,
        correct:
          normalize(userAnswer) === normalize(quiz.answer) ||
          acceptableAnswers.includes(normalize(userAnswer)),
      };
    }
    // word_arrange
    const sequence = placed.map((i) => wordBank[i]);
    const userAnswer = sequence.join(' ');
    const correct =
      answerTiles.length > 0
        ? sequence.length === answerTiles.length &&
          sequence.every((word, i) => word === answerTiles[i])
        : normalize(userAnswer) === normalize(quiz.answer);
    return { userAnswer, correct };
  };

  const canSubmit = (() => {
    if (!quiz || roundWinner !== null || userFailed || paused) return false;
    if (quiz.quizType === 'multiple_choice') return selected !== null;
    if (quiz.quizType === 'subjective') return answerText.trim().length > 0;
    return answerTiles.length > 0
      ? placed.length === answerTiles.length
      : placed.length > 0;
  })();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const { userAnswer, correct } = checkUserAnswer();
    lastUserAnswerRef.current = userAnswer;

    if (correct) {
      resolveRound('user');
      return;
    }

    // 오답: 봇이 다음 문제부터 빨라지는 페널티
    penaltyRef.current += BOT_CONFIG.wrongPenalty;
    userFailedRef.current = true;
    setUserFailed(true);

    if (botFailedRef.current) {
      resolveRound('none'); // 봇도 이미 틀린 상태면 무승부 라운드
    }
  };

  // ─── 일시정지 ───
  const handlePause = () => {
    pausedRef.current = true;
    setPaused(true);
    pauseBotMatch(true)
      .then((res) => console.log('✅ [봇컴피티션] 일시정지:', JSON.stringify(res)))
      .catch((err) => console.error('❌ [봇컴피티션] 일시정지 실패:', err.message));
  };

  const handleResume = () => {
    pausedRef.current = false;
    setPaused(false);
    pauseBotMatch(false)
      .then((res) => console.log('✅ [봇컴피티션] 재개:', JSON.stringify(res)))
      .catch((err) => console.error('❌ [봇컴피티션] 재개 실패:', err.message));
  };

  const handleQuit = () => {
    Alert.alert('대결 그만두기', '지금 나가면 진행 상황이 사라져요. 정말 나갈까요?', [
      { text: '계속하기', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: () => navigation.navigate('MainTab'),
      },
    ]);
  };

  // ─── 방어: 문제 없이 진입한 경우 ───
  if (!quiz && phase === 'playing') {
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <View style={styles.centerWrap}>
          <Text style={styles.errorText}>문제를 불러올 수 없습니다.</Text>
          <TouchableOpacity
            style={[styles.submitButton, { marginTop: 20, paddingHorizontal: 40 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.submitButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // ─── 결과 화면 ───
  if (phase !== 'playing') {
    const isWin = botWinsRef.current < winTarget && myWinsRef.current >= botWinsRef.current;
    const isDraw = myWinsRef.current === botWinsRef.current && botWinsRef.current < winTarget;
    return (
      <ScreenWrapper style={{ paddingHorizontal: 0 }}>
        <View style={styles.centerWrap}>
          {phase === 'submitting' ? (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.resultSubText}>결과 계산 중...</Text>
            </>
          ) : (
            <>
              <Text style={styles.resultEmoji}>
                {isDraw ? '🤝' : isWin ? '🏆' : '😢'}
              </Text>
              <Text style={styles.resultTitle}>
                {isDraw ? '무승부!' : isWin ? '승리!' : '패배...'}
              </Text>
              <Text style={styles.resultScore}>
                나 {myWinsRef.current} : {botWinsRef.current} Q-Bot
              </Text>

              {phase === 'done' && result && (
                <View style={styles.resultCard}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>맞힌 문제</Text>
                    <Text style={styles.resultValue}>{result.correctCount}개</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>틀린 문제</Text>
                    <Text style={styles.resultValue}>{result.wrongCount}개</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>획득 포인트</Text>
                    <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                      +{result.rewardPoint} P
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>보유 포인트</Text>
                    <Text style={styles.resultValue}>
                      {result.balanceAfter.toLocaleString()} P
                    </Text>
                  </View>
                </View>
              )}

              {phase === 'submitError' && (
                <>
                  <Text style={styles.errorText}>결과 전송에 실패했어요.</Text>
                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: 16, paddingHorizontal: 40 }]}
                    onPress={finishMatch}
                  >
                    <Text style={styles.submitButtonText}>다시 시도</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitButton, { marginTop: 24, paddingHorizontal: 60 }]}
                onPress={() => navigation.navigate('MainTab')}
              >
                <Text style={styles.submitButtonText}>돌아가기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  // ─── 라운드 배너 텍스트 ───
  const bannerText =
    roundWinner === 'user'
      ? '정답! 라운드 획득 🎉'
      : roundWinner === 'bot'
        ? `Q-Bot이 먼저 맞췄어요 😱 (정답: ${quiz.answer})`
        : roundWinner === 'none'
          ? `둘 다 놓쳤어요 😅 (정답: ${quiz.answer})`
          : null;

  const myPercent = Math.round((myWins / winTarget) * 100);
  const botPercent = Math.round((botWins / winTarget) * 100);

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topIconButton} onPress={handleQuit} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.darkGreen} />
        </TouchableOpacity>
        <Text style={styles.sectionText}>
          섹션 {section} · {index + 1}/{total}
        </Text>
        <TouchableOpacity style={styles.topIconButton} onPress={handlePause} activeOpacity={0.7}>
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
            <Text style={styles.percentText}>{myWins}승</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.myBarFill, { width: `${Math.min(myPercent, 100)}%` }]} />
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
            <Text style={styles.percentText}>{botWins}승</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.botBarFill, { width: `${Math.min(botPercent, 100)}%` }]} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 문제 카드 */}
          <View style={styles.questionCard}>
            {/* 봇 풀이 진행 */}
            <View style={styles.botTimerRow}>
              <Text style={styles.botTimerLabel}>
                {botFailed ? '🤖 Q-Bot이 틀렸어요!' : '🤖 Q-Bot 풀이 중...'}
              </Text>
              <View style={styles.botTimerTrack}>
                <View
                  style={[
                    styles.botTimerFill,
                    { width: `${Math.round(botProgress * 100)}%` },
                    botFailed && { backgroundColor: C.usedChipText },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.questionText}>
              {quiz.quizType === 'word_arrange' && quiz.korean ? quiz.korean : quiz.question}
            </Text>
            <Text style={styles.questionSub}>
              {quiz.quizType === 'multiple_choice'
                ? '알맞은 답을 선택하세요.'
                : quiz.quizType === 'subjective'
                  ? '답을 입력하세요.'
                  : '주어진 단어를 순서대로 조합하세요.'}
            </Text>

            {/* 유형별 입력 영역 */}
            {quiz.quizType === 'word_arrange' && (
              <View
                style={[
                  styles.answerArea,
                  roundWinner === 'user' && styles.answerAreaCorrect,
                  (userFailed || roundWinner === 'bot' || roundWinner === 'none') &&
                    styles.answerAreaWrong,
                ]}
              >
                {placed.map((wordIndex, orderIndex) => (
                  <TouchableOpacity
                    key={`${wordIndex}-${orderIndex}`}
                    style={styles.placedChip}
                    onPress={() => {
                      if (roundWinner !== null || userFailed) return;
                      setPlaced((prev) => prev.filter((_, i) => i !== orderIndex));
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.placedChipText}>{wordBank[wordIndex]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {quiz.quizType === 'multiple_choice' && (
              <View style={styles.optionsWrap}>
                {options.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionRow,
                      selected === i && styles.optionSelected,
                      roundWinner !== null &&
                        normalize(option) === normalize(quiz.answer) &&
                        styles.optionCorrect,
                    ]}
                    onPress={() => {
                      if (roundWinner !== null || userFailed) return;
                      setSelected(i);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {quiz.quizType === 'subjective' && (
              <TextInput
                style={[
                  styles.textInput,
                  roundWinner === 'user' && styles.textInputCorrect,
                  (userFailed || roundWinner === 'bot' || roundWinner === 'none') &&
                    styles.textInputWrong,
                ]}
                placeholder="답을 입력하세요"
                placeholderTextColor="#aaa"
                value={answerText}
                onChangeText={setAnswerText}
                editable={roundWinner === null && !userFailed && !paused}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

            {/* 라운드 결과 / 대기 배너 */}
            {bannerText && (
              <Text
                style={[
                  styles.feedbackText,
                  roundWinner === 'user' ? styles.feedbackCorrect : styles.feedbackWrong,
                ]}
              >
                {bannerText}
              </Text>
            )}
            {userFailed && roundWinner === null && (
              <Text style={[styles.feedbackText, styles.feedbackWrong]}>
                아쉬워요! Q-Bot이 다 풀 때까지 기다려요...
              </Text>
            )}
          </View>

          {/* 단어 보기 (word_arrange 전용) */}
          {quiz.quizType === 'word_arrange' && (
            <View style={styles.wordBank}>
              {wordBank.map((word, i) => {
                const used = placed.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.bankChip, used && styles.bankChipUsed]}
                    onPress={() => {
                      if (roundWinner !== null || userFailed || used) return;
                      setPlaced((prev) => [...prev, i]);
                    }}
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
          )}
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
      </KeyboardAvoidingView>

      {/* 일시정지 오버레이 */}
      <Modal visible={paused} transparent animationType="fade" onRequestClose={handleResume}>
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseBox}>
            <Ionicons name="pause-circle" size={48} color={theme.colors.primary} />
            <Text style={styles.pauseTitle}>일시정지</Text>
            <Text style={styles.pauseDesc}>Q-Bot도 잠시 쉬는 중이에요</Text>
            <TouchableOpacity
              style={[styles.submitButton, { alignSelf: 'stretch', marginTop: 20 }]}
              onPress={handleResume}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>계속하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={handleQuit} activeOpacity={0.7}>
              <Text style={styles.quitButtonText}>그만두기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.wrong,
  },

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
  sectionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
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
    paddingVertical: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  botTimerRow: {
    marginBottom: 18,
  },
  botTimerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    marginBottom: 6,
  },
  botTimerTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0F1E8',
    overflow: 'hidden',
  },
  botTimerFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: C.botBarFill,
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
    borderColor: C.wrong,
    backgroundColor: C.wrong + '10',
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

  // 객관식
  optionsWrap: { gap: 10 },
  optionRow: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  optionSelected: {
    borderColor: C.chipGreen,
    backgroundColor: '#F9FAF5',
  },
  optionCorrect: {
    borderColor: C.chipGreen,
    backgroundColor: C.chipGreen + '15',
  },
  optionText: { fontSize: 15, fontWeight: '600', color: '#333' },

  // 주관식
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textInputCorrect: {
    borderColor: C.chipGreen,
    backgroundColor: C.chipGreen + '15',
  },
  textInputWrong: {
    borderColor: C.wrong,
    backgroundColor: '#fef2f2',
  },

  feedbackText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackCorrect: { color: C.chipGreen },
  feedbackWrong: { color: C.wrong },

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

  // 결과 화면
  resultEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
    marginBottom: 20,
  },
  resultSubText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  resultCard: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 18,
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a1a',
  },

  // 일시정지
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pauseBox: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 10,
  },
  pauseDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
    marginTop: 4,
  },
  quitButton: {
    marginTop: 14,
    paddingVertical: 6,
  },
  quitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
});

export default BotCompetitionScreen;
