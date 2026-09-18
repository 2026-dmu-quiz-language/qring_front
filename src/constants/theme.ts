export const theme = {
  colors: {
    // ── 브랜드 ──
    primary: '#6F9F63',
    secondary: '#AAB87B',
    tertiary: '#B7A07A',

    // ── 초록 계열 표면과 보조 글자 ──
    titleGreen: '#2C3A29',  // 카드 제목. 흰 배경 대비 12:1 이라 primary 로 바꾸면 안 된다
    greenMuted: '#6B7A68',
    darkGreen: '#3C6933',
    lightGreen: '#F5F4E6',
    greenMutedLight: '#A0A89C',
    greenBorder: '#C5D1BC',
    greenChip: '#E0E8D5',  // 칩·구분선
    greenTint: '#EDF7E6',  // 아이콘 원형 배경

    // ── 배경과 표면 ──
    background: '#E9E9DB',  // 앱 공통 배경
    surface: '#FFFFFF',  // 카드·버튼 배경
    surfaceAlt: '#F3F4EB',  // 입력칸 등 살짝 어두운 표면
    headerIconBackground: '#F0F2EE',  // 뒤로가기 버튼 배경

    // ── 글자 (진한 순서) ──
    textStrong: '#1A1A1A',
    text: '#333333',
    textSub: '#555555',
    textMuted: '#888888',
    textHint: '#999999',
    textDisabled: '#CCCCCC',  // 비활성 상태

    // ── 선과 그림자 ──
    border: '#E8E8E8',
    shadow: '#000000',  // shadowColor 전용

    // ── 의미색 ──
    danger: '#DC3545',
    dangerSoft: '#E57373',
    dangerSurface: '#FEF2F2',

    // ── 포인트 ──
    lightPeach: '#F6D3BF',
    gold: '#FFD700',
    goldDark: '#8B6508',

    // 예전 코드가 쓰던 이름. surface 와 같은 값이다.
    white: '#FFFFFF',
  },
  fonts: {
    // assets/fonts 의 파일명과 같아야 한다. App.tsx 에서 이 이름으로 불러온다.
    // 안드로이드는 fontFamily 를 주면 fontWeight 를 무시하므로, 굵기는 파일로 나눠 쓴다.
    headline: 'SUIT-Bold',
    body: 'SUIT-Regular',
    label: 'SUIT-Medium',
  }
};
