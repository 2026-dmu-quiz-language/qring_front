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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { theme } from '../../constants/theme';
const { colors, fonts } = theme;
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Header } from '../../components/layout/Header';

// 💡 백엔드 기본 서버 주소 (환경에 맞게 수정해주세요)
const BASE_URL = 'https://api.your-qring-server.com';

export const AccountManagementScreen = ({ navigation }: any) => {
  // ─── 상태 관리 (State) ───
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 [임시 토큰 조회 함수] : 실제 운영 시에는 AsyncStorage 나 상태 관리 라이브러리(Zustand 등)에서 가져와야 합니다.
  const getAuthToken = async () => {
    return 'your-auth-token-example';
  };

  // ─── [1] API: 화면 로드 시 사용자 설정 정보 조회 ───
  const fetchUserSettings = async () => {
    try {
      setIsLoading(true);
      const token = await getAuthToken();

      // 명세 반영: /mypage/setting 엔드포인트로 POST 요청하며 JSON body에 token 전송
      const response = await axios.post(`${BASE_URL}/mypage/setting`, {
        token: token,
      });

      // 백엔드 응답 JSON을 기존 더미 데이터 상태에 각각 바인딩
      if (response.data) {
        setUserId(response.data.id || response.data.userId || '');
        setNickname(response.data.nickname || '');
        setIsPushEnabled(Boolean(response.data.pushEnabled || response.data.isPushEnabled));
      }
    } catch (error) {
      console.error('사용자 설정 조회 에러:', error);
      Alert.alert('오류', '계정 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSettings();
  }, []);

  // ─── [2] API: 닉네임 중복 및 사용 가능 여부 확인 ───
  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    try {
      // 명세 반영: /check-nickname 엔드포인트로 GET 요청하며 쿼리 파라미터로 nickname 전송
      const response = await axios.get(`${BASE_URL}/check-nickname`, {
        params: { nickname: nickname.trim() },
      });

      // 백엔드에서 온 boolean 값 확인
      const isAvailable = response.data.isAvailable !== undefined ? response.data.isAvailable : response.data;

      if (isAvailable) {
        Alert.alert('확인 완료', '사용 가능한 닉네임입니다.');
      } else {
        Alert.alert('불가', '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      }
    } catch (error) {
      console.error('닉네임 확인 에러:', error);
      Alert.alert('오류', '닉네임 중복 확인 중 문제가 발생했습니다.');
    }
  };

  // ─── [3] API: 계정 정보 및 비밀번호 수정 ───
  const handleUpdateAccount = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('알림', '모든 비밀번호 항목을 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const token = await getAuthToken();

      // 명세 반영: /mypage/update 엔드포인트로 POST 요청하며 JSON 형식으로 데이터 전송
      const payload = {
        token: token,
        nickname: nickname.trim(),
        password: newPassword, // 새 변경 비밀번호 전송
        pushEnabled: isPushEnabled,
      };

      await axios.post(`${BASE_URL}/mypage/update`, payload);

      Alert.alert('성공', '비밀번호 및 계정 정보가 성공적으로 변경되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          },
        },
      ]);
    } catch (error) {
      console.error('계정 정보 업데이트 에러:', error);
      Alert.alert('오류', '정보 수정 중 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // ─── 기타 핸들러 ───
  const handleTogglePush = (value: boolean) => {
    setIsPushEnabled(value);
    // 필요 시 알림 상태 토글 단독 API를 여기에 추가로 연결할 수 있습니다.
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 탈퇴하시겠습니까? 모든 정보가 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '탈퇴', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              await axios.delete(`${BASE_URL}/api/users/withdraw`, { data: { token } });
              Alert.alert('안내', '탈퇴 처리가 완료되었습니다.');
            } catch (e) {
              Alert.alert('오류', '탈퇴 처리 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Header 
        title="계정 관리" 
        leftType="back" 
        rightType="none" 
      />

      {/* 로딩 표시기 처리 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          
          {/* 회원 정보 수정 카드 */}
          <Text style={styles.sectionTitle}>회원 정보 수정</Text>
          <View style={styles.card}>
            
            {/* 아이디 (읽기 전용) */}
            <Text style={styles.label}>아이디</Text>
            <View style={styles.disabledInputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#8A9A86" style={styles.inputIcon} />
              <Text style={styles.disabledInputText}>{userId || '아이디 없음'}</Text>
            </View>

            {/* 닉네임 */}
            <Text style={styles.label}>닉네임</Text>
            <View style={styles.rowContainer}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#A0A89C"
              />
              <TouchableOpacity style={styles.smallButton} onPress={handleCheckNickname}>
                <Text style={styles.smallButtonText}>변경</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* 비밀번호 변경 */}
            <Text style={styles.label}>비밀번호 변경</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="현재 비밀번호"
              placeholderTextColor="#A0A89C"
              secureTextEntry
            />
            <TextInput
              style={[styles.input, styles.marginTop]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="새 비밀번호"
              placeholderTextColor="#A0A89C"
              secureTextEntry
            />
            <TextInput
              style={[styles.input, styles.marginTop]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호 확인"
              placeholderTextColor="#A0A89C"
              secureTextEntry
            />
            <TouchableOpacity style={styles.fullButton} onPress={handleUpdateAccount}>
              <Text style={styles.fullButtonText}>비밀번호 변경</Text>
            </TouchableOpacity>
          </View>

          {/* 알림 설정 */}
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

          {/* 탈퇴 안내 및 버튼 */}
          <View style={styles.withdrawSection}>
            <Text style={styles.withdrawGuide}>ⓘ 탈퇴 시 모든 정보가 삭제됩니다.</Text>
            <TouchableOpacity style={styles.withdrawButton} onPress={handleDeleteAccount}>
              <Text style={styles.withdrawButtonText}>회원 탈퇴</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 0, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.headline, fontWeight: '700', color: '#2C3A29', marginBottom: 12 },
  sectionMargin: { marginTop: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontFamily: fonts.label, fontWeight: '600', color: '#4E5E43', marginBottom: 8, marginTop: 12 },
  disabledInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2EE', borderRadius: 20, paddingHorizontal: 16, height: 48 },
  inputIcon: { marginRight: 8 },
  disabledInputText: { fontSize: 14, color: '#6B7A68', fontFamily: fonts.body },
  rowContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexInput: { flex: 1 },
  input: { height: 48, borderWidth: 1, borderColor: '#DCE2D6', borderRadius: 20, paddingHorizontal: 16, fontSize: 14, color: '#2C3A29', fontFamily: fonts.body, backgroundColor: '#FFFFFF' },
  marginTop: { marginTop: 10 },
  smallButton: { backgroundColor: colors.primary, paddingHorizontal: 20, height: 48, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  smallButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontFamily: fonts.label },
  divider: { height: 1, backgroundColor: '#E9E9DB', marginVertical: 20 },
  fullButton: { backgroundColor: colors.primary, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  fullButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: fonts.headline },
  textContainer: { flex: 1 },
  pushTitle: { fontSize: 15, fontWeight: '700', color: '#2C3A29', fontFamily: fonts.headline, marginBottom: 4 },
  pushSub: { fontSize: 12, color: '#6B7A68', fontFamily: fonts.body },
  withdrawSection: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  withdrawGuide: { fontSize: 12, color: '#6B7A68', fontFamily: fonts.body, marginBottom: 12 },
  withdrawButton: { borderWidth: 1, borderColor: colors.tertiary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: 'transparent' },
  withdrawButtonText: { fontSize: 13, color: '#5C4E3C', fontWeight: '600', fontFamily: fonts.label },
});