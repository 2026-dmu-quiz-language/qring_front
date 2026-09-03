import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // 🌟 탭 복귀 시 새로고침을 위해 추가
import { 
  fetchStoryLibrary, 
  StoryArchive, 
  resumeStory, 
  StoryResumeResponse 
} from '../api/story';

export default function StoryMainScreen({ navigation }: any) {
  const [archives, setArchives] = useState<StoryArchive[]>([]);
  const [resume, setResume] = useState<StoryResumeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 화면 포커스 될 때마다 호출 (목록 갱신)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      // 보관함 목록 호출
      const libData = await fetchStoryLibrary();
      setArchives(libData.archives);
      
      // 이어하기 세션 확인 호출
      try {
        const resumeData = await resumeStory();
        setResume(resumeData);
      } catch (err) {
        setResume(null);
      }
    } catch (error) {
      console.error('데이터를 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerText}>보관함</Text>
          <View style={styles.profilePlaceholder}></View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>내가 만든 스토리</Text>
          <Text style={styles.subTitle}>
            직접 완성한 대화 기록을 다시 확인하고 복습해{'\n'}보세요.
          </Text>
        </View>

        {/* 🌟 이어하기 카드 렌더링 */}
        {resume?.has_session ? (
          <TouchableOpacity 
            style={styles.resumeCard}
            onPress={() => navigation.navigate('StoryChat', { resumeData: resume })}
          >
            <View>
              <Text style={styles.resumeTitle}>
                {resume.is_completed ? '저장 안 한 스토리가 있어요' : '진행 중인 대화가 있어요'}
              </Text>
              <Text style={styles.resumeSub}>{resume.character_name} · {resume.situation}</Text>
            </View>
            <Text style={styles.resumeLinkText}>이어하기 {'>'}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity 
          style={styles.newStoryButton}
          onPress={() => {
            navigation.navigate('StoryCreateScreen');
          }}
        >
          <View style={styles.plusIconCircle}>
            <Text style={styles.plusIconText}>+</Text>
          </View>
          <Text style={styles.newStoryText}>새로운 스토리 만들기</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#6B8E23" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.listContainer}>
            {archives.map((item) => (
              <TouchableOpacity 
                key={item.session_id} 
                style={styles.card}
                onPress={() => {
                  navigation.navigate('StoryRecord', { sessionId: item.session_id });
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {item.character_name}과의 {item.situation}
                  </Text>
                  <Text style={styles.cardDate}>{formatDate(item.archived_at)}</Text>
                </View>
                
                <View style={styles.tagContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>#{item.character_name}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>#{item.situation}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.recordLinkText}>기록 보기 {'>'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBEBE0' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 30 },
  headerText: { fontSize: 16, color: '#555', fontWeight: '600' },
  profilePlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#CCC' },
  titleSection: { marginBottom: 30 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  subTitle: { fontSize: 14, color: '#555', lineHeight: 20 },
  
  /* 🌟 이어하기 카드 스타일 추가 */
  resumeCard: { backgroundColor: '#5D7341', borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  resumeTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  resumeSub: { color: '#D5DFCA', fontSize: 13 },
  resumeLinkText: { color: '#E0E8D5', fontSize: 14, fontWeight: 'bold' },

  newStoryButton: { height: 140, borderWidth: 2, borderColor: '#C5D0B5', borderStyle: 'dashed', borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', marginBottom: 24 },
  plusIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E8D5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  plusIconText: { fontSize: 24, color: '#6B8E23', fontWeight: '300' },
  newStoryText: { fontSize: 16, color: '#6B8E23', fontWeight: '600' },
  listContainer: { gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', flex: 1 },
  cardDate: { fontSize: 13, color: '#999', marginLeft: 10 },
  tagContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: '#E0E8D5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  tagText: { color: '#7A9958', fontSize: 12, fontWeight: '600' },
  cardFooter: { alignItems: 'flex-end' },
  recordLinkText: { fontSize: 14, color: '#888' }
});