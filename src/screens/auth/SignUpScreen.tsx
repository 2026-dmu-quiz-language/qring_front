import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // 🌟 아이콘 사용을 위해 추가!
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { theme } from '../../constants/theme';

const SignUpScreen = ({ navigation }: any) => {
  const [selectedLang, setSelectedLang] = useState('영어'); 
  const [selectedLevel, setSelectedLevel] = useState('Lv.1');

  // 🌟 약관 동의 상태 관리
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  // 🌟 전체 동의 토글 함수
  const toggleAllAgreements = () => {
    const isAllAgreed = agreedTerms && agreedPrivacy;
    setAgreedTerms(!isAllAgreed);
    setAgreedPrivacy(!isAllAgreed);
  };

  return (
    <ScreenWrapper>
      <Header leftType="back" rightType="sprout" title="회원가입" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Image 
          source={require('../../../assets/quring_logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />

        <Text style={styles.title}>스토리로 빠져드는 즐거운 언어 학습,{'\n'}지금 시작해 보세요!</Text>

        <View style={styles.inputSection}>
          <Text style={styles.label}>아이디</Text>
          <View style={styles.idInputRow}>
            <View style={styles.idInputWrap}>
              <CustomInput iconName="person-outline" placeholder="아이디를 입력해 주세요." />
            </View>
            <TouchableOpacity style={styles.idCheckButton}>
              <Text style={styles.idCheckText}>중복 확인</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>비밀번호</Text>
          <CustomInput iconName="lock-closed-outline" placeholder="비밀번호를 입력해 주세요." secureTextEntry />
          
          <Text style={styles.label}>비밀번호 확인</Text>
          <CustomInput iconName="checkmark-circle-outline" placeholder="비밀번호를 한 번 더 입력해 주세요." secureTextEntry />
        </View>

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

        {/* 🌟 실제 앱 스타일의 약관 동의 UI */}
        <View style={styles.agreementSection}>
          {/* 전체 동의 */}
          <TouchableOpacity style={styles.agreeRowAll} onPress={toggleAllAgreements}>
            <Ionicons 
              name={agreedTerms && agreedPrivacy ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={24} 
              color={agreedTerms && agreedPrivacy ? theme.colors.primary : "#CCC"} 
            />
            <Text style={styles.agreeTextAll}>약관 전체 동의</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />

          {/* 서비스 이용약관 */}
          <View style={styles.agreeRow}>
            <TouchableOpacity style={styles.agreeLeft} onPress={() => setAgreedTerms(!agreedTerms)}>
              <Ionicons 
                name="checkmark" 
                size={20} 
                color={agreedTerms ? theme.colors.primary : "#CCC"} 
              />
              <Text style={styles.agreeText}>(필수) 서비스 이용약관 동의</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {/* TODO: 서비스 이용약관 팝업 띄우기 */}}>
              <Text style={styles.detailText}>보기</Text>
            </TouchableOpacity>
          </View>

          {/* 개인정보 처리방침 */}
          <View style={styles.agreeRow}>
            <TouchableOpacity style={styles.agreeLeft} onPress={() => setAgreedPrivacy(!agreedPrivacy)}>
              <Ionicons 
                name="checkmark" 
                size={20} 
                color={agreedPrivacy ? theme.colors.primary : "#CCC"} 
              />
              <Text style={styles.agreeText}>(필수) 개인정보 처리방침 동의</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {/* TODO: 개인정보 처리방침 팝업 띄우기 */}}>
              <Text style={styles.detailText}>보기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomButton 
          title="가입 완료 및 시작하기 ➔" 
          // 🌟 동의를 다 해야만 넘어갈 수 있게 처리할 수도 있습니다.
          // onPress={() => { if(agreedTerms && agreedPrivacy) navigation.navigate('MainTab') else alert('약관에 동의해주세요') }}
          onPress={() => navigation.navigate('MainTab')} 
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 100 },
  logoImage: { width: 120, height: 40, marginBottom: 10, alignSelf: 'flex-start' },
  title: { fontSize: 18, color: '#333', lineHeight: 26, marginBottom: 30, fontWeight: '500' },
  inputSection: { marginBottom: 30 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  
  idInputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  idInputWrap: { flex: 1 },
  idCheckButton: {
    height: 50, 
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCheckText: { color: theme.colors.white, fontWeight: 'bold', fontSize: 13 },

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
  
  // 🌟 새롭게 추가된 약관 동의 UI 스타일
  agreementSection: { marginBottom: 30, paddingHorizontal: 5 },
  agreeRowAll: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  agreeLeft: { flexDirection: 'row', alignItems: 'center' },
  agreeTextAll: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  agreeText: { fontSize: 14, color: '#555', marginLeft: 10 },
  detailText: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
  divider: { height: 1, backgroundColor: '#D8D8CA', marginBottom: 15 },
});

export default SignUpScreen;