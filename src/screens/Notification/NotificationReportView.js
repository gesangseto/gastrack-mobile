import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import {useCallback, useState} from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {
  deleteNotificationReport,
  getListNotificationReport,
  retryNotificationReport,
} from '../../resource/NotificationReport';

const REASON_LABEL = {
  recipient_never_contacted: 'Cold contact',
};

const FILTERS = [
  {key: 'all', label: 'Semua'},
  {key: 'today', label: 'Hari ini'},
  {key: '7d', label: '7 hari'},
];

const AVATAR_COLORS = [
  {bg: '#FEE2E2', fg: '#B91C1C'},
  {bg: '#FEF3C7', fg: '#B45309'},
  {bg: '#D1FAE5', fg: '#047857'},
  {bg: '#E0F2FE', fg: '#0369A1'},
  {bg: '#EDE9FE', fg: '#6D28D9'},
];

const initialsOf = item => {
  const name = (item.recipient_name || '').trim();
  if (name) {
    const parts = name.split(/\s+/);
    return (
      parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : '')
    ).toUpperCase();
  }
  const digits = (item.phone || '').replace(/\D/g, '');
  return digits.slice(-2) || '?';
};

const dateOf = item => moment(item.last_attempt_date || item.created_date);

const NotificationReportView = () => {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const loadData = useCallback(async () => {
    const res = await getListNotificationReport({limit: 100});
    if (res) {
      setList(res.rows);
      setTotal(res.total);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const retry = item => {
    Alert.alert(
      'Kirim Ulang',
      `Kirim ulang pesan ke ${item.phone}?\n\nNomor dicek ulang — jika masih belum pernah membalas, pesan tetap ditahan.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Kirim Ulang',
          onPress: async () => {
            setRetryingId(item.id);
            const res = await retryNotificationReport(item.id);
            setRetryingId(null);
            if (!res) {
              Alert.alert('Gagal', 'Tidak ada respons dari server.');
              return;
            }
            Alert.alert(
              res.error ? 'Retry Gagal' : 'Retry',
              res.message || '-',
            );
            if (!res.error) {loadData();}
          },
        },
      ],
    );
  };

  const remove = item => {
    Alert.alert(
      'Hapus Laporan',
      `Hapus laporan untuk ${item.phone}? Pesan tidak akan dikirim ulang.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteNotificationReport(item.id);
            if (res && !res.error) {
              loadData();
              return;
            }
            Alert.alert(
              'Gagal Hapus',
              (res && res.message) || 'Tidak ada respons dari server.',
            );
          },
        },
      ],
    );
  };

  const q = search.trim().toLowerCase();
  const filteredList = list.filter(item => {
    if (q) {
      const name = (item.recipient_name || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      if (!name.includes(q) && !phone.includes(q)) {return false;}
    }
    if (filter === 'all') {return true;}
    const d = dateOf(item);
    if (!d.isValid()) {return false;}
    if (filter === 'today') {return d.isSame(moment(), 'day');}
    return d.isAfter(moment().subtract(7, 'days'));
  });

  const todayCount = list.filter(item => {
    const d = dateOf(item);
    return d.isValid() && d.isSame(moment(), 'day');
  }).length;

  const renderItem = ({item, index}) => {
    const busy = retryingId === item.id;
    const d = dateOf(item);
    const avatar = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return (
      <View
        style={[
          styles.row,
          index === filteredList.length - 1 && styles.rowLast,
        ]}>
        <View style={[styles.avatar, {backgroundColor: avatar.bg}]}>
          <Text style={[styles.avatarText, {color: avatar.fg}]}>
            {initialsOf(item)}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {item.recipient_name || item.phone}
          </Text>
          <Text style={styles.phone} numberOfLines={1}>
            {item.phone}
          </Text>
          <View style={styles.reasonTag}>
            <Icon name="shield-alert" size={9} color="#B91C1C" />
            <Text style={styles.reasonText}>
              {REASON_LABEL[item.reason] || item.reason || 'Ditahan'}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.date}>
            {d.isValid() ? d.format('DD MMM') : '-'}
          </Text>
          <Text style={styles.time}>
            {d.isValid() ? d.format('HH:mm') : ''}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={() => retry(item)}
              hitSlop={6}>
              <Icon
                name="refresh-cw"
                size={13}
                color={busy ? '#B9B9C6' : color.primaryColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={() => remove(item)}
              hitSlop={6}>
              <Icon name="trash-2" size={13} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Notification Report" />
      <View style={styles.container}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{total}</Text>
            <Text style={styles.statLabel}>Total diblokir</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{todayCount}</Text>
            <Text style={styles.statLabel}>Hari ini</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Icon name="search" size={14} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari Customer"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#B0B0B0"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="x" size={14} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.chips}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipOn]}
              onPress={() => setFilter(f.key)}>
              <Text
                style={[
                  styles.chipText,
                  filter === f.key && styles.chipTextOn,
                ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <FlatList
            data={filteredList}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Customer tidak ditemukan.'
                  : filter === 'all'
                  ? 'Tidak ada penerima yang ditahan.'
                  : 'Tidak ada laporan pada rentang ini.'}
              </Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[color.primaryColor]}
              />
            }
          />
        </View>
      </View>
    </View>
  );
};

export default NotificationReportView;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: color.white},
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  flex: {flex: 1, minWidth: 0},
  stats: {flexDirection: 'row', gap: 10, marginBottom: 12},
  stat: {
    flex: 1,
    backgroundColor: '#F6F4FB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: color.primaryColor,
    lineHeight: 24,
  },
  statLabel: {fontSize: 9.5, fontWeight: '600', color: '#7A7291'},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F4F4F8',
    borderRadius: 12,
    paddingHorizontal: 11,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    paddingVertical: 8,
  },
  chips: {flexDirection: 'row', gap: 7, marginBottom: 12},
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E7E4F0',
    backgroundColor: color.white,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipOn: {backgroundColor: color.primaryColor, borderColor: color.primaryColor},
  chipText: {fontSize: 10.5, fontWeight: '600', color: '#6B6480'},
  chipTextOn: {color: color.white},
  card: {
    flex: 1,
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  listContent: {paddingBottom: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F5',
  },
  rowLast: {borderBottomWidth: 0},
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 11.5, fontWeight: '700'},
  name: {fontSize: 12.5, fontWeight: '700', color: '#333'},
  phone: {fontSize: 10, color: '#999', marginTop: 1},
  reasonTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    marginTop: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reasonText: {fontSize: 8.5, fontWeight: '700', color: '#B91C1C'},
  right: {alignItems: 'flex-end'},
  date: {fontSize: 9, color: '#AAA'},
  time: {fontSize: 9, color: '#AAA'},
  actions: {flexDirection: 'row', gap: 6, marginTop: 6},
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F4F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {opacity: 0.6},
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    paddingVertical: 24,
  },
});
