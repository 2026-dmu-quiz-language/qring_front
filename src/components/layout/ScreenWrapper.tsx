import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

export const ScreenWrapper = ({ children, style }: any) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, 
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, 
    paddingHorizontal: 20,
  },
});