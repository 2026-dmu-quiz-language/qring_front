// src/screens/MyPage/AccountManagementScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
const { colors, fonts } = theme;
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';
import { showAlert, showConfirm } from '../../components/common/AlertHost';

const BASE_URL = 'https://q-ring.app/api/v1';

const AccountManagementScreen = ({ navigation, route }: any) => {
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState(route.params?.nickname || '');
  const [originalNickname, setOriginalNickname] = useState(route.params?.nickname || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);

  const getAuthToken = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return token || '';
  };

  const fetchUserSettings = async () => {
    try {
      setIsLoading(true);
      const token = await getAuthToken();

      const response = await axios.post(
        `${BASE_URL}/mypage/setting`,
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setUserId(response.data.id || response.data.userId || '');
        const serverNick = response.data.nickname || '';
        if (!nickname && serverNick) {
          setNickname(serverNick);
        }
        if (serverNick) {
          setOriginalNickname(serverNick);
        }
        setIsPushEnabled(Boolean(response.data.pushEnabled || response.data.isPushEnabled));
      }
    } catch (error) {
      console.error('사용자 설정 조회 에러:', error);
      showAlert({ title: '오류', message: '계정 정보를 불러오는데 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      showAlert({ title: '알림', message: '닉네임을 입력해주세요.' });
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/auth/check-nickname`, {
        params: { nickname: nickname.trim() },
      });

      const isAvailable = response.data.available;

      if (isAvailable) {
        setIsNicknameChecked(true);
        showAlert({ title: '확인 완료', message: '사용 가능한 닉네임입니다.' });
      } else {
        showAlert({ title: '불가', message: '이미 사용 중인 닉네임입니다.' });
      }
    } catch (error) {
      console.error('닉네임 확인 에러:', error);
      showAlert({ title: '오류', message: '닉네임 중복 확인 중 문제가 발생했습니다.' });
    }
  };

  const handleUpdateAccount = async () => {
    if (!nickname.trim()) {
      showAlert({ title: '알림', message: '닉네임을 입력해주세요.' });
      return;
    }

    if (nickname.trim() !== originalNickname.trim() && !isNicknameChecked) {
      showAlert({ title: '알림', message: '닉네임 중복 확인을 진행해주세요.' });
      return;
    }

    const isChangingPassword = currentPassword || newPassword || confirmPassword;

    if (isChangingPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert({ title: '알림', message: '비밀번호를 변경하려면 모든 비밀번호 항목을 입력해주세요.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        showAlert({ title: '오류', message: '새 비밀번호가 일치하지 않습니다.' });
        return;
      }
    }

    try {
      const token = await getAuthToken();
      const payload: any = {
        nickname: nickname.trim(),
        pushEnabled: isPushEnabled,
      };

      if (isChangingPassword) {
        payload.password = newPassword;
      }

      await axios.post(`${BASE_URL}/update`, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      showAlert({ title: '성공', message: '정보가 성공적으로 변경되었습니다.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigation.navigate('MainTab');
      
    } catch (error) {
      console.error('계정 정보 업데이트 에러:', error);
      showAlert({ title: '오류', message: '정보 수정 중 문제가 발생했습니다.' });
    }
  };

  const handleTogglePush = (value: boolean) => {
    setIsPushEnabled(value);
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = await showConfirm({
      title: '회원 탈퇴',
      message: '정말 탈퇴하시겠습니까?',
      confirmText: '탈퇴',
      cancelText: '취소',
      destructive: true,
    });
    if (!isConfirmed) return;

    try {
      const token = await getAuthToken();
      await axios.delete(`${BASE_URL}/api/users/withdraw`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await showAlert({ title: '안내', message: '탈퇴 처리가 완료되었습니다.' });
      navigation.navigate('Login');
    } catch (e) {
      await showAlert({ title: '오류', message: '탈퇴 처리 중 문제가 발생했습니다.' });
    }
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header title="계정 관리" leftType="back" rightType="none" />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={[
              styles.content, 
              { paddingBottom: Platform.OS === 'ios' ? 40 : 24 }
            ]}
            scrollEnabled={isPasswordSectionOpen} // 🌟 비밀번호 버튼을 누르면 스크롤 활성화
            showsVerticalScrollIndicator={isPasswordSectionOpen}
          >
            
            <Text style={styles.sectionTitle}>회원 정보 수정</Text>
            <View style={styles.card}>
              <Text style={styles.label}>아이디</Text>
              <View style={styles.disabledInputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#8A9A86" style={styles.inputIcon} />
                <Text style={styles.disabledInputText}>{userId || '아이디 없음'}</Text>
              </View>
              
              <Text style={styles.label}>닉네임</Text>
              <View style={styles.rowContainer}>
                <TextInput 
                  style={[styles.input, styles.flexInput]} 
                  value={nickname} 
                  onChangeText={(text) => {
                      setNickname(text);
                      setIsNicknameChecked(false);
                  }} 
                  placeholder="닉네임" 
                  placeholderTextColor="#A0A89C" 
                />
                <TouchableOpacity 
                  style={[styles.smallButton, isNicknameChecked && styles.smallButtonChecked]} 
                  onPress={handleCheckNickname}
                >
                  <Text style={styles.smallButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.dropdownHeader} 
                onPress={() => {
                  if (isPasswordSectionOpen) {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }
                  setIsPasswordSectionOpen(!isPasswordSectionOpen);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>비밀번호 변경</Text>
                <Ionicons 
                  name={isPasswordSectionOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#4E5E43" 
                />
              </TouchableOpacity>

              {isPasswordSectionOpen && (
                <View style={styles.dropdownContent}>
                  <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="현재 비밀번호" placeholderTextColor="#A0A89C" secureTextEntry />
                  <TextInput style={[styles.input, styles.marginTop]} value={newPassword} onChangeText={setNewPassword} placeholder="새 비밀번호" placeholderTextColor="#A0A89C" secureTextEntry />
                  <TextInput style={[styles.input, styles.marginTop]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="비밀번호 확인" placeholderTextColor="#A0A89C" secureTextEntry />
                </View>
              )}

              <TouchableOpacity style={styles.fullButton} onPress={handleUpdateAccount}>
                <Text style={styles.fullButtonText}>변경 완료</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionMargin]}>알림 설정</Text>
            <View style={[styles.card, styles.rowCard]}>
              <View style={styles.textContainer}>
                <Text style={styles.pushTitle}>전체 푸시 알림</Text>
                <Text style={styles.pushSub}>다양한 소식을 알림으로 받습니다.</Text>
              </View>
              <Switch 
                trackColor={{ false: '#DCE2D6', true: colors.primary }} 
                thumbColor={'#FFFFFF'} 
                onValueChange={handleTogglePush} 
                value={isPushEnabled} 
              />
            </View>

            <View style={styles.withdrawSection}>
              <Text style={styles.withdrawGuide}>ⓘ 탈퇴 시 모든 정보가 삭제됩니다.</Text>
              <TouchableOpacity style={styles.withdrawButton} onPress={handleDeleteAccount}>
                <Text style={styles.withdrawButtonText}>회원 탈퇴</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({ 
  wrapper: { paddingHorizontal: 0, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  
  sectionTitle: { fontSize: 16, fontFamily: fonts?.headline, fontWeight: '700', color: '#2C3A29', marginBottom: 12, marginLeft: 4 },
  sectionMargin: { marginTop: 28 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 24, 
    shadowColor: '#000', 
    shadowOpacity: 0.03, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 10, 
    elevation: 2 
  },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  label: { fontSize: 13, fontFamily: fonts?.label, fontWeight: '600', color: '#4E5E43', marginBottom: 8, marginTop: 16 },
  
  disabledInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4EB', borderRadius: 20, paddingHorizontal: 16, height: 50 },
  inputIcon: { marginRight: 8 },
  disabledInputText: { fontSize: 14, color: '#6B7A68', fontFamily: fonts?.body },
  
  rowContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flexInput: { flex: 1 },
  input: { height: 50, borderWidth: 1, borderColor: '#E0E8D5', borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: '#333', fontFamily: fonts?.body, backgroundColor: '#FFFFFF' },
  marginTop: { marginTop: 12 },
  
  smallButton: { backgroundColor: colors.primary, paddingHorizontal: 20, height: 50, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  smallButtonChecked: { backgroundColor: '#6B7A68' },
  smallButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontFamily: fonts?.label },
  
  divider: { height: 1, backgroundColor: '#F3F4EB', marginVertical: 24 },
  
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  dropdownContent: { marginTop: 16 },

  fullButton: { backgroundColor: colors.primary, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  fullButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: fonts?.headline },
  
  textContainer: { flex: 1 },
  pushTitle: { fontSize: 15, fontWeight: '700', color: '#333', fontFamily: fonts?.headline, marginBottom: 4 },
  pushSub: { fontSize: 12, color: '#888', fontFamily: fonts?.body },
  
  withdrawSection: { alignItems: 'center', marginTop: 50, marginBottom: 20 },
  withdrawGuide: { fontSize: 12, color: '#888', fontFamily: fonts?.body, marginBottom: 12 },
  withdrawButton: { borderWidth: 1, borderColor: colors.tertiary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, backgroundColor: 'transparent' },
  withdrawButtonText: { fontSize: 13, color: '#5C4E3C', fontWeight: '600', fontFamily: fonts?.label },
});

export default AccountManagementScreen;