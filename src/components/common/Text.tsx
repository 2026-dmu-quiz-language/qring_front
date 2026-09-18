// src/components/common/Text.tsx
// 앱 전체가 같은 글꼴을 쓰도록 react-native 의 Text, TextInput 을 감싼 것.
// 화면에서는 'react-native' 대신 이 파일에서 Text 를 가져다 쓴다. 사용법은 똑같다.
//
// 안드로이드는 fontFamily 를 지정하면 fontWeight 를 무시한다.
// 그래서 굵기를 보고 알맞은 SUIT 파일을 직접 골라주고, fontWeight 는 떼어낸다.
// 이렇게 해야 아이폰과 갤럭시가 같은 굵기로 보인다.
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { theme } from '../../constants/theme';

/** 굵기 값에 맞는 SUIT 파일을 고른다. 불러온 굵기는 Regular, Medium, Bold 세 가지다. */
const familyFor = (weight?: TextStyle['fontWeight']): string => {
  if (weight === 'bold') return theme.fonts.headline;
  const n = Number(weight);
  if (!Number.isFinite(n)) return theme.fonts.body;
  if (n >= 700) return theme.fonts.headline;
  if (n >= 500) return theme.fonts.label;
  return theme.fonts.body;
};

/** 넘어온 스타일에서 fontWeight 를 떼고 그 굵기에 맞는 글꼴을 끼워 넣는다. */
const withFont = (style: any) => {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, ...rest } = flat;
  return [rest, { fontFamily: flat.fontFamily ?? familyFor(fontWeight) }];
};

export const Text = forwardRef<RNText, TextProps>(({ style, ...props }, ref) => (
  <RNText ref={ref} style={withFont(style)} {...props} />
));
Text.displayName = 'Text';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ style, ...props }, ref) => <RNTextInput ref={ref} style={withFont(style)} {...props} />,
);
TextInput.displayName = 'TextInput';
