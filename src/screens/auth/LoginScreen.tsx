// screens/auth/LoginScreen.tsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Platform, 
  Linking, 
  Modal, 
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { showAlert } from '../../components/common/AlertHost';
import { Text } from '../../components/common/Text';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { OAUTH_CONFIG } from '../../constants/oauth';
import { theme } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = 'https://q-ring.app/api/v1/auth'; 
const BASE_URL = 'https://q-ring.app/api/v1';

type SocialProvider = 'google' | 'kakao' | 'line';

const AUTH_ENDPOINTS: Record<SocialProvider, string> = {
  google: 'https://accounts.google.com/o/oauth2/v2/auth',
  kakao: 'https://kauth.kakao.com/oauth/authorize',
  line: 'https://access.line.me/oauth2/v2.1/authorize',
};

const toQuery = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

const getUrlParam = (url: string, name: string): string | null => {
  const match = url.match(new RegExp('[?&#]' + name + '=([^&#]+)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const processedTokens = new Set<string>();

const LoginScreen = ({ navigation }: any) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  // 비밀번호 재설정 모달 상태
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState(''); 
  const [resetToken, setResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldownTimer > 0) {
      timer = setTimeout(() => setCooldownTimer(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownTimer]);

  const closeForgotModal = () => {
    setIsForgotModalVisible(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotConfirmPassword(''); 
    setResetToken('');
    setCooldownTimer(0);
  };

  const appReturnUrl = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({ path: 'oauthredirect' });

  // 🌟 1. 일반 (로컬) 로그인 - 상세 에러 핸들링 보완
  const handleLogin = async () => {
    if (!id.trim() || !password) {
      return showAlert({ title: '알림', message: '아이디(이메일)와 비밀번호를 모두 입력해 주세요.' });
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: id.trim(),
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
      // 서버에서 전달하는 error code 또는 status 기반 세부 안내
      const errorCode = error.response?.data?.code;
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      let title = '로그인 실패';
      let message = '아이디 또는 비밀번호가 일치하지 않습니다.';

      if (errorCode === 'USER_NOT_FOUND' || errorCode === 'INVALID_CREDENTIALS') {
        message = '등록되지 않은 이메일이거나 \n 비밀번호가 올바르지 않습니다.';
      } else if (errorCode === 'SOCIAL_LOGIN_ACCOUNT') {
        message = '소셜 로그인(구글/카카오/라인)으로 가입된 계정입니다. 해당 소셜 버튼으로 로그인해 주세요.';
      } else if (errorCode === 'EMAIL_NOT_VERIFIED' || status === 403) {
        title = '이메일 미인증';
        message = '이메일 인증이 완료되지 않은 계정입니다. 메일함에서 인증을 완료해 주세요.';
      } else if (status >= 500) {
        title = '서버 오류';
        message = '서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      } else if (serverMessage) {
        message = serverMessage;
      } else if (!error.response) {
        title = '네트워크 오류';
        message = '인터넷 연결 상태를 확인한 후 다시 시도해 주세요.';
      }

      showAlert({ title, message });
    }
  };

  // ==========================================
  // 2. 소셜 로그인
  // ==========================================
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

    const isNewUser = response.data?.isNewUser ?? response.data?.newUser ?? false;
    navigation.navigate(isNewUser ? 'SocialSignUp' : 'MainTab');
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const url = window.location.href;
    const provider = getUrlParam(url, 'provider') as SocialProvider | null;
    if (provider !== 'google' && provider !== 'kakao' && provider !== 'line') return;

    const tokenVal = provider === 'google'
      ? getUrlParam(url, 'id_token')
      : getUrlParam(url, 'code');
    if (!tokenVal) return;

    window.history.replaceState(null, '', window.location.pathname);

    const config =
      provider === 'google' ? OAUTH_CONFIG.GOOGLE :
      provider === 'kakao' ? OAUTH_CONFIG.KAKAO : OAUTH_CONFIG.LINE;

    setSocialLoading(true);
    sendSocialTokenToBackend(provider, tokenVal, config.REDIRECT_URI)
      .catch((error: any) => {
        const errorMessage = error.response?.data?.message || '소셜 인증 처리 중 오류가 발생했습니다.';
        showAlert({ title: '소셜 로그인 실패', message: errorMessage });
      })
      .finally(() => setSocialLoading(false));
  }, []);

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
          const errorMessage = error.response?.data?.message || '소셜 인증 처리 중 오류가 발생했습니다.';
          showAlert({ title: '소셜 로그인 실패', message: errorMessage });
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
        showAlert({ title: '설정 오류', message: `.env 환경 변수에 ${provider.toUpperCase()} 클라이언트 ID가 설정되어 있지 않습니다.` });
        return;
      }

      const params: Record<string, string> = {
        client_id: config.CLIENT_ID,
        redirect_uri: config.REDIRECT_URI,
        state: appReturnUrl,
      };

      if (provider === 'google') {
        params.response_type = 'id_token';
        params.scope = 'openid email profile';
        params.nonce = Crypto.randomUUID();
      } else {
        params.response_type = 'code';
        if (provider === 'line') params.scope = 'profile openid';
      }

      const authUrl = `${AUTH_ENDPOINTS[provider]}?${toQuery(params)}`;

      if (Platform.OS !== 'web' && provider === 'kakao') {
        await Linking.openURL(authUrl);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, appReturnUrl);

      if (result.type !== 'success' || !result.url) return; 

      const tokenVal = provider === 'google'
        ? getUrlParam(result.url, 'id_token')
        : getUrlParam(result.url, 'code');

      if (!tokenVal) {
        showAlert({ title: '로그인 실패', message: '소셜 로그인 토큰 정보를 받아오지 못했습니다. 다시 시도해 주세요.' });
        return;
      }

      await sendSocialTokenToBackend(provider, tokenVal, config.REDIRECT_URI);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '소셜 로그인 도중 오류가 발생했습니다.';
      showAlert({ title: '소셜 로그인 실패', message: errorMessage });
    } finally {
      setSocialLoading(false);
    }
  };

  // ==========================================
  // 3. 비밀번호 재설정 (Forgot Password) 로직
  // ==========================================
  
  // Step 1: 인증 코드 발송
  const handleRequestResetCode = async () => {
    const email = forgotEmail.trim(); 
    if (!email) return showAlert({ title: '알림', message: '가입 시 등록한 이메일을 입력해 주세요.' });
    
    setForgotLoading(true);
    Keyboard.dismiss(); 

    try {
      await axios.post(`${API_BASE_URL}/forgot-password`, { email: email });
      showAlert({ title: '발송 완료', message: '인증 코드가 이메일로 발송되었습니다. 10분 안에 입력해 주세요.' });
      setForgotStep(2);
      setCooldownTimer(60); 
    } catch (error: any) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || '인증 메일 발송에 실패했습니다. 이메일을 다시 확인해 주세요.';

      switch(code) {
        case 'USER_NOT_FOUND': 
          showAlert({ title: '계정 없음', message: '가입되지 않은 이메일 주소입니다.' }); 
          break;
        case 'SOCIAL_LOGIN_ACCOUNT': 
          showAlert({ title: '소셜 계정', message: '소셜 로그인(구글/카카오/라인)으로 가입된 계정은 비밀번호를 재설정할 수 없습니다.' }); 
          break;
        case 'EMAIL_NOT_VERIFIED': 
          showAlert({ title: '미인증 계정', message: '회원가입 인증이 아직 완료되지 않은 이메일입니다.' }); 
          break;
        case 'CODE_RESEND_COOLDOWN': 
          showAlert({ title: '재발송 제한', message: '인증 코드가 이미 발송되었습니다. 잠시 후 다시 시도해 주세요.' }); 
          break;
        case 'EMAIL_SEND_FAILED': 
          showAlert({ title: '발송 오류', message: '메일 서버 연결 장애로 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.' }); 
          break;
        case 'VALIDATION_ERROR': 
          showAlert({ title: '형식 오류', message: '올바른 이메일 형식이 아닙니다.' }); 
          break;
        default: 
          showAlert({ title: '오류', message: msg });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: 코드 검증
  const handleVerifyResetCode = async () => {
    const codeStr = forgotCode.trim();
    const emailStr = forgotEmail.trim();
    if (!codeStr) return showAlert({ title: '알림', message: '6자리 인증 코드를 입력해 주세요.' });
    
    setForgotLoading(true);
    Keyboard.dismiss();

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-reset-code`, { 
        email: emailStr, 
        code: codeStr 
      });
      setResetToken(response.data.resetToken);
      setForgotStep(3); 
    } catch (error: any) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || '인증 코드 검증에 실패했습니다.';

      switch(code) {
        case 'CODE_MISMATCH': 
          showAlert({ title: '인증 실패', message: '인증 코드가 일치하지 않습니다. 다시 확인해 주세요.' }); 
          break;
        case 'TOO_MANY_ATTEMPTS': 
          showAlert({ title: '시도 횟수 초과', message: '인증 시도 횟수를 초과하여 코드가 만료되었습니다. 인증 코드를 다시 요청해 주세요.' }); 
          setForgotStep(1); 
          break;
        case 'CODE_EXPIRED':
        case 'CODE_NOT_FOUND_OR_EXPIRED': 
          showAlert({ title: '코드 만료', message: '인증 번호 유효 시간이 만료되었습니다. 코드를 다시 요청해 주세요.' }); 
          setForgotStep(1);
          break;
        case 'USER_NOT_FOUND': 
          showAlert({ title: '오류', message: '존재하지 않는 계정입니다.' }); 
          setForgotStep(1); 
          break;
        default: 
          showAlert({ title: '오류', message: msg });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: 새 비밀번호 저장
  const handleResetPassword = async () => {
    if (!forgotNewPassword) return showAlert({ title: '알림', message: '새 비밀번호를 입력해 주세요.' });
    if (!forgotConfirmPassword) return showAlert({ title: '알림', message: '비밀번호 확인 칸을 입력해 주세요.' });
    if (forgotNewPassword !== forgotConfirmPassword) return showAlert({ title: '알림', message: '새 비밀번호가 서로 일치하지 않습니다.' });
    
    setForgotLoading(true);
    Keyboard.dismiss();

    try {
      await axios.post(`${API_BASE_URL}/reset-password`, { 
        resetToken: resetToken, 
        newPassword: forgotNewPassword 
      });
      showAlert({
        title: '변경 완료',
        message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
      }).then(closeForgotModal);
    } catch (error: any) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message || '비밀번호 변경에 실패했습니다.';

      switch(code) {
        case 'RESET_TOKEN_EXPIRED':
        case 'INVALID_RESET_TOKEN':
          showAlert({ title: '인증 만료', message: '비밀번호 재설정 세션이 만료되었습니다. 처음부터 다시 시도해 주세요.' }); 
          setForgotStep(1);
          break;
        case 'VALIDATION_ERROR': 
          showAlert({ title: '비밀번호 규칙 오류', message: msg || '영문, 숫자, 특수문자 조합 규칙을 확인해 주세요.' }); 
          break;
        default: 
          showAlert({ title: '오류', message: msg });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Image source={require('../../../assets/quring_logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>환영합니다!</Text>
          <Text style={styles.subTitle}>오늘의 학습을 시작할 준비가 되셨나요?</Text>

          <View style={styles.inputSection}>
            <Text style={styles.label}>ID</Text>
            <CustomInput iconName="person-outline" placeholder="이메일을 입력해 주세요." value={id} onChangeText={setId} autoCapitalize="none" />
            
            <Text style={styles.label}>PASSWORD</Text>
            <CustomInput iconName="lock-closed-outline" placeholder="비밀번호를 입력해 주세요." secureTextEntry value={password} onChangeText={setPassword} />
            
            <TouchableOpacity style={styles.forgotBtn} onPress={() => setIsForgotModalVisible(true)}>
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>

          <CustomButton title="로그인 ➔" onPress={handleLogin} />

          <View style={styles.dividerContainer}>
            <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialLogin('google')} disabled={socialLoading}>
              <Image source={require('../../../assets/google.png')} style={styles.socialIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialLogin('kakao')} disabled={socialLoading}>
              <Image source={require('../../../assets/kakaoTalk-Flaticon.png')} style={styles.socialIcon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialCircle} onPress={() => handleSocialLogin('line')} disabled={socialLoading}>
              <Image source={require('../../../assets/line.png')} style={styles.socialIcon} />
            </TouchableOpacity>
          </View> 

          <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signUpLink}>
            <Text style={styles.signUpText}>계정이 없으신가요? <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>회원가입</Text></Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>

      {/* 비밀번호 재설정 모달 */}
      <Modal visible={isForgotModalVisible} transparent={true} animationType="fade" onRequestClose={closeForgotModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Keyboard.dismiss}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              
              {/* Step 1: 이메일 입력 */}
              {forgotStep === 1 && (
                <>
                  <Text style={styles.modalTitle}>비밀번호 재설정</Text>
                  <Text style={styles.modalSubTitle}>가입하신 이메일을 입력해 주세요.</Text>
                  <CustomInput iconName="mail-outline" placeholder="user@example.com" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" />
                  
                  <View style={styles.modalBtnGroup}>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={closeForgotModal} disabled={forgotLoading}>
                      <Text style={styles.modalCancelBtnText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalSubmitBtn]} onPress={handleRequestResetCode} disabled={forgotLoading}>
                      {forgotLoading ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.modalSubmitBtnText}>코드 발송</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 2: 코드 검증 */}
              {forgotStep === 2 && (
                <>
                  <Text style={styles.modalTitle}>인증 코드 입력</Text>
                  <Text style={styles.modalSubTitle}>이메일로 발송된 6자리 코드를 입력해 주세요.</Text>
                  <CustomInput iconName="keypad-outline" placeholder="123456" value={forgotCode} onChangeText={setForgotCode} keyboardType="numeric" />
                  
                  <TouchableOpacity 
                    style={{ alignSelf: 'flex-end', marginTop: 10, marginBottom: 5 }} 
                    onPress={handleRequestResetCode} 
                    disabled={cooldownTimer > 0 || forgotLoading}
                  >
                    <Text style={[styles.forgotText, { color: cooldownTimer > 0 ? theme.colors.textDisabled : theme.colors.primary }]}>
                      {cooldownTimer > 0 ? `${cooldownTimer}초 후 재요청 가능` : '코드 재발송'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.modalBtnGroup}>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={closeForgotModal} disabled={forgotLoading}>
                      <Text style={styles.modalCancelBtnText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalSubmitBtn]} onPress={handleVerifyResetCode} disabled={forgotLoading}>
                      {forgotLoading ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.modalSubmitBtnText}>인증하기</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: 새 비밀번호 입력 */}
              {forgotStep === 3 && (
                <>
                  <Text style={styles.modalTitle}>새 비밀번호 설정</Text>
                  <Text style={styles.modalSubTitle}>영문 대소문자, 숫자, 특수문자를 조합해주세요.</Text>
                  <CustomInput iconName="lock-closed-outline" placeholder="새 비밀번호 입력" secureTextEntry value={forgotNewPassword} onChangeText={setForgotNewPassword} />
                  
                  <View style={{ marginTop: 10 }}>
                    <CustomInput iconName="checkmark-circle-outline" placeholder="새 비밀번호 확인" secureTextEntry value={forgotConfirmPassword} onChangeText={setForgotConfirmPassword} />
                  </View>
                  
                  <View style={styles.modalBtnGroup}>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={closeForgotModal} disabled={forgotLoading}>
                      <Text style={styles.modalCancelBtnText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalSubmitBtn]} onPress={handleResetPassword} disabled={forgotLoading}>
                      {forgotLoading ? <ActivityIndicator color={theme.colors.surface} /> : <Text style={styles.modalSubmitBtnText}>변경 완료</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}

            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 20, justifyContent: 'center' },
  logo: { width: 150, height: 80, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text },
  subTitle: { fontSize: 14, color: theme.colors.textSub, marginBottom: 30 },
  inputSection: { width: '100%', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: theme.colors.text, marginBottom: 5, marginLeft: 5 },
  forgotBtn: { alignSelf: 'center', marginTop: 15, marginBottom: 10 }, 
  forgotText: { fontSize: 13, color: theme.colors.textMuted, textDecorationLine: 'underline' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30, width: '80%' },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.textDisabled },
  orText: { marginHorizontal: 10, color: theme.colors.textHint, fontSize: 12 },
  socialContainer: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  socialCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  socialIcon: { width: 48, height: 48, resizeMode: 'contain' as const },
  signUpLink: { marginTop: 10 },
  signUpText: { color: theme.colors.textSub },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 25, elevation: 5, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10 },
  modalSubTitle: { fontSize: 13, color: theme.colors.textSub, marginBottom: 20 },
  modalBtnGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancelBtn: { backgroundColor: theme.colors.border },
  modalCancelBtnText: { color: theme.colors.textSub, fontWeight: 'bold', fontSize: 15 },
  modalSubmitBtn: { backgroundColor: theme.colors.primary },
  modalSubmitBtnText: { color: theme.colors.surface, fontWeight: 'bold', fontSize: 15 },
});

export default LoginScreen;