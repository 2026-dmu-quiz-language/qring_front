// screens/auth/EmailVerifyScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../components/common/Text';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { showAlert } from '../../components/common/AlertHost';
import { theme } from '../../constants/theme';

const API_BASE_URL = 'https://q-ring.app/api/v1/auth';

const EmailVerifyScreen = ({ route, navigation }: any) => {
  // SignUpScreen에서 넘겨받은 이메일 주소
  const { email } = route.params; 
  const [code, setCode] = useState('');

  // 🌟 1. 메일 확인 코드 API (POST)
  const handleVerify = async () => {
    if (!code) return showAlert({ title: '알림', message: '인증 코드를 입력해 주세요.' });

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-email`, {
        email: email,
        code: code,
      });

      if (response.data.success) {
        // 성공 시 받아온 토큰을 디바이스에 저장
        await AsyncStorage.setItem('accessToken', response.data.accessToken);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }

        await showAlert({
          title: '인증 성공',
          message: '회원가입이 완벽하게 끝났습니다!',
          confirmText: '학습 시작하기',
        });
        navigation.navigate('MainTab');
      } else {
        showAlert({ title: '인증 실패', message: '잘못된 코드입니다. 다시 확인해 주세요.' });
      }
    } catch (error: any) {
      console.error('Verify Error:', error);
      showAlert({ title: '오류', message: '인증에 실패했습니다. 코드를 다시 확인해 주세요.' });
    }
  };

  // 🌟 2. 재요청 API (POST)
  const handleResend = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/resend-code`, {
        email: email,
      });

      if (response.data.success) {
        showAlert({ title: '재전송 완료', message: response.data.message || '인증 코드를 다시 발송했습니다.' });
      } else {
        showAlert({ title: '재전송 실패', message: '코드 발송에 실패했습니다.' });
      }
    } catch (error) {
      console.error('Resend Error:', error);
      showAlert({ title: '에러', message: '재발송 요청 중 문제가 발생했습니다.' });
    }
  };

  return (
    <ScreenWrapper>
      <Header leftType="back" title="이메일 인증" />
      <View style={styles.container}>
        <Text style={styles.title}>인증 코드를 입력해주세요</Text>
        <Text style={styles.subtitle}>
          <Text style={{ fontWeight: 'bold' }}>{email}</Text> 으로{'\n'}6자리 인증 코드를 발송했습니다.
        </Text>

        <View style={styles.inputWrap}>
          <CustomInput 
            iconName="key-outline" 
            placeholder="인증 코드 6자리" 
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        </View>

        <CustomButton title="인증 완료하기" onPress={handleVerify} />

        <TouchableOpacity style={styles.resendBtn} onPress={handleResend}>
          <Text style={styles.resendText}>코드를 받지 못하셨나요? <Text style={{ fontWeight: 'bold' }}>재전송</Text></Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSub,
    lineHeight: 22,
    marginBottom: 40,
  },
  inputWrap: {
    marginBottom: 20,
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
});

export default EmailVerifyScreen;