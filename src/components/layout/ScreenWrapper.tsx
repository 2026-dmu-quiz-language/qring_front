import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../../constants/theme';

export const ScreenWrapper = ({ children, style }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, // 공통 배경색 적용
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, // 공통 좌우 여백
  },
});