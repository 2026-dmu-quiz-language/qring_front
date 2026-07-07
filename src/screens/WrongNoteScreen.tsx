import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';
import { theme } from '../constants/theme';

const WrongNoteScreen = () => {
  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="오답 노트" leftType="back" rightType="none" />
      <View style={styles.container}>
        <Text style={styles.emptyText}>아직 오답 기록이 없습니다.</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
});

export default WrongNoteScreen;
