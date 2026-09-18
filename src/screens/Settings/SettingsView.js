import {useCallback, useState} from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {logoutUser} from '../../resource/Login';
import {getProfile, removeProfile} from '../../storage';
import Icon from '@react-native-vector-icons/lucide';

const MENU = [
  {
    key: 'profile',
    title: 'Profile',
    desc: 'Informasi login user',
    icon: 'circle-user',
    tint: color.primaryColor,
    bg: color.primaryLight,
    screen: 'ProfileView',
  },
  {
    key: 'local',
    title: 'Local Setting',
    desc: 'Pengaturan lokal perangkat',
    icon: 'hard-drive',
    tint: '#0EA5E9',
    bg: '#E0F2FE',
    screen: 'LocalSettingView',
  },
  {
    key: 'setting',
    title: 'Setting',
    desc: 'Pengaturan aplikasi',
    icon: 'sliders-horizontal',
    tint: '#F59E0B',
    bg: '#FEF3C7',
    screen: 'AppSettingView',
  },
  {
    key: 'about',
    title: 'About',
    desc: 'Informasi tentang aplikasi',
    icon: 'info',
    tint: '#10B981',
    bg: '#D1FAE5',
    screen: 'AboutView',
  },
];

const SettingsView = ({navigation, route, inline = false}) => {
  const [profile, setProfileState] = useState(getProfile() || {});
  const [loggingOut, setLoggingOut] = useState(false);

  // Refresh kartu user saat kembali dari ProfileView
  useFocusEffect(
    useCallback(() => {
      setProfileState(getProfile() || {});
    }, []),
  );

  const onLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah anda yakin ingin keluar?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            RootNavigation.navigateReplace('LoginView');
            removeProfile();
            setLoggingOut(false);
            // Kirim ke Backend: hapus token sesi (sys_authentication)
            await logoutUser();
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      {!inline && (
        <StatusBar
          barStyle={'light-content'}
          backgroundColor={color.primaryColor}
        />
      )}
      {!inline && <Header title="Settings" />}

      {/* Kartu user */}
      <View style={[styles.body, inline && styles.bodyInline]}>
        {inline && <Text style={styles.inlineTitle}>Setting</Text>}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Icon name="user" size={26} color={color.primaryColor} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.userName}>
              {profile?.full_name || profile?.username || 'User'}
            </Text>
            <Text style={styles.userEmail}>{profile?.email || '—'}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuRow,
                index < MENU.length - 1 && styles.menuRowBorder,
              ]}
              onPress={() => RootNavigation.navigate(item.screen)}>
              <View style={[styles.menuIcon, {backgroundColor: item.bg}]}>
                <Icon name={item.icon} size={20} color={item.tint} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          disabled={loggingOut}
          onPress={onLogout}>
          <Icon name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SettingsView;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 24,
  },
  bodyInline: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 12,
    paddingBottom: 90,
  },
  inlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 14,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: color.primaryLight,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  menuDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    height: 52,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
