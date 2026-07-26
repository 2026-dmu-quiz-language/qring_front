// screens/auth/LoginScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { OAUTH_CONFIG } from '../../constants/oauth';

WebBrowser.maybeCompleteAuthSession();

// 백엔드 기본 주소
const API_BASE_URL = 'https://q-ring.app/api/v1/auth'; 

type SocialProvider = 'google' | 'kakao' | 'line';

// 각 제공자의 인가(authorize) 엔드포인트
const AUTH_ENDPOINTS: Record<SocialProvider, string> = {
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
  kakao: 'https://kauth.kakao.com/oauth/authorize',
  line: 'https://access.line.me/oauth2/v2.1/authorize',
};

// RN의 URLSearchParams 구현이 불완전해서 직접 쿼리스트링을 만든다.
const toQuery = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

// 리다이렉트로 돌아온 URL에서 쿼리/프래그먼트 파라미터 추출
const getUrlParam = (url: string, name: string): string | null => {
  const match = url.match(new RegExp('[?&#]' + name + '=([^&#]+)'));
  return match ? decodeURIComponent(match[1]) : null;
};

// 같은 인증 코드가 두 경로(인증 세션 결과 + 딥링크 이벤트)로 중복 처리되는 것을 방지
const processedTokens = new Set<string>();

