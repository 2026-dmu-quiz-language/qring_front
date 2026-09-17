import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { startStorySession } from '../api/story';
import { showAlert, showConfirm } from '../components/common/AlertHost';
import { Header } from '../components/layout/Header'; 

const TONE_OPTIONS = ['다정하게', '격식있게', '유머러스하게', '차분하게', '까칠하게', '열정적으로', '장난스럽게'];
// 🌟 티어 옵션 정의
const TIER_OPTIONS = [
  { label: '기본 모델', value: 'standard', cost: 400 },
  { label: '프리미엄 모델 (+150)', value: 'premium', cost: 550 }
];

export default function StoryCreateScreen({ navigation }: any) {
  const [characterName, setCharacterName] = useState('');
  const [situationDescription, setSituationDescription] = useState('');
  const [tone, setTone] = useState('다정하게');
  const [modelTier, setModelTier] = useState('standard'); // 🌟 티어 상태 추가
  const [loading, setLoading] = useState(false);

  const executeStoryCreate = async () => {
    try {
      setLoading(true);
      const response = await startStorySession({
        characterName,
        situationDescription,
        tone,
        targetLanguage: "English",
        modelTier, // 🌟 API 요청에 티어 추가
      });
      navigation.replace('StoryChat', { storyData: response });
    } catch (error) {
      console.error('스토리 생성 실패:', error);
      showAlert({ title: '오류', message: '스토리 생성에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!characterName.trim() || !situationDescription.trim()) {
      await showAlert({ title: '알림', message: '이름과 상황을 모두 입력해주세요.' });
      return;
    }

    // 🌟 선택된 티어에 따라 안내 메시지 금액 변경
    const currentCost = modelTier === 'premium' ? 550 : 400;

    const isConfirmed = await showConfirm({
      title: '포인트 차감 안내',
      message: `스토리 생성 버튼을 클릭하면 ${currentCost}포인트가 차감됩니다.\n계속하시겠습니까?`,
      confirmText: '확인',
      cancelText: '취소',
    });

    if (isConfirmed) executeStoryCreate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Header title="나만의 스토리 만들기" leftType="back" rightType="none" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            
            <View style={styles.inputSection}>
              <Text style={styles.label}>상대방의 이름은 무엇인가요?</Text>
              <TextInput style={styles.textInput} placeholder="예: 지민, John" placeholderTextColor="#999" value={characterName} onChangeText={setCharacterName} />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>어떤 상황을 원하시나요?</Text>
              <TextInput style={[styles.textInput, styles.textArea]} placeholder="예: 뉴욕 카페에서 수다 떠는 상황" placeholderTextColor="#999" value={situationDescription} onChangeText={setSituationDescription} multiline textAlignVertical="top" />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>대화 분위기</Text>
              <View style={styles.chipContainer}>
                {TONE_OPTIONS.map((option) => (
                  <TouchableOpacity key={option} style={[styles.chip, tone === option && styles.chipActive]} onPress={() => setTone(option)}>
                    <Text style={[styles.chipText, tone === option && styles.chipTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 🌟 AI 모델 티어 선택 영역 추가 */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>AI 모델 선택</Text>
              <View style={styles.chipContainer}>
                {TIER_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.value} style={[styles.chip, modelTier === option.value && styles.chipActive]} onPress={() => setModelTier(option.value)}>
                    <Text style={[styles.chipText, modelTier === option.value && styles.chipTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleCreateStory} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="sparkles" size={20} color="#FFF" style={styles.btnIcon} /><Text style={styles.submitButtonText}>스토리 생성하기</Text></>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBEBE0' },
  scrollContent: { padding: 20 },
  formCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  inputSection: { marginBottom: 32 },
  label: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 12 },
  textInput: { backgroundColor: '#EBEBE0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#333' },
  textArea: { height: 100, paddingTop: 14 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: '#F0F0E8', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  chipActive: { backgroundColor: '#5D7341' },
  chipText: { color: '#666', fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  footer: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  submitButton: { backgroundColor: '#6B8E23', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 30, shadowColor: '#6B8E23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitButtonDisabled: { opacity: 0.7 },
  btnIcon: { marginRight: 8 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});