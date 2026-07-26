// src/screens/auth/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../../constants/theme';

// 🌟 백엔드 기본 주소
const API_BASE_URL = 'https://q-ring.app/api/v1/auth';

const SplashScreen = ({ navigation }: any) => {

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      // 🌟 웹 소셜 로그인 복귀 중(URL에 code/id_token 존재)이면 자동 로그인을 건너뛰고
      // 로그인 화면으로 바로 이동해 인증 코드를 처리하게 한다.
      if (Platform.OS === 'web' && /[?&#](code|id_token)=/.test(window.location.search + window.location.hash)) {
        navigation.replace('Login');
        return;
      }

      // 🌟 시작 시간 기록 (최소 2초 대기 UX를 위함)
      const startTime = Date.now();
      let isAuthSuccess = false;

      try {
        const savedRefreshToken = await AsyncStorage.getItem('refreshToken');

        // 🌟 1. 리프레시 토큰이 있다면 백엔드에 새 토큰 발급 요청
        if (savedRefreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/refresh`, {
              refreshToken: savedRefreshToken
            });

            const { accessToken, refreshToken } = response.data;

            if (accessToken) {
              await AsyncStorage.setItem('accessToken', accessToken);
              if (refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshToken);
              }
              isAuthSuccess = true; // 자동 로그인 성공!
            }
          } catch (apiError) {
            console.log('Refresh Token 만료 또는 유효하지 않음:', apiError);
            // 만료된 토큰 청소
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
          }
        }
      } catch (error) {
        console.error('스플래시 스토리지 에러:', error);
      } finally {
        // 🌟 2. 통신에 걸린 시간을 빼고, 남은 시간만큼만 대기해서 최소 2초(2000ms)는 로고를 보여줌
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);

        setTimeout(() => {
          if (isAuthSuccess) {
            navigation.replace('MainTab'); // 토큰이 유효하면 메인으로
          } else {
            navigation.replace('Login');   // 토큰이 없거나 만료면 로그인으로
          }
        }, remainingTime);
      }
    };

    checkAuthAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* 🌟 중요: 이 화면에서는 상단 바(시계, 배터리 등)를 안보이게 하거나 투명하게 만듭니다 */}
      <StatusBar hidden={true} />
      
      {/* 🌟 로고 영역 */}
      <View style={styles.contentBlock}>
        <Image 
          // 1. 아까assets에 넣은 로고 이미지를 불러옵니다.
          source={require('../../../assets/quring_logo.png')} 
          style={styles.logoImage}
          resizeMode="contain" // 이미지가 비율대로 다 보이게 함
        />
      </View>

      {/* 🌟 하단 텍스트 영역 */}
      <Text style={styles.subText}>
        쉽고 즐거운 학습 파트너 Qring
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 🌟 디자인 테마에서 가져온 공통 배경색 (#E9E9DB)
    backgroundColor: theme.colors.background, 
    alignItems: 'center', // 가로 중앙 정렬
    justifyContent: 'center', // 세로 중앙 정렬 (로고가 가운데 오게)
  },
  contentBlock: {
    // 🌟 로고와 글씨를 중앙 정렬하고 사이 간격을 조절합니다.
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50, 
  },
  logoImage: {
    // 시안 크기와 비슷하게 가로 높이 지정
    width: 250,
    height: 100,
  },
  subText: {
    marginTop: 20,
    fontSize: 16,
    color: '#3A3A3A', // 시안과 비슷한 진회색
    fontFamily: theme.fonts.body, // 앞서 정리한 본문용 폰트 적용
    fontWeight: '500',
  },
});

export default SplashScreen;