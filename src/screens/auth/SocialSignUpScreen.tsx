// screens/auth/SocialSignUpScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { CustomButton } from '../../components/common/Button';
import { theme } from '../../constants/theme';

const API_BASE_URL = 'https://q-ring.app:8080/api/v1/auth'; 

// 🌟 명세서 맞춤형 언어 코드 매핑 (EN/ZH/JA)
const LANG_MAP: Record<string, string> = {
  '영어': 'EN',
  '중국어': 'ZH',
  '일본어': 'JA'
};

const SocialSignUpScreen = ({ navigation }: any) => {
  const [selectedLang, setSelectedLang] = useState('영어'); 
  const [selectedLevel, setSelectedLevel] = useState('Lv.1');

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const toggleAllAgreements = () => {
    const isAllAgreed = agreedTerms && agreedPrivacy;
    setAgreedTerms(!isAllAgreed);
    setAgreedPrivacy(!isAllAgreed);
  };

  const handlePreferencesSubmit = async () => {
    if (!agreedTerms || !agreedPrivacy) {
      return Alert.alert('알림', '필수 약관에 모두 동의해 주세요.');
    }

    try {
      // LoginScreen에서 미리 저장해둔 토큰을 꺼내옵니다.
      const token = await AsyncStorage.getItem('accessToken');
      
      // 레벨 코드를 int로 변환 ('Lv.1' -> 1)
      const levelCode = parseInt(selectedLevel.replace('Lv.', ''), 10);
      const languageCode = LANG_MAP[selectedLang];

      // 🌟 명세서의 /preferences (PUT 방식) 적용
      const response = await axios.put(`${API_BASE_URL}/preferences`, {
        language: languageCode,
        levelCode: levelCode,
      }, {
        headers: {
          Authorization: `Bearer ${token}` // 토큰을 헤더에 담아 인증
        }
      });

      // 응답 명세서의 updated 확인
      if (response.data.updated) {
        Alert.alert('환영합니다!', '초기 학습 설정이 완료되었습니다.', [
          { text: '시작하기', onPress: () => navigation.navigate('MainTab') }
        ]);
      } else {
        Alert.alert('오류', '설정 업데이트에 실패했습니다.');
      }
      
    } catch (error: any) {
      console.error('Preferences Error:', error);
      const errorMessage = error.response?.data?.message || '설정 저장 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    }
  };

  return (
    <ScreenWrapper>
      <Header leftType="back" rightType="sprout" title="학습 설정" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Image source={require('../../../assets/quring_logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>거의 다 왔어요!{'\n'}맞춤 학습을 위해 설정해 주세요.</Text>

        <View style={styles.settingBox}>
          <Text style={styles.settingTitle}>⚙️ 나만의 맞춤 학습 설정</Text>
          
          <Text style={styles.subLabel}>언어 설정</Text>
          <View style={styles.row}>
            {['일본어', '영어', '중국어'].map((lang) => (
              <TouchableOpacity 
                key={lang} 
                style={[styles.chip, lang === selectedLang && styles.chipActive]}
                onPress={() => setSelectedLang(lang)}
              >
                <Text style={[styles.chipText, lang === selectedLang && styles.chipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>시작 레벨 선택</Text>
          <View style={styles.row}>
            {[ {lv: 'Lv.1', t: '왕초보'}, {lv: 'Lv.2', t: '일상 회화'}, {lv: 'Lv.3', t: '프리토킹'} ].map((item) => (
              <TouchableOpacity 
                key={item.lv} 
                style={[styles.levelCard, item.lv === selectedLevel && styles.levelCardActive]}
                onPress={() => setSelectedLevel(item.lv)}
              >
                <Text style={[styles.levelTag, item.lv === selectedLevel && styles.levelTagActive]}>{item.t}</Text>
                <Text style={[styles.levelText, item.lv === selectedLevel && styles.levelTextActive]}>{item.lv}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.agreementSection}>
          <TouchableOpacity style={styles.agreeRowAll} onPress={toggleAllAgreements}>
            <Ionicons name={agreedTerms && agreedPrivacy ? "checkmark-circle" : "checkmark-circle-outline"} size={24} color={agreedTerms && agreedPrivacy ? theme.colors.primary : "#CCC"} />
            <Text style={styles.agreeTextAll}>약관 전체 동의</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.agreeRow}>
            <TouchableOpacity style={styles.agreeLeft} onPress={() => setAgreedTerms(!agreedTerms)}>
              <Ionicons name="checkmark" size={20} color={agreedTerms ? theme.colors.primary : "#CCC"} />
              <Text style={styles.agreeText}>(필수) 서비스 이용약관 동의</Text>
            </TouchableOpacity>
            <TouchableOpacity><Text style={styles.detailText}>보기</Text></TouchableOpacity>
          </View>
          <View style={styles.agreeRow}>
            <TouchableOpacity style={styles.agreeLeft} onPress={() => setAgreedPrivacy(!agreedPrivacy)}>
              <Ionicons name="checkmark" size={20} color={agreedPrivacy ? theme.colors.primary : "#CCC"} />
              <Text style={styles.agreeText}>(필수) 개인정보 처리방침 동의</Text>
            </TouchableOpacity>
            <TouchableOpacity><Text style={styles.detailText}>보기</Text></TouchableOpacity>
          </View>
        </View>

        <CustomButton title="설정 완료 및 시작하기 ➔" onPress={handlePreferencesSubmit} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 100 },
  logoImage: { width: 120, height: 40, marginBottom: 10, alignSelf: 'flex-start' },
  title: { fontSize: 18, color: '#333', lineHeight: 26, marginBottom: 30, fontWeight: '500' },
  settingBox: { backgroundColor: '#F3F4EB', borderRadius: 30, padding: 25, marginBottom: 20 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  subLabel: { fontSize: 14, color: '#555', marginBottom: 12, marginTop: 10, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 25, backgroundColor: theme.colors.white },
  chipActive: { backgroundColor: theme.colors.secondary }, 
  chipText: { color: '#666', fontSize: 15 },
  chipTextActive: { color: theme.colors.white, fontWeight: 'bold' },
  levelCard: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: theme.colors.white },
  levelCardActive: { backgroundColor: theme.colors.secondary },
  levelTag: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '600' },
  levelTagActive: { color: 'rgba(255, 255, 255, 0.9)' }, 
  levelText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  levelTextActive: { color: theme.colors.white },
  agreementSection: { marginBottom: 30, paddingHorizontal: 5 },
  agreeRowAll: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  agreeLeft: { flexDirection: 'row', alignItems: 'center' },
  agreeTextAll: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  agreeText: { fontSize: 14, color: '#555', marginLeft: 10 },
  detailText: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
  divider: { height: 1, backgroundColor: '#D8D8CA', marginBottom: 15 },
});

export default SocialSignUpScreen;