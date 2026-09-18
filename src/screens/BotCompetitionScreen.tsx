import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput } from '../components/common/Text';
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
import { playSfx, playLoopSfx, stopSfx } from '../utils/sfx';
import { AppModal } from '../components/common/AppModal';
import { showConfirm } from '../components/common/AlertHost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  darkGreen: theme.colors.primary,
  chipGreen: theme.colors.primary,
  chipGreenShadow: theme.colors.primary,
  barTrack: theme.colors.greenChip,
  botBarFill: '#D3E3A6',
  usedChipBg: theme.colors.greenChip,
  usedChipText: theme.colors.greenMutedLight,
  dashedBorder: theme.colors.greenBorder,
  buttonBg: theme.colors.tertiary,
  buttonText: theme.colors.surfaceAlt,
  vsBg: '#EDE5D2',
  vsText: theme.colors.tertiary,
  wrong: theme.colors.danger,
};

const parseJsonArray = (value: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const toBotQuizType = (quizType: BotQuestion['quizType']): QuizType => {
  if (quizType === 'multiple_choice') return 'multiple';
  if (quizType === 'subjective') return 'short';
  return 'wordCombo';
};

const normalize = (s: string) => s.trim().toLowerCase();

type RoundWinner = 'user' | 'bot';

type MatchPhase = 'playing' | 'submitting' | 'done' | 'submitError';

const BotCompetitionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<any>>();

  // 하단 정답 확인 버튼이 아이폰 홈 인디케이터와 갤럭시 하단 바에 가리지 않도록 그 높이만큼 올린다.
  const insets = useSafeAreaInsets();
  const bottomBarPadding = Math.max(28, insets.bottom + 12);
  const { questions = [] } = (route.params ?? {}) as {
    matchId?: number;
    questions?: BotQuestion[];
    remainingPoints?: number;
    botLevel?: string;
  };

  const total = questions.length;
  const winTarget = Math.floor(total / 2) + 1; 

  const [index, setIndex] = useState(0);
  const [myWins, setMyWins] = useState(0);
  const [botWins, setBotWins] = useState(0);
  const [phase, setPhase] = useState<MatchPhase>('playing');
  const [result, setResult] = useState<BotMatchResultResponse | null>(null);

  const answersRef = useRef<BotMatchAnswer[]>([]);
  const myWinsRef = useRef(0);
  const botWinsRef = useRef(0);

  const [roundWinner, setRoundWinner] = useState<RoundWinner | null>(null);
  const [lostByWrong, setLostByWrong] = useState(false); 
  const [wrongFlash, setWrongFlash] = useState(false); 
  const [botProgress, setBotProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const pausedRef = useRef(false);
  const resolvedRef = useRef(false);
  const roundRemainRef = useRef(0); 
  const roundTotalRef = useRef(0);
  const lastUserAnswerRef = useRef('');

  const [selected, setSelected] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [placed, setPlaced] = useState<number[]>([]);

  const quiz: BotQuestion | undefined = questions[index];
  const section = Math.floor(index / BOT_CONFIG.questionsPerSection) + 1;

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

  const resolveRound = (winner: RoundWinner) => {
    if (resolvedRef.current || !quiz) return;
    resolvedRef.current = true;
    setRoundWinner(winner);

    stopSfx('timer');
    if (winner === 'user') {
      playSfx('correct');
    } else {
    }

    const userIsCorrect = winner === 'user';
    answersRef.current.push({
      sourceType: quiz.sourceType,
      sourceQuizContentId: quiz.sourceQuizContentId,
      roundNo: index + 1,
      userAnswer: lastUserAnswerRef.current,
      userIsCorrect,
      botIsCorrect: quiz.botIsCorrect,
    });

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

  const finishMatch = async () => {
    setPhase('submitting');
    try {
      console.log('📤 [봇컴피티션] 결과 제출: POST /bot/result, answers:', answersRef.current.length);
      const res = await submitBotMatchResult({
        answers: answersRef.current,
      });
      console.log('✅ [봇컴피티션] 결과 제출 성공:', JSON.stringify(res));
      setResult(res);
      setPhase('done');
      playSfx('result');
    } catch (err: any) {
      console.error('❌ [봇컴피티션] 결과 제출 실패:', err.message, err.response?.data);
      setPhase('submitError');
    }
  };

  useEffect(() => {
    if (!quiz || phase !== 'playing') return;

    const solveTime = getBotSolveTime(toBotQuizType(quiz.quizType), section);
    roundTotalRef.current = solveTime;
    roundRemainRef.current = solveTime;

    resolvedRef.current = false;
    lastUserAnswerRef.current = '';
    setRoundWinner(null);
    setLostByWrong(false);
    setWrongFlash(false);
    setBotProgress(0);
    setSelected(null);
    setAnswerText('');
    setPlaced([]);

    playLoopSfx('timer');

    const timer = setInterval(() => {
      if (pausedRef.current || resolvedRef.current) return;
      roundRemainRef.current -= 0.1;
      setBotProgress(Math.min(1 - roundRemainRef.current / roundTotalRef.current, 1));
      if (roundRemainRef.current <= 0) {
        resolveRound('bot'); 
      }
    }, 100);

    return () => {
      clearInterval(timer);
      stopSfx('timer');
    };
  }, [index, phase]);

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
    if (!quiz || roundWinner !== null || paused) return false;
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

    if (quiz?.quizType === 'multiple_choice') {
      setLostByWrong(true);
      resolveRound('bot');
      return;
    }

    roundRemainRef.current -= BOT_CONFIG.wrongPenalty;
    if (roundRemainRef.current <= 0) {
      setLostByWrong(true);
      resolveRound('bot');
      return;
    }
    setBotProgress(Math.min(1 - roundRemainRef.current / roundTotalRef.current, 1));
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 1500);
  };

  const handlePause = () => {
    pausedRef.current = true;
    setPaused(true);
    stopSfx('timer');
    pauseBotMatch(true)
      .then((res) => console.log('✅ [봇컴피티션] 일시정지:', JSON.stringify(res)))
      .catch((err) => console.error('❌ [봇컴피티션] 일시정지 실패:', err.message));
  };

  const handleResume = () => {
    pausedRef.current = false;
    setPaused(false);
    if (!resolvedRef.current) playLoopSfx('timer');
    pauseBotMatch(false)
      .then((res) => console.log('✅ [봇컴피티션] 재개:', JSON.stringify(res)))
      .catch((err) => console.error('❌ [봇컴피티션] 재개 실패:', err.message));
  };

  const handleQuit = async () => {
    // 확인창이 일시정지 창 위에 겹쳐 뜨지 않도록 일시정지 창을 먼저 닫는다.
    // pausedRef 는 true 로 두므로 라운드 타이머는 계속 멈춰 있다.
    setPaused(false);

    const isConfirmed = await showConfirm({
      title: '대결 그만두기',
      message: '지금 나가면 진행 상황이 사라지고 포인트는 돌려받을 수 없어요. 정말 나갈까요?',
      confirmText: '나가기',
      cancelText: '계속하기',
      destructive: true,
    });

    if (isConfirmed) {
      pausedRef.current = false;
      navigation.navigate('MainTab');
    } else {
      setPaused(true); // 계속하기를 골랐으면 일시정지 화면으로 돌아온다
    }
  };

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

  if (phase !== 'playing') {
    const isWin = myWinsRef.current > botWinsRef.current;
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
              <Text style={styles.resultEmoji}>{isWin ? '🏆' : '😢'}</Text>
              <Text style={styles.resultTitle}>{isWin ? '승리!' : '패배...'}</Text>
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

  const bannerText =
    roundWinner === 'user'
      ? '정답! 라운드 획득 🎉'
      : roundWinner === 'bot'
        ? lostByWrong
          ? `오답! Q-Bot이 라운드를 가져갔어요 😢 (정답: ${quiz.answer})`
          : `Q-Bot이 먼저 풀었어요 ⏰ (정답: ${quiz.answer})`
        : null;

  const myPercent = Math.round((myWins / winTarget) * 100);
  const botPercent = Math.round((botWins / winTarget) * 100);

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <View style={styles.topBar}>
        {/* 🌟 아이콘을 빼고, 중앙 텍스트 균형을 위해 빈 View만 남겨둡니다. */}
        <View style={styles.topIconButton} />
        
        <Text style={styles.sectionText}>
          섹션 {section} · {index + 1}/{total}
        </Text>
        
        <TouchableOpacity style={styles.topIconButton} onPress={handlePause} activeOpacity={0.7}>
          <Ionicons name="pause" size={22} color={C.darkGreen} />
        </TouchableOpacity>
      </View>

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
        // 안드로이드는 엣지 투 엣지라 운영체제가 화면을 줄여주지 않으므로 직접 밀어 올린다.
        behavior="padding"
        // 이 영역 위에 점수판이 있어서, 화면 틀이 시작되는 상단 인셋만큼 보정한다.
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : insets.top}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.questionCard}>
            <View style={styles.botTimerRow}>
              <Text style={styles.botTimerLabel}>🤖 Q-Bot 풀이 중...</Text>
              <View style={styles.botTimerTrack}>
                <View
                  style={[
                    styles.botTimerFill,
                    { width: `${Math.round(botProgress * 100)}%` },
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

            {quiz.quizType === 'word_arrange' && (
              <View
                style={[
                  styles.answerArea,
                  roundWinner === 'user' && styles.answerAreaCorrect,
                  (wrongFlash || roundWinner === 'bot') && styles.answerAreaWrong,
                ]}
              >
                {placed.map((wordIndex, orderIndex) => (
                  <TouchableOpacity
                    key={`${wordIndex}-${orderIndex}`}
                    style={styles.placedChip}
                    onPress={() => {
                      if (roundWinner !== null) return;
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
                      if (roundWinner !== null) return;
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
                  (wrongFlash || roundWinner === 'bot') && styles.textInputWrong,
                ]}
                placeholder="답을 입력하세요"
                placeholderTextColor={theme.colors.textHint}
                value={answerText}
                onChangeText={setAnswerText}
                editable={roundWinner === null && !paused}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

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
            {wrongFlash && roundWinner === null && (
              <Text style={[styles.feedbackText, styles.feedbackWrong]}>
                오답! Q-Bot이 {BOT_CONFIG.wrongPenalty}초 앞서갔어요 ⚡
              </Text>
            )}
          </View>

          {quiz.quizType === 'word_arrange' && (
            <View style={styles.wordBank}>
              {wordBank.map((word, i) => {
                const used = placed.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.bankChip, used && styles.bankChipUsed]}
                    onPress={() => {
                      if (roundWinner !== null || used) return;
                      playSfx('combine');
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
      </KeyboardAvoidingView>

      {/* 정답 확인 버튼은 키보드 회피 영역 밖에 둔다.
          주관식 입력 중에는 문제와 입력창만 키보드 위로 올라가고, 버튼은 제자리에서 키보드에 가려진다. */}
      <View style={[styles.bottomBar, { paddingBottom: bottomBarPadding }]}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>정답 확인</Text>
        </TouchableOpacity>
      </View>

      <AppModal
        visible={paused}
        icon="pause-circle"
        title="일시정지"
        message="Q-Bot도 잠시 쉬는 중이에요"
        onRequestClose={handleResume}
        buttons={[
          { text: '계속하기', onPress: handleResume },
          { text: '그만두기', variant: 'text', onPress: handleQuit },
        ]}
      />
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
    paddingHorizontal: 18, 
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
    color: theme.colors.textMuted,
  },

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
    borderColor: theme.colors.greenChip,
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
    color: theme.colors.textStrong,
  },
  botName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSub,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textHint,
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

  questionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.textHint,
    marginBottom: 6,
  },
  botTimerTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceAlt,
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
    color: theme.colors.textStrong,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSub: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.greenMutedLight,
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

  optionsWrap: { gap: 10 },
  optionRow: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionSelected: {
    borderColor: C.chipGreen,
    backgroundColor: theme.colors.surfaceAlt,
  },
  optionCorrect: {
    borderColor: C.chipGreen,
    backgroundColor: C.chipGreen + '15',
  },
  optionText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },

  textInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textInputCorrect: {
    borderColor: C.chipGreen,
    backgroundColor: C.chipGreen + '15',
  },
  textInputWrong: {
    borderColor: C.wrong,
    backgroundColor: theme.colors.dangerSurface,
  },

  feedbackText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackCorrect: { color: C.chipGreen },
  feedbackWrong: { color: C.wrong },

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
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.text,
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

  resultEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textStrong,
    marginBottom: 6,
  },
  resultScore: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 20,
  },
  resultSubText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
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
    color: theme.colors.textMuted,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textStrong,
  },

});

export default BotCompetitionScreen;