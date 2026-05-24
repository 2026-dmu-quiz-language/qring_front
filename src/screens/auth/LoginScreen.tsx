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

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = 'http://localhost:8080'; 

// 🌟 카카오 & 라인 인증 엔드포인트 수동 설정 (최신 방식)
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
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
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
  // 2. 소셜 로그인 백엔드 전송 (신규 유저 처리 추가)
  // ==========================================
  const sendSocialTokenToBackend = async (provider: string, payload: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/oauth/${provider}`, payload);
      
      // 케이스 A: 백엔드에서 신규 유저라고 알려주는 경우
      if (response.data?.isNewUser) {
        Alert.alert('환영합니다!', '추가 정보 입력을 위해 회원가입 화면으로 이동합니다.', [
          { 
            text: '확인', 
            // 🌟 SocialSignUp 화면으로 소셜 제공자 이름과 받은 토큰을 넘겨줍니다!
            onPress: () => navigation.navigate('SocialSignUp', { provider: provider, token: payload.token }) 
          }
        ]);
        return;
      }

      // 기존 유저 처리 로직...
      const token = response.data?.accessToken;
      if (token) {
        await AsyncStorage.setItem('accessToken', token);
        if (response.data?.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        navigation.navigate('MainTab');
      }
      
    } catch (error: any) {
      console.error(`${provider} Login Error:`, error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      // 케이스 B: 가입되지 않은 유저 에러 코드일 경우
      if (errorCode === 'USER_NOT_FOUND') {
        Alert.alert('회원가입 필요', '아직 가입되지 않은 소셜 계정입니다. 가입을 진행해 주세요.', [
          { 
            text: '확인', 
            // 🌟 에러로 거절되었을 때도 SocialSignUp으로 보냅니다!
            onPress: () => navigation.navigate('SocialSignUp', { provider: provider, token: payload.token }) 
          }
        ]);
      } else {
        Alert.alert('로그인 실패', errorMessage || '서버 연동에 실패했습니다.');
      }
    }
  };

  // ==========================================
  // 3. 구글 로그인 Hook
  // ==========================================
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      sendSocialTokenToBackend('google', { token: googleResponse.params.id_token });
    }
  }, [googleResponse]);

  // ==========================================
  // 4. 카카오 로그인 Hook (최신 방식)
  // ==========================================
  const [kakaoRequest, kakaoResponse, promptKakaoAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'YOUR_KAKAO_REST_API_KEY', // 💡 REST API 키 입력
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    kakaoDiscovery
  );

  useEffect(() => {
    if (kakaoResponse?.type === 'success' && kakaoResponse.params?.code) {
      sendSocialTokenToBackend('kakao', { 
        token: kakaoResponse.params.code, 
        redirectUri 
      });
    }
  }, [kakaoResponse]);

  // ==========================================
  // 5. 라인 로그인 Hook (최신 방식)
  // ==========================================
  const [lineRequest, lineResponse, promptLineAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'YOUR_LINE_CHANNEL_ID', // 💡 채널 ID 입력
      redirectUri,
      scopes: ['profile', 'openid', 'email'],
      responseType: AuthSession.ResponseType.Code,
      extraParams: { state: 'login' }
    },
    lineDiscovery
  );

  useEffect(() => {
    if (lineResponse?.type === 'success' && lineResponse.params?.code) {
      sendSocialTokenToBackend('line', { 
        token: lineResponse.params.code, 
        redirectUri 
      });
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
          <CustomInput 
            iconName="person-outline" 
            placeholder="아이디(이메일)를 입력해 주세요." 
            value={id}
            onChangeText={setId}
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>PASSWORD</Text>
          <CustomInput 
            iconName="lock-closed-outline" 
            placeholder="비밀번호를 입력해 주세요." 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>

        <CustomButton title="로그인 ➔" onPress={handleLogin} />

        <View style={styles.dividerContainer}>
          <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
        </View>

        <View style={styles.socialContainer}>
          {/* 🌟 구글 버튼 */}
          <TouchableOpacity 
            style={[styles.socialCircle, { backgroundColor: '#FFF' }]} 
            onPress={() => promptGoogleAsync()}
            disabled={!googleRequest} // 로딩 중 클릭 방지
          >
            <Ionicons name="logo-google" size={24} color="#EA4335" />
          </TouchableOpacity>

          {/* 🌟 카카오 버튼 */}
          <TouchableOpacity 
            style={[styles.socialCircle, { backgroundColor: '#FEE500' }]} 
            onPress={() => promptKakaoAsync()}
            disabled={!kakaoRequest}
          >
            <Ionicons name="chatbubble-sharp" size={24} color="#3C1E1E" />
          </TouchableOpacity>

          {/* 🌟 라인 버튼 */}
          <TouchableOpacity 
            style={[styles.socialCircle, { backgroundColor: '#06C755' }]} 
            onPress={() => promptLineAsync()}
            disabled={!lineRequest}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#FFF" />
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
  socialCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE', elevation: 2 },
  signUpLink: { marginTop: 10 },
  signUpText: { color: '#666' }
});

export default LoginScreen;