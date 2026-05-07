import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* 로고 및 인사말 */}
        <Image source={require('../../../assets/quring_logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>환영합니다!</Text>
        <Text style={styles.subTitle}>오늘의 학습을 시작할 준비가 되셨나요?</Text>

        {/* 입력 영역 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>ID</Text>
          <CustomInput iconName="person-outline" placeholder="아이디를 입력해 주세요." />
          <Text style={styles.label}>PASSWORD</Text>
          <CustomInput iconName="lock-closed-outline" placeholder="비밀번호를 입력해 주세요." secureTextEntry />
          
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>

        <CustomButton title="로그인 ➔" onPress={() => navigation.navigate('MainTab')} />

        {/* 소셜 로그인 영역 */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#FFF' }]}><Ionicons name="logo-google" size={24} color="#EA4335" /></TouchableOpacity>
          <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#FEE500' }]}><Ionicons name="chatbubble" size={24} color="#3C1E1E" /></TouchableOpacity>
          <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#06C755' }]}><Ionicons name="logo-whatsapp" size={24} color="#FFF" /></TouchableOpacity>
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
  forgotBtn: { alignSelf: 'flex-end', marginTop: 5 },
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