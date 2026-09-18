import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {closeSession} from '../../resource/Session';
import {useHomeStore} from '../../store/homeStore';
import {useSessionStore} from '../../store/sessionStore';
import Statistik from '../Statistik/Statistik';

// Home = Start/Stop Session + List/Add Customer + Dashboard Statistik (inline).
const Home = () => {
  const activeSession = useSessionStore(s => s.activeSession);
  const sessionSummary = useHomeStore(s => s.dashboard?.session_summary);
  const fetchHome = useHomeStore(s => s.fetchHome);
  const initFromCache = useHomeStore(s => s.initFromCache);
  const fetchActiveSession = useSessionStore(s => s.fetchActiveSession);

  useEffect(() => {
    // Tampilkan data cache secepatnya; Statistik (inline) yang memanggil
    // fetchHome saat fokus.
    initFromCache();
  }, [initFromCache]);

  // Simpan active session ke store saat Home aktif (sumber data session).
  useFocusEffect(
    useCallback(() => {
      fetchActiveSession();
    }, [fetchActiveSession]),
  );

  const summary = sessionSummary || {
    items_without_batch: 0,
    batches_not_shipping: 0,
  };

  const handleStopSession = useCallback(() => {
    if (!activeSession) {
      return;
    }
    Alert.alert(
      'Stop Session',
      `Tutup session ${activeSession.session_no}? Pastikan semua item sudah di-batch dan batch sudah Shipping.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            const ok = await closeSession(activeSession.id);
            if (ok) {
              fetchHome(true);
              fetchActiveSession(true);
            }
          },
        },
      ],
    );
  }, [activeSession, fetchHome, fetchActiveSession]);

  const topHeader = (
    <View style={styles.topWrap}>
      {/* Start / Stop Session */}
      {activeSession ? (
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => RootNavigation.navigate('SessionView')}>
          <View style={styles.sessionIcon}>
            <Icon name="play" size={18} color={color.white} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              Session aktif
            </Text>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {activeSession.session_no}
            </Text>
            <Text style={styles.sessionSub} numberOfLines={1}>
              {summary.items_without_batch > 0
                ? `${summary.items_without_batch} item tanpa batch`
                : 'Semua item sudah batch'}
            </Text>
            <Text style={styles.sessionSub} numberOfLines={1}>
              {summary.batches_not_shipping > 0
                ? `${summary.batches_not_shipping} batch belum kirim`
                : 'Semua batch sudah kirim'}
            </Text>
          </View>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStopSession}>
            <Icon name="square" size={13} color={color.white} />
            <Text style={styles.stopText}>Stop</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.sessionCardEmpty}
          onPress={() => RootNavigation.navigate('SessionView')}>
          <View style={styles.sessionIconEmpty}>
            <Icon name="calendar-plus" size={18} color={color.primaryColor} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.sessionTitleEmpty}>
              Belum ada session aktif
            </Text>
            <Text style={styles.sessionSubEmpty}>
              Mulai session untuk mencatat item titipan
            </Text>
          </View>
          <View style={styles.startChip}>
            <Icon name="play" size={13} color={color.white} />
            <Text style={styles.startText}>Start</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick action: List Customer & Add Customer */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickTile}
          onPress={() => RootNavigation.navigate('CustomerList')}>
          <View style={[styles.quickIcon, {backgroundColor: '#2E8B57'}]}>
            <Icon name="users" size={20} color={color.white} />
          </View>
          <Text style={styles.quickLabel}>List Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickTile}
          onPress={() => RootNavigation.navigate('CustomerEdit')}>
          <View style={[styles.quickIcon, {backgroundColor: '#F59E0B'}]}>
            <Icon name="user-plus" size={20} color={color.white} />
          </View>
          <Text style={styles.quickLabel}>Add Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return <Statistik inline header={topHeader} />;
};

export default Home;

const styles = StyleSheet.create({
  topWrap: {
    paddingTop: 14,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.primaryColor,
    borderRadius: 16,
    padding: 14,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    color: color.white,
    fontSize: 13,
    fontWeight: '700',
  },
  sessionSub: {
    color: '#C9BCE8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sessionManageBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stopText: {
    color: color.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sessionCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    padding: 14,
  },
  sessionIconEmpty: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitleEmpty: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionSubEmpty: {
    color: '#6B6B6B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  startChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.primaryColor,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  startText: {
    color: color.white,
    fontSize: 12,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
  },
});
