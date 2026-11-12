import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {
  getNotificationChannels,
  getNotificationChannelStatus,
} from '../../resource/NotificationChannel';
import {getListNotificationReport} from '../../resource/NotificationReport';
import {getNotificationQueueSummary} from '../../resource/NotificationQueue';

// Ikon & warna per channel — mengikuti channel yang di-seed Backend.
const CHANNEL_STYLE = {
  default: {icon: 'message-circle', tint: color.primaryColor, bg: color.primaryLight},
  send_wia: {icon: 'send', tint: '#0EA5E9', bg: '#E0F2FE'},
  kirimi: {icon: 'zap', tint: '#F59E0B', bg: '#FEF3C7'},
};

const styleFor = code =>
  CHANNEL_STYLE[code] || {icon: 'radio', tint: '#8B5CF6', bg: '#EDE9FE'};

const NotificationView = () => {
  const [channels, setChannels] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [queueActive, setQueueActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [list, report, queue] = await Promise.all([
      getNotificationChannels({}, false),
      getListNotificationReport({limit: 1}, false),
      getNotificationQueueSummary(false),
    ]);
    if (list) {setChannels(list);}
    if (report) {setReportTotal(report.total || 0);}
    if (queue) {
      const active = queue
        .filter(row => row.status === 'pending' || row.status === 'processing')
        .reduce((acc, row) => acc + Number(row.total || 0), 0);
      setQueueActive(active);
    }
  }, []);

  // Status channel bisa memanggil API provider (SendWia/Kirimi) sehingga
  // lebih lambat dari daftar channel — jangan blokir render menunggunya.
  const loadStatuses = useCallback(async (isActive = () => true) => {
    const statusRows = await getNotificationChannelStatus();
    if (statusRows && isActive()) {setStatuses(statusRows);}
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadData().finally(() => {
        if (active) {setLoading(false);}
      });
      loadStatuses(() => active);
      return () => {
        active = false;
      };
    }, [loadData, loadStatuses]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadStatuses()]);
    setRefreshing(false);
  };

  const statusFor = code => statuses.find(s => s.code === code) || null;
  const defaultStatus = statusFor('default');
  const defaultChannel = channels.find(c => c.code === 'default');

  const openDefaultChannel = () => {
    if (defaultChannel) {
      RootNavigation.navigate('NotificationChannelEdit', {
        item: defaultChannel,
      });
      return;
    }
    Alert.alert(
      'Channel belum tersedia',
      'Data channel notification belum diterima dari server. Tarik layar untuk memuat ulang, atau periksa koneksi Backend.',
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Notification" />
      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={color.primaryColor} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[color.primaryColor]}
              />
            }>
            {/* Kartu utama: WhatsApp default (Baileys) — status sesi + nomor.
                Tap kartu membuka pengaturan koneksi channel. */}
            <TouchableOpacity
              style={styles.waCard}
              activeOpacity={0.85}
              onPress={openDefaultChannel}>
              <View style={styles.waTop}>
                <View style={styles.waIcon}>
                  <Icon name="message-circle" size={20} color={color.white} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.waTitle} numberOfLines={1}>
                    WhatsApp
                  </Text>
                  <Text style={styles.waSub}>Channel default · Baileys</Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    defaultStatus?.connected && styles.statusChipOn,
                  ]}>
                  <View
                    style={[
                      styles.statusDot,
                      defaultStatus?.connected
                        ? styles.statusDotOn
                        : styles.statusDotOff,
                    ]}
                  />
                  <Text style={styles.statusChipText}>
                    {defaultStatus?.connected ? 'Terhubung' : 'Offline'}
                  </Text>
                </View>
              </View>

              <Text style={styles.waState}>
                {defaultStatus?.connected
                  ? defaultStatus?.phone_number || 'WhatsApp terhubung'
                  : 'WhatsApp belum terhubung'}
              </Text>
              {defaultStatus?.daily_limit ? (
                <Text style={styles.waQuota}>
                  Kuota hari ini: {defaultStatus.daily_used || 0}/
                  {defaultStatus.daily_limit} pesan
                </Text>
              ) : null}
              <View style={styles.waAction}>
                <Icon name="qr-code" size={13} color="#E7E1F7" />
                <Text style={styles.waActionText}>
                  Mengatur koneksi channel
                </Text>
                <Icon name="chevron-right" size={16} color="#E7E1F7" />
              </View>
            </TouchableOpacity>

            {/* Channel lain (send_wia / kirimi / ...) */}
            {channels.filter(c => c.code !== 'default').length > 0 && (
              <View style={styles.card}>
                {channels
                  .filter(c => c.code !== 'default')
                  .map((item, index, arr) => {
                    const st = styleFor(item.code);
                    const status = statusFor(item.code);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.row,
                          index < arr.length - 1 && styles.rowBorder,
                        ]}
                        onPress={() =>
                          RootNavigation.navigate('NotificationChannelEdit', {
                            item,
                          })
                        }>
                        <View style={[styles.rowIcon, {backgroundColor: st.bg}]}>
                          <Icon name={st.icon} size={19} color={st.tint} />
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.rowDesc} numberOfLines={1}>
                            {item.code} · {item.status}
                            {status
                              ? status.ready
                                ? ' · siap'
                                : ' · belum siap'
                              : ''}
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={18} color="#CCC" />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

            <Text style={styles.sectionTitle}>Laporan, antrean & template</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.row, styles.rowBorder]}
                onPress={() => RootNavigation.navigate('NotificationQueueView')}>
                <View style={[styles.rowIcon, styles.rowIconInfo]}>
                  <Icon name="send" size={19} color="#0EA5E9" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>Notification Queue</Text>
                  <Text style={styles.rowDesc} numberOfLines={1}>
                    Antrean pesan WhatsApp – pantau status kirim
                  </Text>
                </View>
                {queueActive > 0 && (
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeText}>{queueActive}</Text>
                  </View>
                )}
                <Icon name="chevron-right" size={18} color="#CCC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.row, styles.rowBorder]}
                onPress={() => RootNavigation.navigate('NotificationReportView')}>
                <View style={[styles.rowIcon, styles.rowIconDanger]}>
                  <Icon name="shield-alert" size={19} color="#EF4444" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>Notification Report</Text>
                  <Text style={styles.rowDesc} numberOfLines={1}>
                    Penerima diblokir – belum pernah membalas
                  </Text>
                </View>
                {reportTotal > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{reportTotal}</Text>
                  </View>
                )}
                <Icon name="chevron-right" size={18} color="#CCC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.row}
                onPress={() => RootNavigation.navigate('MessageTemplateList')}>
                <View style={[styles.rowIcon, styles.rowIconPurple]}>
                  <Icon name="message-square" size={19} color="#8B5CF6" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>Message Template</Text>
                  <Text style={styles.rowDesc} numberOfLines={1}>
                    Template pesan WhatsApp
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color="#CCC" />
              </TouchableOpacity>
            </View>

            <View style={styles.hint}>
              <Icon name="info" size={14} color={color.primaryColor} />
              <Text style={styles.hintText}>
                Penerima baru tidak dikirimi pesan sampai ia pernah mengirim
                pesan ke nomor ini (anti-bot). Yang terlewat dicatat di
                Notification Report.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default NotificationView;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: color.white},
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1, minWidth: 0},
  sectionTitle: {
    color: color.primaryColor,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
  },
  waCard: {
    backgroundColor: color.primaryColor,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  waTop: {flexDirection: 'row', alignItems: 'center', gap: 10},
  waIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waTitle: {color: color.white, fontSize: 14, fontWeight: '700'},
  waSub: {color: '#C9BCE8', fontSize: 10.5, marginTop: 1},
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusChipOn: {backgroundColor: 'rgba(255,255,255,0.2)'},
  statusChipText: {color: color.white, fontSize: 9.5, fontWeight: '700'},
  statusDot: {width: 6, height: 6, borderRadius: 3},
  statusDotOn: {backgroundColor: '#6EE7A8'},
  statusDotOff: {backgroundColor: '#C4C4C4'},
  waState: {color: color.white, fontSize: 17, fontWeight: '700', marginTop: 12},
  waQuota: {color: '#C9BCE8', fontSize: 10.5, marginTop: 2},
  waAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
    marginTop: 10,
  },
  waActionText: {flex: 1, color: '#E7E1F7', fontSize: 10.5},
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12},
  rowBorder: {borderBottomWidth: 1, borderBottomColor: '#F3F3F5'},
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {backgroundColor: '#FEE2E2'},
  rowIconPurple: {backgroundColor: '#EDE9FE'},
  rowIconInfo: {backgroundColor: '#E0F2FE'},
  rowTitle: {fontSize: 13.5, fontWeight: '600', color: '#333'},
  rowDesc: {fontSize: 10.5, color: '#999', marginTop: 2},
  badge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {color: color.white, fontSize: 10, fontWeight: '800'},
  badgeInfo: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8F7FC',
    borderWidth: 1,
    borderColor: '#EAE6F6',
    borderRadius: 13,
    padding: 11,
    marginBottom: 24,
  },
  hintText: {flex: 1, fontSize: 10.5, lineHeight: 15, color: '#6B6480'},
});
