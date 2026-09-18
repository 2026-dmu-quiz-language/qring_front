// src/components/common/DocumentModal.tsx
// 약관처럼 긴 글을 읽히는 팝업.
//
// AppModal 은 한두 줄짜리 알림용이라 본문이 길면 화면을 넘어간다.
// 여기서는 제목과 버튼은 고정해 두고 본문만 스크롤되게 해서, 기기 높이와 상관없이 끝까지 읽을 수 있다.
// 모양(어두운 배경, 흰 둥근 상자)은 AppModal 과 맞췄다.
import React from 'react';
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import type { LegalDocument } from '../../constants/legal';

interface DocumentModalProps {
  visible: boolean;
  document: LegalDocument | null;
  onClose: () => void;
  /** 넘기면 '동의하고 닫기' 버튼이 생긴다. 체크박스를 켜는 데 쓴다. */
  onAgree?: () => void;
}

export const DocumentModal = ({ visible, document, onClose, onAgree }: DocumentModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, { marginBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {document?.title ?? ''}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {document?.effectiveDate ? (
            <Text style={styles.effectiveDate}>시행일 {document.effectiveDate}</Text>
          ) : null}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator
          >
            {document?.sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <Text style={styles.heading}>{section.heading}</Text>
                <Text style={styles.paragraph}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {onAgree ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onAgree}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>동의하고 닫기</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.textButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.textButtonLabel}>닫기</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  box: {
    width: '100%',
    maxWidth: 480,
    // 본문이 아무리 길어도 화면을 넘지 않게 상한을 둔다. 짧으면 내용만큼만 차지한다.
    maxHeight: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 16,
    elevation: 5,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textStrong,
  },
  closeButton: {
    padding: 4,
    marginRight: -4,
  },
  effectiveDate: {
    paddingHorizontal: 20,
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textHint,
  },
  body: {
    marginTop: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 21,
    color: theme.colors.textSub,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
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
});
