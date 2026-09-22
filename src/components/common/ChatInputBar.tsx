// src/components/common/ChatInputBar.tsx
// 채팅 화면 하단 메시지 바. 학습 채팅과 스토리 대화가 같이 쓴다.
// 모양은 알약 입력칸 안에 왼쪽 + 버튼, 가운데 입력칸, 오른쪽 전송 버튼이 들어가는 구조다.
import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Text, TextInput } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useKeyboardVisible } from '../../utils/useKeyboardVisible';

const PLACEHOLDER = '메시지 입력';

const COLORS = {
  // 바 뒤는 비워서 화면 배경이 그대로 보이게 하고, 알약만 흰색으로 띄운다.
  pillBackground: theme.colors.surface,
  // 흰 알약과도, 베이지 화면 배경과도 구분되는 연한 초록. 스토리 보관함의 + 동그라미와 같은 색이다.
  plusBackground: theme.colors.greenChip,
  // 전송 버튼과 같은 초록으로 맞춘다.
  plusIcon: theme.colors.primary,
  text: theme.colors.text,
  placeholder: theme.colors.textHint,
  sendBackground: theme.colors.primary,
};

interface ChatInputBarProps {
  /** 입력이 안 되는 모양만 있는 바. 학습 채팅처럼 실제로 입력하지 않는 화면에서 쓴다. */
  readOnly?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  /** 입력칸을 막는다. 대화가 끝났을 때 등에 쓴다. */
  editable?: boolean;
  /** 전송 중이면 전송 버튼에 로딩 표시를 한다. */
  sending?: boolean;
  maxLength?: number;
}

export const ChatInputBar = ({
  readOnly = false,
  value = '',
  onChangeText,
  onSend,
  editable = true,
  sending = false,
  maxLength = 300,
}: ChatInputBarProps) => {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  // 알약은 아이폰 홈 인디케이터와 갤럭시 하단 바 위로 올라온다.
  // 키보드가 떠 있으면 키보드가 그 영역을 덮으므로 인셋을 더하지 않는다. 더하면 키보드와 바 사이가 벌어진다.
  const bottomPadding = 8 + (keyboardVisible ? 0 : insets.bottom);

  const canSend = !readOnly && editable && !sending && value.trim().length > 0;

  return (
    <View style={[styles.bar, { paddingBottom: bottomPadding }]}>
      <View style={styles.pill}>
        {/* + 버튼은 기능 없이 모양만 둔다 */}
        <View style={styles.plusButton}>
          <Ionicons name="add" size={22} color={COLORS.plusIcon} />
        </View>

        {readOnly ? (
          <Text style={[styles.input, styles.placeholderText]} numberOfLines={1}>
            {PLACEHOLDER}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={PLACEHOLDER}
            placeholderTextColor={COLORS.placeholder}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={() => canSend && onSend?.()}
            editable={editable && !sending}
            returnKeyType="send"
            maxLength={maxLength}
          />
        )}

        <TouchableOpacity
          style={[styles.sendButton, !readOnly && !canSend && !sending && styles.sendButtonDisabled]}
          onPress={() => canSend && onSend?.()}
          disabled={readOnly || !canSend}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <Ionicons name="send" size={16} color={theme.colors.surface} style={styles.sendIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PILL_BUTTON_SIZE = 36;

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pillBackground,
    borderRadius: 24,
    padding: 6,
    minHeight: 48,
  },
  plusButton: {
    width: PILL_BUTTON_SIZE,
    height: PILL_BUTTON_SIZE,
    borderRadius: PILL_BUTTON_SIZE / 2,
    backgroundColor: COLORS.plusBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingHorizontal: 12,
    // 안드로이드 입력칸 기본 위아래 여백이 커서 알약 높이가 들쭉날쭉해지지 않게 맞춘다.
    paddingVertical: 8,
    maxHeight: 100,
  },
  placeholderText: {
    color: COLORS.placeholder,
  },
  sendButton: {
    width: PILL_BUTTON_SIZE,
    height: PILL_BUTTON_SIZE,
    borderRadius: PILL_BUTTON_SIZE / 2,
    backgroundColor: COLORS.sendBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // 종이비행기 아이콘은 무게중심이 왼쪽이라 살짝 오른쪽으로 옮겨야 가운데로 보인다.
  sendIcon: {
    marginLeft: 2,
  },
});
