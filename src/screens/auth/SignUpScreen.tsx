// screens/auth/SignUpScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { theme } from '../../constants/theme';

// 백엔드 주소 (환경에 맞게 수정하세요)
const API_BASE_URL = 'https://q-ring.app/api/v1/auth';

const SignUpScreen = ({ navigation }: any) => {
  // 🌟 명세서에 맞게 id 대신 email로 상태명 변경
  const [email, setEmail] = useState('');
  const [isEmailAvailable, setIsEmailAvailable] = useState(false); // 이메일 중복확인 완료 여부

  // 🌟 닉네임 상태 추가
  const [nickname, setNickname] = useState('');
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(false); // 닉네임 중복확인 완료 여부

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [selectedLang, setSelectedLang] = useState('영어'); 
  const [selectedLevel, setSelectedLevel] = useState('Lv.1');

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const toggleAllAgreements = () => {
    const isAllAgreed = agreedTerms && agreedPrivacy;
    setAgreedTerms(!isAllAgreed);
    setAgreedPrivacy(!isAllAgreed);
  };

  // 🌟 1. 이메일 중복 확인 API (GET)
  const handleCheckEmail = async () => {
    if (!email) return Alert.alert('알림', '이메일을 입력해 주세요.');
    try {
      const response = await axios.get(`${API_BASE_URL}/check-email`, { params: { email } });
      if (response.data.available) {
        setIsEmailAvailable(true);
        Alert.alert('확인', '사용 가능한 이메일입니다.');
      } else {
        setIsEmailAvailable(false);
        Alert.alert('불가', '이미 사용 중인 이메일입니다.');
      }
    } catch (error) {
      Alert.alert('에러', '중복 확인에 실패했습니다.');
    }
  };

  // 🌟 2. 닉네임 중복 확인 API (GET)
  const handleCheckNickname = async () => {
    if (!nickname) return Alert.alert('알림', '닉네임을 입력해 주세요.');
    try {
      const response = await axios.get(`${API_BASE_URL}/check-nickname`, { params: { nickname } });
      if (response.data.available) {
        setIsNicknameAvailable(true);
        Alert.alert('확인', '사용 가능한 닉네임입니다.');
      } else {
        setIsNicknameAvailable(false);
        Alert.alert('불가', '이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      Alert.alert('에러', '중복 확인에 실패했습니다.');
    }
  };

  // 🌟 3. 회원가입 및 메일 전송 API (POST)
  const handleSignUp = async () => {
    const languageMap: { [key: string]: string } = {
      '일본어': 'JA',
      '영어': 'EN',
      '중국어': 'ZH'
    };

    // (옵션) 유저가 언어를 선택 안 하고 넘어가려 할 때 방어하기
    if (!selectedLang) {
      Alert.alert('알림', '학습할 언어를 선택해주세요!');
      return;
    }

    if (!email || !password || !nickname) {
      return Alert.alert('알림', '모든 정보를 입력해 주세요.');
    }
    if (!isEmailAvailable) return Alert.alert('알림', '이메일 중복 확인을 해주세요.');
    if (!isNicknameAvailable) return Alert.alert('알림', '닉네임 중복 확인을 해주세요.');
    if (password !== passwordConfirm) return Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
    if (!agreedTerms || !agreedPrivacy) return Alert.alert('알림', '필수 약관에 모두 동의해 주세요.');

    // 레벨 코드를 int로 변환 ('Lv.1' -> 1)
    const levelCode = parseInt(selectedLevel.replace('Lv.', ''), 10);

    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        email: email,
        password: password,
        nickname: nickname,
        language: languageMap[selectedLang],
        levelCode: levelCode,
      });

      // 🌟 조건문(if)을 아예 없앴습니다! 에러가 안 났다면 무조건 성공한 것입니다.
      Alert.alert('메일 발송 완료', '인증 코드를 이메일로 전송했습니다.');
      navigation.navigate('EmailVerify', { email: email });
        
    } catch (error: any) {
      // 실패하면 알아서 이쪽으로 빠집니다.
      const errorMessage = error.response?.data?.message || '회원가입에 실패했습니다.';
      Alert.alert('회원가입 실패', errorMessage);
      console.log('🚫 회원가입 실패 상세 사유:', error.response?.data);
    }
  };

  return (
    <ScreenWrapper>
      <Header leftType="back" rightType="sprout" title="회원가입" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Image source={require('../../../assets/quring_logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>스토리로 빠져드는 즐거운 언어 학습,{'\n'}지금 시작해 보세요!</Text>

        <View style={styles.inputSection}>
          {/* 이메일 영역 */}
          <Text style={styles.label}>이메일</Text>
          <View style={styles.idInputRow}>
            <View style={styles.idInputWrap}>
              <CustomInput 
                iconName="mail-outline" 
                placeholder="이메일을 입력해 주세요." 
                value={email}
                onChangeText={(text) => { setEmail(text); setIsEmailAvailable(false); }}
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity 
              style={[styles.idCheckButton, isEmailAvailable && { backgroundColor: '#AAB87B' }]} 
              onPress={handleCheckEmail}
            >
              <Text style={styles.idCheckText}>{isEmailAvailable ? '확인완료' : '중복확인'}</Text>
            </TouchableOpacity>
          </View>

          {/* 🌟 닉네임 영역 추가 */}
          <Text style={[styles.label, { marginTop: 10 }]}>닉네임</Text>
          <View style={styles.idInputRow}>
            <View style={styles.idInputWrap}>
              <CustomInput 
                iconName="person-outline" 
                placeholder="닉네임을 입력해 주세요." 
                value={nickname}
                onChangeText={(text) => { setNickname(text); setIsNicknameAvailable(false); }}
              />
            </View>
            <TouchableOpacity 
              style={[styles.idCheckButton, isNicknameAvailable && { backgroundColor: '#AAB87B' }]} 
              onPress={handleCheckNickname}
            >
              <Text style={styles.idCheckText}>{isNicknameAvailable ? '확인완료' : '중복확인'}</Text>
            </TouchableOpacity>
          </View>

          {/* 비밀번호 영역 */}
          <Text style={[styles.label, { marginTop: 10 }]}>비밀번호</Text>
          <CustomInput 
            iconName="lock-closed-outline" 
            placeholder="비밀번호를 입력해 주세요." 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
          
          <Text style={styles.label}>비밀번호 확인</Text>
          <CustomInput
            iconName="checkmark-circle-outline"
            placeholder="비밀번호를 한 번 더 입력해 주세요."
            secureTextEntry
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
          />
          <View style={styles.passwordMismatchWrap}>
            {passwordConfirm.length > 0 && password !== passwordConfirm && (
              <Text style={styles.passwordMismatch}>비밀번호가 일치하지 않습니다.</Text>
            )}
          </View>
        </View>

        {/* --- 학습 설정 및 약관 동의 (기존 코드와 동일) --- */}
        <View style={styles.settingBox}>
          <Text style={styles.settingTitle}>⚙️ 나만의 맞춤 학습 설정</Text>
          <Text style={styles.subLabel}>언어 설정</Text>
          <View style={styles.row}>
            {['일본어', '영어', '중국어'].map((lang) => (
              <TouchableOpacity key={lang} style={[styles.chip, lang === selectedLang && styles.chipActive]} onPress={() => setSelectedLang(lang)}>
                <Text style={[styles.chipText, lang === selectedLang && styles.chipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.subLabel}>시작 레벨 선택</Text>
          <View style={styles.row}>
            {[ {lv: 'Lv.1', t: '왕초보'}, {lv: 'Lv.2', t: '일상 회화'}, {lv: 'Lv.3', t: '프리토킹'} ].map((item) => (
              <TouchableOpacity key={item.lv} style={[styles.levelCard, item.lv === selectedLevel && styles.levelCardActive]} onPress={() => setSelectedLevel(item.lv)}>
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

        <CustomButton title="다음 단계 ➔" onPress={handleSignUp} />
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
  idInputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 15 },
  idInputWrap: { flex: 1 },
  idCheckButton: { height: 50, backgroundColor: theme.colors.primary, paddingHorizontal: 15, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
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
  agreementSection: { marginBottom: 30, paddingHorizontal: 5 },
  agreeRowAll: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  agreeLeft: { flexDirection: 'row', alignItems: 'center' },
  agreeTextAll: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  agreeText: { fontSize: 14, color: '#555', marginLeft: 10 },
  detailText: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
  divider: { height: 1, backgroundColor: '#D8D8CA', marginBottom: 15 },
  passwordMismatchWrap: { height: 8 },
  passwordMismatch: { color: '#E74C3C', fontSize: 12, marginLeft: 5, marginTop: -8 },
});

export default SignUpScreen;