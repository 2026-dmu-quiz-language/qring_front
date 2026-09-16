// src/screens/MyPage/AppInfoScreen.tsx
// 앱 정보와 아이콘 출처를 모아두는 화면.
// Flaticon 무료 아이콘은 제작자 이름과 함께 출처를 밝혀야 하는데,
// 아이콘마다 옆에 적기 어려우면 이렇게 한곳에 모아도 된다.
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';

const { colors, fonts } = theme;

// app.json의 version과 같은 값을 적는다. 버전을 올릴 때 여기도 같이 고친다.
const APP_VERSION = '1.0.1';

const FLATICON_URL = 'https://www.flaticon.com';

/**
 * 아이콘 출처 목록.
 * 새 아이콘을 받으면 쓰임새와 제작자, 파일명을 여기에 한 줄 추가한다.
 * 제작자 이름은 Flaticon에서 아이콘을 받을 때 나오는 작가 이름을 그대로 적는다.
 */
const ICON_CREDITS: { name: string; author: string; files: string }[] = [
  { name: '카카오 로그인 아이콘', author: 'Freepik', files: 'kakaoTalk-Flaticon.png' },
  { name: '학습 완료 아이콘', author: 'feen', files: 'check.png' },
  { name: '레벨 아이콘', author: 'Kason Koo', files: 'level1.png, level2.png, level3.png' },
  { name: '봇 아이콘', author: 'Flowicon', files: 'bot.png' },
  { name: '포인트 아이콘', author: 'Magnific', files: 'point.png' },
  { name: '전체 카테고리 아이콘', author: 'Magnific', files: 'categories.png' },
  { name: '하트 아이콘', author: 'redempticon', files: 'romance.png' },
  { name: '스토리 아이콘', author: 'Karyative', files: 'book.png' },
  { name: '시간 아이콘', author: 'Andy Horvath', files: 'time1.png, time2.png, time3.png' },
];

const AppInfoScreen = () => {
  const openFlaticon = () => {
    Linking.openURL(FLATICON_URL).catch(() => {});
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header title="앱 정보" leftType="back" rightType="none" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 앱 기본 정보 */}
        <View style={styles.card}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>큐링</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>버전</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* 아이콘 출처 */}
        <View style={[styles.card, styles.marginTop]}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="image-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>아이콘 출처</Text>
          </View>

          <Text style={styles.desc}>
            이 앱은 Flaticon의 무료 아이콘을 사용합니다.
          </Text>

          {ICON_CREDITS.map((credit) => (
            <View key={credit.name} style={styles.creditRow}>
              <Text style={styles.creditName}>{credit.name}</Text>
              <Text style={styles.creditText}>Icon by {credit.author} - Flaticon</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.linkRow} onPress={openFlaticon} activeOpacity={0.7}>
            <Text style={styles.linkText}>www.flaticon.com</Text>
            <Ionicons name="open-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 0, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  marginTop: { marginTop: 16 },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF7E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C3A29', fontFamily: fonts.headline },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: '#6B7A68', fontFamily: fonts.label, fontWeight: '600' },
  rowValue: { fontSize: 14, color: '#2C3A29', fontWeight: '700' },
  desc: { fontSize: 13, color: '#6B7A68', fontFamily: fonts.body, marginBottom: 12, lineHeight: 20 },
  creditRow: { marginBottom: 12 },
  creditName: { fontSize: 12, color: '#9AA394', fontFamily: fonts.label, fontWeight: '600' },
  creditText: { fontSize: 13, color: '#2C3A29', fontWeight: '600', marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  linkText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
});

export default AppInfoScreen;
