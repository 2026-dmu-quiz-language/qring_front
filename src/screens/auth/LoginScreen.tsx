// screens/auth/LoginScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';

// 🌟 [소셜 로그인 임시 주석 처리] 필요할 때 주석을 해제하세요.
// import * as WebBrowser from 'expo-web-browser';
// import * as AuthSession from 'expo-auth-session';
// import * as Google from 'expo-auth-session/providers/google';
// import { OAUTH_CONFIG } from '../../constants/oauth';

// WebBrowser.maybeCompleteAuthSession();

// 백엔드 기본 주소
const API_BASE_URL = 'https://q-ring.app/api/v1/auth'; 

// const kakaoDiscovery = { authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize' };
// const lineDiscovery = { authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize' };

const LoginScreen = ({ navigation }: any) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  // 공통 리다이렉트 URI 생성 (소셜 로그인용 - 임시 주석)
  // const redirectUri = AuthSession.makeRedirectUri();

  // ==========================================
  // 1. 일반 (로컬) 로그인
  // ==========================================
  const handleLogin = async () => {
    if (!id || !password) return Alert.alert('알림', '아이디와 비밀번호를 입력해 주세요.');

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: id,
        password: password,
      });

      const token = response.data?.accessToken;
      if (token) {
        await AsyncStorage.setItem('accessToken', token);
        if (response.data?.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        navigation.navigate('MainTab');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '아이디나 비밀번호를 확인해 주세요.';
      Alert.alert('로그인 실패', errorMessage);
    }
  };

  // ==========================================
  // 2. 소셜 로그인 백엔드 전송 및 Hook (임시 주석 처리)
  // ==========================================
  /* const sendSocialTokenToBackend = async (provider: string, tokenVal: string) => { ... }
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({ ... });
  const [kakaoRequest, kakaoResponse, promptKakaoAsync] = AuthSession.useAuthRequest({ ... });
  const [lineRequest, lineResponse, promptLineAsync] = AuthSession.useAuthRequest({ ... });
  */

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Image source={require('../../../assets/quring_logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>환영합니다!</Text>
        <Text style={styles.subTitle}>오늘의 학습을 시작할 준비가 되셨나요?</Text>

        <View style={styles.inputSection}>
          <Text style={styles.label}>ID</Text>
          <CustomInput iconName="person-outline" placeholder="이메일을 입력해 주세요." value={id} onChangeText={setId} autoCapitalize="none" />
          
          <Text style={styles.label}>PASSWORD</Text>
          <CustomInput iconName="lock-closed-outline" placeholder="비밀번호를 입력해 주세요." secureTextEntry value={password} onChangeText={setPassword} />
          
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>

        <CustomButton title="로그인 ➔" onPress={handleLogin} />

        {/* 🌟 소셜 로그인 UI 임시 주석 처리 시작 */}
        {/* <View style={styles.dividerContainer}>
          <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialCircle}
            onPress={() => promptGoogleAsync()} disabled={!googleRequest}
          >
            <Image source={require('../../../assets/google.png')} style={styles.socialIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialCircle}
            onPress={() => promptKakaoAsync()} disabled={!kakaoRequest}
          >
            <Image source={require('../../../assets/kakaoTalk-Flaticon.png')} style={styles.socialIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialCircle}
            onPress={() => promptLineAsync()} disabled={!lineRequest}
          >
            <Image source={require('../../../assets/line.png')} style={styles.socialIcon} />
          </TouchableOpacity>
        </View> 
        */}
        {/* 🌟 소셜 로그인 UI 임시 주석 처리 끝 */}

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpLink}>
          <Text style={styles.signUpText}>계정이 없으신가요? <Text style={{ fontWeight: 'bold', color: '#6F9F63' }}>회원가입</Text></Text>
        </TouchableOpacity>

        <Text style={styles.attributionText}>Icon by Freepik - Flaticon</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 20, justifyContent: 'center' },
  logo: { width: 150, height: 80, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subTitle: { fontSize: 14, color: '#666', marginBottom: 30 },
  inputSection: { width: '100%', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 5, marginLeft: 5 },
  forgotBtn: { alignSelf: 'center', marginTop: 15, marginBottom: 10 }, 
  forgotText: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30, width: '80%' },
  line: { flex: 1, height: 1, backgroundColor: '#DDD' },
  orText: { marginHorizontal: 10, color: '#AAA', fontSize: 12 },
  socialContainer: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  socialCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  socialIcon: { width: 48, height: 48, resizeMode: 'contain' as const },
  signUpLink: { marginTop: 10 },
  signUpText: { color: '#666' },
  attributionText: { fontSize: 10, color: '#BBB', marginTop: 15 }
});

export default LoginScreen;