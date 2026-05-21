// src/screens/auth/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
// RootNavigator에서 사용하는 param list 타입 정의를 가져와야 에러가 안 납니다. (일단 any 처리)
// import { RootStackParamList } from '../../navigation/RootNavigator'; 

const SplashScreen = ({ navigation }: any) => {

  // 🌟 마법의 코드: 2초 뒤에 로그인 화면으로 자동 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      // 뼈대 앱일 때는 바로 메인으로 가게 initialRouteName을 MainTab으로 바꿨었지만,
      // 이제 로그인 화면부터 UI를 만들 거니까 'Login'으로 이동하게 둡니다.
      // (테스트가 귀찮으시면 'MainTab'으로 적으셔도 됩니다.)
      navigation.replace('Login'); 
    }, 2000); // 2000ms = 2초

    // 컴포넌트가 꺼질 때 타이머를 정리해 줍니다 (에러 방지)
    return () => clearTimeout(timer);
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