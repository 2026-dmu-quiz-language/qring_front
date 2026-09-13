// src/utils/sfx.ts
// 앱 전체에서 쓰는 효과음 모듈.
// 소리마다 플레이어를 한 번만 만들어 두고 계속 재사용한다.
// 화면 안에서 만들면 화면이 새로 그려질 때마다 파일을 다시 읽어 첫 소리가 늦게 난다.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 효과음 켜기, 끄기 설정을 저장하는 키.
// 나중에 배경음악 스위치가 생기면 별도 키를 쓴다.
const STORAGE_KEY = 'sfxEnabled';

// 번들러는 경로가 코드에 그대로 적힌 파일만 앱에 포함한다.
// 변수로 경로를 조합하면 파일이 빠지므로 소리마다 한 줄씩 적어야 한다.
const SOURCES = {
  /** 버튼 터치 */
  touch: require('../../assets/sounds/touch.mp3'),
  /** 퀴즈 등장 */
  quiz: require('../../assets/sounds/quiz_1.mp3'),
  /** 정답 */
  correct: require('../../assets/sounds/correct_1.mp3'),
  /** 학습 결과 화면 */
  result: require('../../assets/sounds/result.mp3'),
  /** 포인트 차감 */
  usePoints: require('../../assets/sounds/use_points.mp3'),
  /** 상대 채팅 등장 */
  receiveChat: require('../../assets/sounds/receive_chat_.mp3'),
  /** 내 채팅 전송 */
  sendChat: require('../../assets/sounds/send_chat.mp3'),
  /** 단어 조합 */
  combine: require('../../assets/sounds/combine.mp3'),
  /** 봇 대전 라운드 타이머 (반복 재생) */
  timer: require('../../assets/sounds/time_goes_on.mp3'),

  // 오답음 파일이 준비되면 아래 줄의 주석을 풀면 된다.
  // 재생 지점은 이미 각 화면에 표시해 두었다.
  // incorrect: require('../../assets/sounds/incorrect_1.mp3'),
} as const;

export type SfxName = keyof typeof SOURCES;

const players: Partial<Record<SfxName, AudioPlayer>> = {};

let enabled = true;
let audioModeReady = false;

// 오디오 모드는 앱에서 한 번만 설정하면 된다.
const ensureAudioMode = () => {
  if (audioModeReady) return;
  audioModeReady = true;

  setAudioModeAsync({
    // 효과음이므로 사용자가 듣던 음악을 멈추지 않는다.
    interruptionMode: 'mixWithOthers',
    // 아이폰 무음 스위치는 그대로 존중한다. 무음이면 효과음도 나지 않는다.
    playsInSilentMode: false,
  }).catch((err) => {
    console.log('[sfx] 오디오 모드 설정 실패:', err);
  });
};

const getPlayer = (name: SfxName): AudioPlayer | null => {
  const cached = players[name];
  if (cached) return cached;

  try {
    const player = createAudioPlayer(SOURCES[name]);
    players[name] = player;
    return player;
  } catch (err) {
    console.log('[sfx] 효과음 로딩 실패:', name, err);
    return null;
  }
};

/** 효과음 켜기, 끄기. 기기에 저장되므로 앱을 껐다 켜도 유지된다. */
export const setSfxEnabled = (value: boolean) => {
  enabled = value;
  if (!value) stopAllSfx();

  AsyncStorage.setItem(STORAGE_KEY, value ? '1' : '0').catch((err) => {
    console.log('[sfx] 설정 저장 실패:', err);
  });
};

export const isSfxEnabled = () => enabled;

/**
 * 저장된 설정을 불러온다. 앱이 켜질 때 한 번 호출한다.
 * 저장된 값이 없으면 켜짐이 기본이다.
 */
export const loadSfxSetting = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved !== null) enabled = saved === '1';
  } catch (err) {
    console.log('[sfx] 설정 불러오기 실패:', err);
  }
};

/** 한 번 울리고 끝나는 효과음. 실패해도 화면 동작을 막지 않는다. */
export const playSfx = (name: SfxName) => {
  if (!enabled) return;

  ensureAudioMode();

  const player = getPlayer(name);
  if (!player) return;

  // 재생이 끝난 플레이어는 위치가 끝에 멈춰 있다.
  // 처음으로 되돌리지 않고 play()만 하면 두 번째부터 소리가 나지 않는다.
  player.loop = false;
  player
    .seekTo(0)
    .then(() => player.play())
    .catch((err) => {
      console.log('[sfx] 재생 실패:', name, err);
    });
};

/** 멈출 때까지 반복되는 효과음. 봇 대전 타이머처럼 구간 내내 이어지는 소리에 쓴다. */
export const playLoopSfx = (name: SfxName) => {
  if (!enabled) return;

  ensureAudioMode();

  const player = getPlayer(name);
  if (!player) return;

  player.loop = true;
  player
    .seekTo(0)
    .then(() => player.play())
    .catch((err) => {
      console.log('[sfx] 반복 재생 실패:', name, err);
    });
};

/** 재생 중인 효과음을 멈추고 처음으로 되돌린다. */
export const stopSfx = (name: SfxName) => {
  const player = players[name];
  if (!player) return;

  try {
    player.pause();
    player.seekTo(0).catch(() => {});
  } catch (err) {
    console.log('[sfx] 정지 실패:', name, err);
  }
};

/** 화면을 벗어나거나 효과음을 끌 때 전부 멈춘다. */
export const stopAllSfx = () => {
  (Object.keys(players) as SfxName[]).forEach(stopSfx);
};

/** 앱 시작 시 미리 불러두면 첫 재생이 늦지 않다. */
export const preloadSfx = () => {
  ensureAudioMode();
  (Object.keys(SOURCES) as SfxName[]).forEach(getPlayer);
};
