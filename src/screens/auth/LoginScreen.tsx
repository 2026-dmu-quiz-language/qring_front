// screens/auth/LoginScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { OAUTH_CONFIG } from '../../constants/oauth';

WebBrowser.maybeCompleteAuthSession();

// 백엔드 기본 주소
const API_BASE_URL = 'https://q-ring.app/api/v1/auth'; 

const kakaoDiscovery = { authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize' };
const lineDiscovery = { authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize' };

const LoginScreen = ({ navigation }: any) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  // 공통 리다이렉트 URI 생성
  const redirectUri = AuthSession.makeRedirectUri();

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
  // 2. 소셜 로그인 백엔드 전송 (/oauth/...)
  // ==========================================
  const sendSocialTokenToBackend = async (provider: string, tokenVal: string) => {
    try {
      // 명세서 Request: token, redirectUri
      const payload = {
        token: tokenVal,
        redirectUri: redirectUri
      };

      const response = await axios.post(`${API_BASE_URL}/oauth/${provider}`, payload);
      
      const { accessToken, refreshToken, newUser } = response.data;

      // 🌟 신규 유저든 기존 유저든 일단 발급받은 토큰은 저장합니다.
      if (accessToken) {
        await AsyncStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        
        // 🌟 명세서 Response: newUser가 true면 학습 설정 페이지로!
        if (newUser) {
          navigation.navigate('SocialSignUp');
        } else {
          navigation.navigate('MainTab');
        }
      } else {
        Alert.alert('오류', '토큰을 발급받지 못했습니다.');
      }
      
    } catch (error: any) {
      console.error(`${provider} Login Error:`, error);
      Alert.alert('로그인 실패', error.response?.data?.message || '서버 연동에 실패했습니다.');
    }
  };

  // ==========================================
  // 3. 구글 로그인 Hook
  // ==========================================
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: '472758554338-hvjco2n0okeqsfe8uv7d8ecm1ih8qlb6.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      sendSocialTokenToBackend('google', googleResponse.params.id_token);
    }
  }, [googleResponse]);

  // ==========================================
  // 4. 카카오 로그인 Hook
  // ==========================================
  const [kakaoRequest, kakaoResponse, promptKakaoAsync] = AuthSession.useAuthRequest(
    {
      clientId: '34ef02f3d1f4df166ecdfea02aa21bd1', 
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    kakaoDiscovery
  );

  useEffect(() => {
    if (kakaoResponse?.type === 'success' && kakaoResponse.params?.code) {
      sendSocialTokenToBackend('kakao', kakaoResponse.params.code);
    }
  }, [kakaoResponse]);

  // ==========================================
  // 5. 라인 로그인 Hook
  // ==========================================
  const [lineRequest, lineResponse, promptLineAsync] = AuthSession.useAuthRequest(
    {
      clientId: '2009845869', 
      redirectUri,
      scopes: ['profile', 'openid', 'email'],
      responseType: AuthSession.ResponseType.Code,
      extraParams: { state: 'login' }
    },
    lineDiscovery
  );

  useEffect(() => {
    if (lineResponse?.type === 'success' && lineResponse.params?.code) {
      sendSocialTokenToBackend('line', lineResponse.params.code);
    }
  }, [lineResponse]);

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

        <View style={styles.dividerContainer}>
          <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
        </View>

        {/* 🌟 소셜 아이콘 브랜드 스타일 적용 */}
        <View style={styles.socialContainer}>
          {/* 구글 */}
          <TouchableOpacity 
            style={[styles.socialCircle, { backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderWidth: 1 }]} 
            onPress={() => promptGoogleAsync()} disabled={!googleRequest}
          >
            <Ionicons name="logo-google" size={22} color="#EA4335" />
          </TouchableOpacity>

          {/* 카카오 */}
          <TouchableOpacity 
            style={[styles.socialCircle, { backgroundColor: '#FEE500', borderWidth: 0 }]} 
            onPress={() => promptKakaoAsync()} disabled={!kakaoRequest}
          >
            <Ionicons name="chatbubble-sharp" size={22} color="#000000" />
          </TouchableOpacity>

          {/* 라인 */}
          <TouchableOpacity 
            style={[styles.socialCircle, { backgroundColor: '#06C755', borderWidth: 0 }]} 
            onPress={() => promptLineAsync()} disabled={!lineRequest}
          >
            <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpLink}>
          <Text style={styles.signUpText}>계정이 없으신가요? <Text style={{ fontWeight: 'bold', color: '#6F9F63' }}>회원가입</Text></Text>
        </TouchableOpacity>
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
  socialCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  signUpLink: { marginTop: 10 },
  signUpText: { color: '#666' }
});

export default LoginScreen;