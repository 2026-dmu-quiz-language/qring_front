import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { fetchStoryLibrary, StoryArchive } from '../api/story';

export default function StoryMainScreen({ navigation }: any) {
  const [archives, setArchives] = useState<StoryArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoryLibrary();
  }, []);

  const loadStoryLibrary = async () => {
    try {
      setLoading(true);
      const data = await fetchStoryLibrary();
      setArchives(data.archives);
    } catch (error) {
      console.error('스토리 목록을 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷팅 함수 (2026-09-01T19:31:58.246Z -> 2026.09.01)
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
        
        {/* 상단 헤더 부분 */}
        <View style={styles.header}>
          <Text style={styles.headerText}>보관함</Text>
          <View style={styles.profilePlaceholder}>
             {/* 프로필 이미지가 있다면 Image 컴포넌트로 교체 */}
          </View>
        </View>

        {/* 타이틀 영역 */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>내가 만든 스토리</Text>
          <Text style={styles.subTitle}>
            직접 완성한 대화 기록을 다시 확인하고 복습해{'\n'}보세요.
          </Text>
        </View>

        {/* 새로운 스토리 만들기 버튼 (점선 테두리) */}
        <TouchableOpacity 
          style={styles.newStoryButton}
          onPress={() => {
            navigation.navigate('StoryCreate');
          }}
        >
          <View style={styles.plusIconCircle}>
            <Text style={styles.plusIconText}>+</Text>
          </View>
          <Text style={styles.newStoryText}>새로운 스토리 만들기</Text>
        </TouchableOpacity>

        {/* 스토리 목록 렌더링 */}
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
                
                {/* 태그 영역 (API 응답 기반 임의 구성) */}
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
  container: {
    flex: 1,
    backgroundColor: '#EBEBE0', // 시안의 배경색과 유사한 베이지/올리브 톤
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // 탭바 높이만큼 여유 공간
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCC',
  },
  titleSection: {
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  newStoryButton: {
    height: 140,
    borderWidth: 2,
    borderColor: '#C5D0B5',
    borderStyle: 'dashed',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 24,
  },
  plusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E8D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  plusIconText: {
    fontSize: 24,
    color: '#6B8E23', // 진한 올리브색
    fontWeight: '300',
  },
  newStoryText: {
    fontSize: 16,
    color: '#6B8E23',
    fontWeight: '600',
  },
  listContainer: {
    gap: 16, // 카드 사이 간격
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: '#999',
    marginLeft: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#E0E8D5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tagText: {
    color: '#7A9958',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  recordLinkText: {
    fontSize: 14,
    color: '#888',
  }
});