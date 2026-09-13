// src/constants/layout.ts
// 여러 화면이 함께 맞춰야 하는 레이아웃 치수.
import { Platform } from 'react-native';

/** 하단 탭바 높이 */
export const TAB_BAR_HEIGHT = 72;

/** 하단 탭바를 화면 바닥에서 띄우는 거리 */
export const TAB_BAR_BOTTOM_OFFSET = Platform.OS === 'ios' ? 32 : 22;

/** 스크롤을 끝까지 내렸을 때 마지막 콘텐츠와 탭바 사이에 남길 틈 */
const TAB_BAR_GAP = 24;

/**
 * 탭바는 화면 위에 떠 있어서 콘텐츠를 가린다.
 * 탭 화면의 스크롤 콘텐츠 끝에 이만큼 비워둬야 마지막 요소가 탭바 뒤로 숨지 않는다.
 */
export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_OFFSET + TAB_BAR_GAP;
