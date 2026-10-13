import {useCallback, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import color from '../../constant/color';
import {getStagingSummary, getWaUnread} from '../../resource/WaChat';
import ChatWaTab from './ChatWaTab';
import StagingTab from '../Staging/StagingTab';

// Tab "Chat" — menggabungkan dua sub-tab:
//   1. Chat WA  : daftar percakapan + buat item dari chat
//   2. Staging  : item kandidat dari chat, konfirmasi -> Draft
// Badge angka menunjukkan jumlah chat belum dibaca / staging pending.
const ChatTab = () => {
  const [sub, setSub] = useState('chat');
  const [unread, setUnread] = useState(0);
  const [pending, setPending] = useState(0);

  const loadBadges = useCallback(async () => {
    const [u, s] = await Promise.all([getWaUnread(), getStagingSummary()]);
    setUnread(Number(u) || 0);
    setPending(Number(s?.pending) || 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBadges();
    }, [loadBadges]),
  );

  const SubButton = ({id, label, badge}) => {
    const active = sub === id;
    return (
      <TouchableOpacity
        style={[styles.subBtn, active && styles.subBtnActive]}
        onPress={() => {
          setSub(id);
          loadBadges();
        }}>
        <Text style={[styles.subText, active && styles.subTextActive]}>
          {label}
        </Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.subBar}>
        <SubButton id="chat" label="Chat WA" badge={unread} />
        <SubButton id="staging" label="Staging" badge={pending} />
      </View>

      {sub === 'chat' ? <ChatWaTab /> : <StagingTab />}
    </View>
  );
};

export default ChatTab;

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: '#F8FAFC'},
  subBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  subBtnActive: {backgroundColor: color.primaryColor},
  subText: {fontSize: 13, fontWeight: '600', color: '#64748B'},
  subTextActive: {color: '#fff'},
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {color: '#fff', fontSize: 10, fontWeight: '700'},
});
