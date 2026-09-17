// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
import { switchLanguage, checkLanguage } from '../../api/language';
import { showAlert } from '../common/AlertHost';

interface HeaderProps {
  title?: string;
  leftType?: 'back' | 'close' | 'none';
  rightType?: 'sprout' | 'menu' | 'profile' | 'none';
  onLeftPress?: () => void; // 🌟 왼쪽 버튼 클릭 시 동작을 커스텀할 수 있도록 추가
  onRightPress?: () => void;
  showLogo?: boolean;
  userName?: string;
}

const API_BASE_URL = 'https://q-ring.app/api/v1/auth';

const LANGUAGES = [
  { code: 'EN', label: '영어' },
  { code: 'JA', label: '일본어' },
  { code: 'ZH', label: '중국어' },
];

export const Header = ({
  title,
  leftType = 'back',
  rightType = 'none',
  onLeftPress,
  onRightPress,
  showLogo = false,
  userName
}: HeaderProps) => {
  const navigation = useNavigation<any>();
  const [isProfileMenuVisible, setProfileMenuVisible] = useState(false);
  const [activeLang, setActiveLang] = useState('');
  const [enabledLangs, setEnabledLangs] = useState<string[]>([]);

  const [displayName, setDisplayName] = useState('학습자');

  React.useEffect(() => {
    const fetchAndSaveName = async () => {
      if (userName) {
        setDisplayName(userName);
        await AsyncStorage.setItem('savedUserName', userName);
      } else {
        const saved = await AsyncStorage.getItem('savedUserName');
        if (saved) {
          setDisplayName(saved);
        }
      }
    };
    fetchAndSaveName();
  }, [userName]);

  const fetchLangStatus = async () => {
    try {
      const saved = await AsyncStorage.getItem('activeLang');
      if (saved) setActiveLang(saved);

      const checks = await Promise.all(
        LANGUAGES.map(async (lang) => {
          try {
            const res = await checkLanguage(lang.code);
            return { code: lang.code, enabled: res };
          } catch (e: any) {
            return { code: lang.code, enabled: false };
          }
        }),
      );
      const enabled = checks.filter((c) => c.enabled).map((c) => c.code);
      setEnabledLangs(enabled);

      if (!saved && enabled.length > 0) {
        setActiveLang(enabled[0]);
      }
    } catch (err: any) {
      console.error('언어 상태 조회 실패:', err.message);
    }
  };

  const handleLangSwitch = async (code: string) => {
    try {
      await switchLanguage(code);
      setActiveLang(code);
      await AsyncStorage.setItem('activeLang', code);
      setProfileMenuVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'MainTab' }] });
    } catch (err: any) {
      console.error('언어 전환 실패:', err.message);
    }
  };

  const handleRightPress = () => {
    if (rightType === 'profile' || rightType === 'menu') {
      setProfileMenuVisible(true);
      fetchLangStatus();
    } else if (onRightPress) {
      onRightPress();
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await axios.post(`${API_BASE_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout API Error:', error);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      setProfileMenuVisible(false);

      await showAlert({ title: '로그아웃', message: '정상적으로 로그아웃 되었습니다.' });
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        
        {/* 왼쪽 섹션 (뒤로가기 등) */}
        <View style={styles.leftSection}>
          {leftType === 'back' && (
            <TouchableOpacity 
              onPress={onLeftPress || (() => navigation.goBack())} 
              style={styles.iconButton}
            >
              <Ionicons name="chevron-back" size={26} color="#333" />
            </TouchableOpacity>
          )}
          {leftType === 'close' && (
            <TouchableOpacity 
              onPress={onLeftPress || (() => navigation.goBack())} 
              style={styles.iconButton}
            >
              <Ionicons name="close" size={26} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        {/* 중앙 섹션 (로고 또는 타이틀) */}
        <View style={styles.centerSection}>
          {showLogo ? (
            <Image 
              source={require('../../../assets/quring_logo.png')} 
              style={styles.headerLogoCentered} 
              resizeMode="contain" 
            />
          ) : (
            title && <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
        </View>

        {/* 오른쪽 섹션 */}
        <View style={styles.rightSection}>
          {rightType === 'sprout' && (
            <View style={styles.sproutCircle}>
              <Text style={{ fontSize: 16 }}>🌱</Text>
            </View>
          )}
          {rightType === 'menu' && (
            <TouchableOpacity onPress={handleRightPress} style={styles.iconButton}>
              <Ionicons name="menu" size={30} color="#333" />
            </TouchableOpacity>
          )}
          {rightType === 'profile' && (
            <TouchableOpacity onPress={handleRightPress} style={styles.iconButton}>
              <Ionicons name="person-circle" size={28} color="#333" />
            </TouchableOpacity>
          )}
        </View>

      </View>

      <Modal
        visible={isProfileMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setProfileMenuVisible(false)}
        />
          
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Ionicons name="person-circle" size={32} color="#CCC" />
            <Text style={styles.menuUserName}>{displayName} 님</Text>
          </View>
          
          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => {
            setProfileMenuVisible(false);
            navigation.navigate('MyPage');
          }}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.menuItemText}>마이페이지</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <Text style={styles.langSectionLabel}>학습 언어 전환</Text>
          <View style={styles.langTrack}>
            {LANGUAGES.map((lang) => {
              const isEnabled = enabledLangs.includes(lang.code);
              const isActive = activeLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langSegment,
                    isActive && styles.langSegmentActive,
                  ]}
                  onPress={() => isEnabled && handleLangSwitch(lang.code)}
                  disabled={!isEnabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.langLabel,
                    isActive && styles.langLabelActive,
                    !isEnabled && styles.langLabelDisabled,
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.menuLogoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingBottom: 10,
    paddingTop: 10,
  },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    backgroundColor: 'transparent', 
  },
  leftSection: { width: 40, alignItems: 'flex-start' },
  centerSection: { flex: 1, alignItems: 'center' }, 
  rightSection: { width: 40, alignItems: 'flex-end' },
  title: {
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#333',
  },
  iconButton: { padding: 4 },
  sproutCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.lightPeach, alignItems: 'center', justifyContent: 'center' },
  headerLogoCentered: { 
    width: 130, 
    height: 40 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: 60, 
    right: 15, 
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  menuUserName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuLogoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc3545',
  },
  langSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  langTrack: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#EEF0E6',
    marginBottom: 4,
  },
  langSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  langSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8F80',
  },
  langLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  langLabelDisabled: {
    color: '#C9CCC0',
  },
});