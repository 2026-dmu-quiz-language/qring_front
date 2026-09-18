import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../components/common/Text';
import { useFocusEffect } from '@react-navigation/native';
import { fetchStoryLibrary, StoryArchive, resumeStory, StoryResumeResponse } from '../api/story';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../constants/theme';

export default function StoryMainScreen({ navigation }: any) {
  const [archives, setArchives] = useState<StoryArchive[]>([]);
  const [resume, setResume] = useState<StoryResumeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(React.useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      setLoading(true);
      const libData = await fetchStoryLibrary();
      setArchives(libData.archives);
      try {
        const resumeData = await resumeStory();
        setResume(resumeData);
      } catch (err) { setResume(null); }
    } catch (error) {
      console.error('데이터를 불러오는데 실패했습니다:', error);
    } finally { setLoading(false); }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderTierBadge = (tier?: string) => {
    const isPremium = tier === 'premium';
    return (
      <View style={[styles.tierBadge, isPremium ? styles.tierBadgePremium : styles.tierBadgeStandard]}>
        <Text style={[styles.tierBadgeText, isPremium ? styles.tierBadgeTextPremium : styles.tierBadgeTextStandard]}>
          {isPremium ? '프리미엄' : '기본'}
        </Text>
      </View>
    );
  };

  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <View style={styles.leftSection} />
          <View style={styles.centerSection}><Text style={styles.title}>AI 인터렉티브 스토리</Text></View>
          <View style={styles.rightSection} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>내가 만든 스토리</Text>
          <Text style={styles.subTitle}>직접 완성한 대화 기록을 다시 확인하고 복습해{'\n'}보세요.</Text>
        </View>

        {resume?.has_session ? (
          <TouchableOpacity style={styles.resumeCard} onPress={() => navigation.navigate('StoryChat', { resumeData: resume })}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                {renderTierBadge(resume.model_tier)}
                <Text style={[styles.resumeTitle, { marginBottom: 0, marginLeft: 8, flexShrink: 1 }]} numberOfLines={1}>
                  {resume.is_completed ? '저장 안 한 스토리가 있어요' : '진행 중인 대화가 있어요'}
                </Text>
              </View>
              <Text style={styles.resumeSub} numberOfLines={1}>{resume.character_name} · {resume.situation}</Text>
            </View>
            <Text style={styles.resumeLinkText}>이어하기 {'>'}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.newStoryButton} onPress={() => navigation.navigate('StoryCreateScreen')}>
          <View style={styles.plusIconCircle}><Text style={styles.plusIconText}>+</Text></View>
          <Text style={styles.newStoryText}>새로운 스토리 만들기</Text>
        </TouchableOpacity>

        {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} /> : (
          <View style={styles.listContainer}>
            {archives.map((item) => (
              <TouchableOpacity key={item.session_id} style={styles.card} onPress={() => navigation.navigate('StoryRecord', { sessionId: item.session_id })}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                    {renderTierBadge(item.model_tier)}
                    {/* 🌟 'OO과의' 부분을 제거하고 situation(스토리 상황/제목)만 출력하도록 수정 */}
                    <Text style={[styles.cardTitle, { marginLeft: 8, flex: 1 }]} numberOfLines={1}>
                      {item.situation}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>{formatDate(item.archived_at)}</Text>
                </View>
                
                <View style={styles.tagContainer}>
                  <View style={styles.tag}><Text style={styles.tagText}>#{item.character_name}</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>#{item.situation}</Text></View>
                </View>

                <View style={styles.cardFooter}><Text style={styles.recordLinkText}>기록 보기 {'>'}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerContainer: { width: '100%', backgroundColor: 'transparent', paddingBottom: 10, paddingTop: 10 },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  leftSection: { width: 40 }, centerSection: { flex: 1, alignItems: 'center' }, rightSection: { width: 40 },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
  scrollContent: { padding: 24, paddingBottom: 100 },
  titleSection: { marginBottom: 30 }, mainTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textStrong, marginBottom: 12 }, subTitle: { fontSize: 14, color: theme.colors.textSub, lineHeight: 20 },
  resumeCard: { backgroundColor: theme.colors.primary, borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  resumeTitle: { color: theme.colors.surface, fontSize: 15, fontWeight: 'bold' }, resumeSub: { color: theme.colors.greenChip, fontSize: 13, marginTop: 4 }, resumeLinkText: { color: theme.colors.greenChip, fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  newStoryButton: { height: 140, borderWidth: 2, borderColor: theme.colors.greenBorder, borderStyle: 'dashed', borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.4)', marginBottom: 24 },
  plusIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.greenChip, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }, plusIconText: { fontSize: 24, color: theme.colors.primary, fontWeight: '300' }, newStoryText: { fontSize: 16, color: theme.colors.primary, fontWeight: '600' },
  listContainer: { gap: 16 }, card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, shadowColor: theme.colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textStrong }, cardDate: { fontSize: 13, color: theme.colors.textHint },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, 
  tag: { backgroundColor: theme.colors.greenChip, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 }, tagText: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
  cardFooter: { alignItems: 'flex-end' }, recordLinkText: { fontSize: 14, color: theme.colors.textMuted },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tierBadgeStandard: { backgroundColor: theme.colors.background },
  tierBadgePremium: { backgroundColor: theme.colors.gold }, 
  tierBadgeText: { fontSize: 10, fontWeight: 'bold' },
  tierBadgeTextStandard: { color: theme.colors.textSub },
  tierBadgeTextPremium: { color: theme.colors.goldDark }
});