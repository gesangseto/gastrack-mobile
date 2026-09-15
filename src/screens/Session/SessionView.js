import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {closeSession, createSession, getSessionList} from '../../resource/Session';
import {useHomeStore} from '../../store/homeStore';

const SessionView = () => {
  const dashboard = useHomeStore(s => s.dashboard);
  const fetchHome = useHomeStore(s => s.fetchHome);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeSession = dashboard?.active_session || null;
  const summary = dashboard?.session_summary || {
    items_without_batch: 0,
    batches_not_shipping: 0,
  };

  const load = useCallback(async () => {
    setLoading(true);
    await fetchHome(false);
    const list = await getSessionList({}, false);
    if (list) {setHistory(list);}
    setLoading(false);
  }, [fetchHome]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleStart = async () => {
    setBusy(true);
    const ok = await createSession({});
    setBusy(false);
    if (ok) {load();}
  };

  const handleClose = async () => {
    if (!activeSession) {return;}
    setBusy(true);
    const ok = await closeSession(activeSession.id, {});
    setBusy(false);
    if (ok) {load();}
  };

  const formatDate = d => {
    if (!d) {return '-';}
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Session Jastip" />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={color.primaryColor}
              style={{marginTop: 40}}
            />
          ) : activeSession ? (
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={styles.activeIcon}>
                  <Icon name="play" size={22} color={color.white} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.activeLabel}>Session Aktif</Text>
                  <Text style={styles.activeNo}>{activeSession.session_no}</Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Berjalan</Text>
                </View>
              </View>

              <Text style={styles.activeDate}>
                Mulai: {formatDate(activeSession.start_session_date)}
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryValue,
                      summary.items_without_batch > 0 && styles.summaryWarn,
                    ]}>
                    {summary.items_without_batch}
                  </Text>
                  <Text style={styles.summaryLabel}>Item Tanpa Batch</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryValue,
                      summary.batches_not_shipping > 0 && styles.summaryWarn,
                    ]}>
                    {summary.batches_not_shipping}
                  </Text>
                  <Text style={styles.summaryLabel}>Batch Belum Kirim</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.closeBtn, busy && styles.btnDisabled]}
                onPress={handleClose}
                disabled={busy}>
                {busy ? (
                  <ActivityIndicator size="small" color={color.white} />
                ) : (
                  <Icon name="lock" size={18} color={color.white} />
                )}
                <Text style={styles.closeBtnText}>Tutup Session</Text>
              </TouchableOpacity>
              <Text style={styles.closeHint}>
                Tutup hanya bisa jika semua item sudah batch & semua batch sudah
                dalam pengiriman.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Icon name="calendar-plus" size={30} color={color.primaryColor} />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Session Aktif</Text>
              <Text style={styles.emptyDesc}>
                Buka session untuk mulai mencatat item titipan. Item & batch
                akan terhubung ke session ini.
              </Text>
              <TouchableOpacity
                style={[styles.startBtn, busy && styles.btnDisabled]}
                onPress={handleStart}
                disabled={busy}>
                {busy ? (
                  <ActivityIndicator size="small" color={color.white} />
                ) : (
                  <Icon name="play" size={18} color={color.white} />
                )}
                <Text style={styles.startBtnText}>Mulai Session</Text>
              </TouchableOpacity>
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Riwayat Session</Text>
              {history.map((s, i) => (
                <View key={s.id || i} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Icon
                      name={s.status === 'Active' ? 'play' : 'check'}
                      size={16}
                      color={
                        s.status === 'Active'
                          ? color.success
                          : '#9A9A9A'
                      }
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.historyNo}>{s.session_no}</Text>
                    <Text style={styles.historyDate}>
                      {formatDate(s.start_session_date)}
                      {s.finish_session_date
                        ? ` → ${formatDate(s.finish_session_date)}`
                        : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyStatus,
                      s.status === 'Active' && styles.historyStatusActive,
                    ]}>
                    {s.status}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default SessionView;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
  },
  activeCard: {
    backgroundColor: color.primaryColor,
    borderRadius: 24,
    padding: 20,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeLabel: {
    color: '#C9BCE8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeNo: {
    color: color.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 5,
  },
  liveText: {
    color: color.white,
    fontSize: 11,
    fontWeight: '600',
  },
  activeDate: {
    color: '#C9BCE8',
    fontSize: 13,
    marginTop: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: color.white,
    fontSize: 20,
    fontWeight: '700',
  },
  summaryWarn: {
    color: '#FFD166',
  },
  summaryLabel: {
    color: '#C9BCE8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E5484D',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  closeBtnText: {
    color: color.white,
    fontSize: 15,
    fontWeight: '700',
  },
  closeHint: {
    color: '#C9BCE8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: color.primaryLight,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: color.primaryColor,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 18,
  },
  startBtnText: {
    color: color.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  historySection: {
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 12,
    marginBottom: 8,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyNo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  historyDate: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A9A9A',
  },
  historyStatusActive: {
    color: color.success,
  },
});
