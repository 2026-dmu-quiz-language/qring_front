import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert // 🌟 Alert 컴포넌트 추가
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { startStorySession } from '../api/story';

const TONE_OPTIONS = [
  '다정하게', '격식있게', '유머러스하게', 
  '차분하게', '까칠하게', '열정적으로', '장난스럽게'
];

export default function StoryCreateScreen({ navigation }: any) {
  const [characterName, setCharacterName] = useState('');
  const [situationDescription, setSituationDescription] = useState('');
  const [tone, setTone] = useState('다정하게');
  const [loading, setLoading] = useState(false);

  const handleCreateStory = () => {
    if (!characterName.trim() || !situationDescription.trim()) {
      Alert.alert('알림', '이름과 상황을 모두 입력해주세요.');
      return;
    }

    // 🌟 포인트 차감 알림창 추가
    Alert.alert(
      '포인트 차감 안내',
      '스토리 생성 버튼을 클릭하면 300포인트가 차감됩니다.\n계속하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '확인',
          // 🌟 확인 버튼을 눌렀을 때 API 호출되도록 기존 로직 이동
          onPress: async () => {
            try {
              setLoading(true);
              const userTargetLanguage = "English"; 
              
              const response = await startStorySession({
                characterName,
                situationDescription,
                tone,
                targetLanguage: userTargetLanguage,
              });

              navigation.replace('StoryChat', { storyData: response });
              
            } catch (error) {
              console.error('스토리 생성 실패:', error);
              Alert.alert('오류', '스토리 생성에 실패했습니다. 다시 시도해주세요.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>나만의 스토리 만들기</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            
            {/* 1. 상대방 이름 입력 (주관식) */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>상대방의 이름은 무엇인가요?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="예: 지민, John"
                placeholderTextColor="#999"
                value={characterName}
                onChangeText={setCharacterName}
              />
            </View>

            {/* 2. 상황 입력 (주관식으로 변경됨) */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>어떤 상황을 원하시나요?</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="예: 뉴욕 카페에서 아메리카노와 디저트를 주문하며 수다 떠는 상황"
                placeholderTextColor="#999"
                value={situationDescription}
                onChangeText={setSituationDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* 3. 대화 분위기 선택 (객관식 확장) */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>대화 분위기</Text>
              <View style={styles.chipContainer}>
                {TONE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      tone === option && styles.chipActive
                    ]}
                    onPress={() => setTone(option)}
                  >
                    <Text style={[
                      styles.chipText,
                      tone === option && styles.chipTextActive
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleCreateStory}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" style={styles.btnIcon} />
                <Text style={styles.submitButtonText}>스토리 생성하기</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBEBE0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
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