const LoginScreen = ({ navigation }: any) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  // 인증 완료 후 앱으로 되돌아올 딥링크 (Expo Go에서는 exp://..., 빌드에서는 qring://)
  // 네이티브에서는 /--/경로 형식이어야 Expo Go가 쿼리 파라미터를 앱까지 전달해준다.
  const appReturnUrl = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({ path: 'oauthredirect' });

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
  // 2. 소셜 로그인 
  // ==========================================

  // 인가 코드(카카오/라인) 또는 ID 토큰(구글)을 백엔드로 보내 자체 토큰을 발급받는다.
  const sendSocialTokenToBackend = async (provider: SocialProvider, tokenVal: string, redirectUri: string) => {
    if (processedTokens.has(tokenVal)) return;
    processedTokens.add(tokenVal);

    const response = await axios.post(`${API_BASE_URL}/oauth/${provider}`, {
      token: tokenVal,
      redirectUri: redirectUri,
    });

    const accessToken = response.data?.accessToken;
    if (!accessToken) throw new Error('NO_ACCESS_TOKEN');

    await AsyncStorage.setItem('accessToken', accessToken);
    if (response.data?.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    }

    // 백엔드 필드명이 직렬화 방식에 따라 isNewUser/newUser 둘 다 올 수 있어 모두 확인
    const isNewUser = response.data?.isNewUser ?? response.data?.newUser ?? false;
    navigation.navigate(isNewUser ? 'SocialSignUp' : 'MainTab');
  };

  // 웹에서는 소셜 로그인 복귀 시 앱이 새로 로드되므로,
  // URL에 남아 있는 인증 파라미터(code/id_token)를 여기서 직접 처리한다.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const url = window.location.href;
    const provider = getUrlParam(url, 'provider') as SocialProvider | null;
    if (provider !== 'google' && provider !== 'kakao' && provider !== 'line') return;

    const tokenVal = provider === 'google'
      ? getUrlParam(url, 'id_token')
      : getUrlParam(url, 'code');
    if (!tokenVal) return;

    // 새로고침/뒤로가기 시 만료된 코드로 재시도하지 않도록 URL 정리
    window.history.replaceState(null, '', window.location.pathname);

    const config =
      provider === 'google' ? OAUTH_CONFIG.GOOGLE :
      provider === 'kakao' ? OAUTH_CONFIG.KAKAO : OAUTH_CONFIG.LINE;

    setSocialLoading(true);
    sendSocialTokenToBackend(provider, tokenVal, config.REDIRECT_URI)
      .catch((error: any) => {
        const errorMessage = error.response?.data?.message || '소셜 로그인 중 오류가 발생했습니다.';
        window.alert(`로그인 실패: ${errorMessage}`); // RN-web에서는 Alert.alert가 동작하지 않음
      })
      .finally(() => setSocialLoading(false));
  }, []);

  // 모바일에서 카카오처럼 외부 앱(카카오톡)을 경유하면 인증 세션이 취소로 끝나고
  // 결과가 딥링크로만 도착하므로, 딥링크 URL의 인증 파라미터를 직접 처리한다.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      const provider = getUrlParam(url, 'provider') as SocialProvider | null;
      if (provider !== 'google' && provider !== 'kakao' && provider !== 'line') return;

      const tokenVal = provider === 'google'
        ? getUrlParam(url, 'id_token')
        : getUrlParam(url, 'code');
      if (!tokenVal) return;

      const config =
        provider === 'google' ? OAUTH_CONFIG.GOOGLE :
        provider === 'kakao' ? OAUTH_CONFIG.KAKAO : OAUTH_CONFIG.LINE;

      setSocialLoading(true);
      sendSocialTokenToBackend(provider, tokenVal, config.REDIRECT_URI)
        .catch((error: any) => {
          const errorMessage = error.response?.data?.message || '소셜 로그인 중 오류가 발생했습니다.';
          Alert.alert('로그인 실패', errorMessage);
        })
        .finally(() => setSocialLoading(false));
    };

    const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    Linking.getInitialURL().then(handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (socialLoading) return;
    setSocialLoading(true);
    try {
      const config =
        provider === 'google' ? OAUTH_CONFIG.GOOGLE :
        provider === 'kakao' ? OAUTH_CONFIG.KAKAO : OAUTH_CONFIG.LINE;

      if (!config.CLIENT_ID) {
        Alert.alert('설정 오류', `.env에 ${provider} 클라이언트 ID가 없습니다.`);
        return;
      }

      // state에 앱 복귀 딥링크를 담아 보내면, 백엔드 브릿지 페이지(/oauth/{provider})가
      // 인증 결과를 붙여 이 딥링크로 되돌려 보낸다.
      const params: Record<string, string> = {
        client_id: config.CLIENT_ID,
        redirect_uri: config.REDIRECT_URI,
        state: appReturnUrl,
      };

      if (provider === 'google') {
        // 구글은 웹 클라이언트로 ID 토큰을 직접 받는다 (백엔드가 ID 토큰을 검증)
        params.response_type = 'id_token';
        params.scope = 'openid email profile';
        params.nonce = Crypto.randomUUID();
      } else {
        params.response_type = 'code';
        if (provider === 'line') params.scope = 'profile openid';
      }

      const authUrl = `${AUTH_ENDPOINTS[provider]}?${toQuery(params)}`;

      // 카카오는 인증 중 카카오톡 앱으로 전환되면서 인증용 탭이 닫혀버리므로,
      // 모바일에서는 외부 브라우저로 열고 복귀는 딥링크 리스너에 맡긴다.
      if (Platform.OS !== 'web' && provider === 'kakao') {
        await Linking.openURL(authUrl);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, appReturnUrl);

      if (result.type !== 'success' || !result.url) return; // 사용자가 취소한 경우

      const tokenVal = provider === 'google'
        ? getUrlParam(result.url, 'id_token')
        : getUrlParam(result.url, 'code');

      if (!tokenVal) {
        Alert.alert('로그인 실패', '인증 정보를 받아오지 못했습니다. 다시 시도해 주세요.');
        return;
      }

      await sendSocialTokenToBackend(provider, tokenVal, config.REDIRECT_URI);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '소셜 로그인 중 오류가 발생했습니다.';
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setSocialLoading(false);
    }
  };

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

        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialCircle}
            onPress={() => handleSocialLogin('google')} disabled={socialLoading}
          >
            <Image source={require('../../../assets/google.png')} style={styles.socialIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialCircle}
            onPress={() => handleSocialLogin('kakao')} disabled={socialLoading}
          >
            <Image source={require('../../../assets/kakaoTalk-Flaticon.png')} style={styles.socialIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialCircle}
            onPress={() => handleSocialLogin('line')} disabled={socialLoading}
          >
            <Image source={require('../../../assets/line.png')} style={styles.socialIcon} />
          </TouchableOpacity>
        </View> 

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