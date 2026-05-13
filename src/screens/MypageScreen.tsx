// screens/MyPage/MyPageScreen.tsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Header } from '../components/layout/Header';

// ─── 색상 ───
const C = {
  green: '#5a7247',
  darkGreen: '#3C6933',
  cardBg: '#FFFFFF',
  cardBorder: '#d5d5c8',
  badgeBg: '#edf7e6',
  logoutBg: '#FEF2F2',
  logoutText: '#BA1A1A',
};

// ─── 메뉴 아이템 타입 ───
interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  hasNotification?: boolean;
  isLogout?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'account', label: '계정 관리', icon: 'person-outline' },
  { id: 'alarm', label: '알림 설정', icon: 'notifications-outline', hasNotification: true },
  { id: 'notice', label: '공지사항', icon: 'document-text-outline' },
  { id: 'logout', label: '로그아웃', icon: 'log-out-outline', isLogout: true },
];

// ─── 메뉴 아이콘 ───
const MenuIcon = ({ name, isLogout }: { name: keyof typeof Ionicons.glyphMap; isLogout?: boolean }) => {
  const color = isLogout ? C.logoutText : C.green;
  const bg = isLogout ? C.logoutBg : C.badgeBg;

  return (
    <View style={[styles.menuIconWrap, { backgroundColor: bg }]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
};

// ─── 메인 컴포넌트 ───
const MyPageScreen = () => {
  return (
    <ScreenWrapper style={{ paddingHorizontal: 0 }}>
      <Header title="마이페이지" leftType="none" rightType="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 영역 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrap}>
            <View style={styles.profileImage} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>김동양</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.2 일상 회화</Text>
          </View>
        </View>

        {/* 스탯 카드 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue1}>2450</Text>
            <Text style={styles.statLabel}>누적 점수</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue2}>15</Text>
            <Text style={styles.statLabel}>연속 학습일</Text>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                item.isLogout && styles.menuRowLogout,
              ]}
              activeOpacity={0.7}
              onPress={() => {}}
            >
              <View style={styles.menuLeft}>
                <MenuIcon name={item.icon} isLogout={item.isLogout} />
                <Text style={[
                  styles.menuLabel,
                  item.isLogout && { color: C.logoutText },
                ]}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.menuRight}>
                {item.hasNotification && <View style={styles.notificationDot} />}
                {!item.isLogout && (
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── 스타일 ───
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // 프로필
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  levelBadge: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // 스탯
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 25,
    borderColor: C.cardBorder,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3C6933',
  },
  statValue2: {
    fontSize: 24,
    fontWeight: '800',
    color: '#BA1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },

  // 메뉴
  menuList: {
    gap: 10,
  },
  menuRow: {
    backgroundColor: C.cardBg,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowLogout: {
    borderColor: '#f5d5d5',
    backgroundColor: '#fff',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
  },
});

export default MyPageScreen;