import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { CustomInput } from '../../components/common/Input';
import { CustomButton } from '../../components/common/Button';
import { theme } from '../../constants/theme';

const SignUpScreen = ({ navigation }: any) => {
  return (
    <ScreenWrapper>
      <Header leftType="back" rightType="sprout" title="회원가입" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Image 
          source={require('../../../assets/quring_logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />

        <Text style={styles.title}>스토리로 빠져드는 즐거운 언어 학습,{'\n'}지금 시작해 보세요!</Text>

        <View style={styles.inputSection}>
          <Text style={styles.label}>아이디</Text>
          <CustomInput iconName="person-outline" placeholder="아이디를 입력해 주세요." />
          <Text style={styles.label}>비밀번호</Text>
          <CustomInput iconName="lock-closed-outline" placeholder="비밀번호를 입력해 주세요." secureTextEntry />
        </View>

        {/* 나만의 맞춤 학습 설정 */}
        <View style={styles.settingBox}>
          <Text style={styles.settingTitle}>⚙️ 나만의 맞춤 학습 설정</Text>
          
          <Text style={styles.subLabel}>언어 설정</Text>
          <View style={styles.row}>
            {['일본어', '영어', '중국어'].map((lang) => (
              <TouchableOpacity key={lang} style={[styles.chip, lang === '일본어' && styles.chipActive]}>
                <Text style={[styles.chipText, lang === '일본어' && styles.chipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>시작 레벨 선택</Text>
          <View style={styles.row}>
            {[ {lv: 'Lv.1', t: '왕초보'}, {lv: 'Lv.2', t: '일상 회화'}, {lv: 'Lv.3', t: '프리토킹'} ].map((item) => (
              <TouchableOpacity key={item.lv} style={[styles.levelCard, item.lv === 'Lv.1' && styles.levelCardActive]}>
                <Text style={styles.levelTag}>{item.t}</Text>
                <Text style={styles.levelText}>{item.lv}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footerLinks}>
          <Text style={styles.linkText}>개인정보처리방침</Text>
          <View style={styles.dot} />
          <Text style={styles.linkText}>서비스 이용약관</Text>
        </View>

        <CustomButton title="가입 완료 및 시작하기 ➔" onPress={() => navigation.navigate('MainTab')} />
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
  settingBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 2, marginBottom: 20 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  subLabel: { fontSize: 14, color: '#666', marginBottom: 10, marginTop: 10 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F0F0' },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { color: '#666' },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  levelCard: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: 15, backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: 'transparent' },
  levelCardActive: { borderColor: theme.colors.primary, backgroundColor: '#F9FAF5' },
  levelTag: { fontSize: 10, color: '#FFF', backgroundColor: '#AAB87B', paddingHorizontal: 8, borderRadius: 10, marginBottom: 5 },
  levelText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginVertical: 20 },
  linkText: { fontSize: 12, color: '#AAA', textDecorationLine: 'underline' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#AAA' }
});

export default SignUpScreen;