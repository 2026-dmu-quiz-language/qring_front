// src/utils/sfx.ts
// 앱 전체에서 쓰는 효과음 모듈.
// 소리마다 플레이어를 한 번만 만들어 두고 계속 재사용한다.
// 화면 안에서 만들면 화면이 새로 그려질 때마다 파일을 다시 읽어 첫 소리가 늦게 난다.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// 번들러는 경로가 코드에 그대로 적힌 파일만 앱에 포함한다.
// 변수로 경로를 조합하면 파일이 빠지므로 소리마다 한 줄씩 적어야 한다.
const SOURCES = {
  touch: require('../../assets/sounds/touch.mp3'),
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

/** 효과음 켜기, 끄기. 나중에 학습 설정 화면에서 연결한다. */
export const setSfxEnabled = (value: boolean) => {
  enabled = value;
};

export const isSfxEnabled = () => enabled;

/** 효과음 재생. 실패해도 화면 동작을 막지 않는다. */
export const playSfx = (name: SfxName) => {
  if (!enabled) return;

  ensureAudioMode();

  const player = getPlayer(name);
  if (!player) return;

  // 재생이 끝난 플레이어는 위치가 끝에 멈춰 있다.
  // 처음으로 되돌리지 않고 play()만 하면 두 번째부터 소리가 나지 않는다.
  player
    .seekTo(0)
    .then(() => player.play())
    .catch((err) => {
      console.log('[sfx] 재생 실패:', name, err);
    });
};

/** 앱 시작 시 미리 불러두면 첫 재생이 늦지 않다. */
export const preloadSfx = () => {
  ensureAudioMode();
  (Object.keys(SOURCES) as SfxName[]).forEach(getPlayer);
};
