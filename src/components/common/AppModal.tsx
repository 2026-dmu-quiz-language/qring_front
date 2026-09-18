// src/components/common/AppModal.tsx
// 앱 공통 알림창. OS 기본 다이얼로그(Alert.alert) 대신 이 모양으로 통일한다.
// 디자인 기준은 학습 화면(ChatLearnScreen)의 퀴즈 결과 모달이다.
//
// 이 파일은 보여주기만 한다. 화면 흐름 중간에서 알림을 띄우고 답을 기다리려면
// AlertHost의 showAlert, showConfirm을 쓰면 된다.
import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

/** primary: 초록 채움 / danger: 빨강 채움(되돌릴 수 없는 동작) / text: 회색 글씨만 */
export type ModalButtonVariant = 'primary' | 'danger' | 'text';

export interface ModalButton {
  text: string;
  onPress?: () => void;
  variant?: ModalButtonVariant; // 생략하면 primary
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  /** 위에서부터 차례로 쌓인다. 생략하면 '확인' 버튼 하나만 나온다. */
  buttons?: ModalButton[];
  /** 안드로이드 뒤로가기 버튼 */
  onRequestClose?: () => void;
}

export const AppModal = ({
  visible,
  title,
  message,
  icon,
  iconColor = theme.colors.primary,
  buttons,
  onRequestClose,
}: AppModalProps) => {
  const list: ModalButton[] = buttons?.length ? buttons : [{ text: '확인' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          {icon && <Ionicons name={icon} size={48} color={iconColor} style={styles.icon} />}

          <Text style={[styles.title, !message && styles.titleOnly]}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {list.map((button, i) => {
            const variant = button.variant ?? 'primary';
            const isText = variant === 'text';

            return (
              <TouchableOpacity
                key={`${button.text}-${i}`}
                style={[
                  isText ? styles.textButton : styles.filledButton,
                  variant === 'danger' && styles.dangerButton,
                  i > 0 && styles.buttonGap,
                ]}
                onPress={button.onPress}
                activeOpacity={0.85}
              >
                <Text style={isText ? styles.textButtonLabel : styles.filledButtonLabel}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  box: {
    width: '80%',
    maxWidth: 400, // 웹에서 창이 넓어도 과하게 커지지 않도록
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textStrong,
    textAlign: 'center',
    marginBottom: 12,
  },
  titleOnly: {
    marginBottom: 24, // 본문이 없으면 제목이 버튼과 붙지 않게 띄운다
  },
  message: {
    fontSize: 15,
    color: theme.colors.textSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  filledButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
  },
  filledButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  textButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textHint,
  },
  buttonGap: {
    marginTop: 8,
  },
});
