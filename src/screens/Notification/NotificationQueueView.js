import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import moment from 'moment';
import {useCallback, useMemo, useState} from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
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
  getListNotificationQueue,
  getNotificationQueueSummary,
} from '../../resource/NotificationQueue';

const STATUS = {
  pending: {
    label: 'Menunggu',
    icon: 'clock',
    tint: '#B45309',
    bg: '#FEF3C7',
  },
  processing: {
    label: 'Dikirim',
    icon: 'loader',
    tint: '#0369A1',
    bg: '#E0F2FE',
  },
  sent: {label: 'Terkirim', icon: 'check', tint: '#047857', bg: '#D1FAE5'},
  failed: {label: 'Gagal', icon: 'x', tint: '#B91C1C', bg: '#FEE2E2'},
};

const STATUS_ORDER = ['pending', 'processing', 'sent', 'failed'];

const FILTERS = [
  {key: '', label: 'Semua'},
  ...STATUS_ORDER.map(key => ({key, label: STATUS[key].label})),
];

const styleFor = status =>
  STATUS[status] || {
    label: status || '-',
    icon: 'clock',
    tint: '#6B6480',
    bg: '#F4F4F8',
  };

const dateOf = item => moment(item.sent_date || item.created_date);

const NotificationQueueView = () => {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async status => {
    const [res, counts] = await Promise.all([
      getListNotificationQueue({page: 1, limit: 200, status}),
      getNotificationQueueSummary(),
    ]);
    if (res) {
      setList(res.rows);
      setTotal(res.total);
    }
    if (counts) {setSummary(counts);}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(filter);
    }, [loadData, filter]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(filter);
    setRefreshing(false);
  };

  const selectFilter = key => {
    if (filter === key) {return;}
    setFilter(key);
  };

  const totalOf = key => {
    if (!key) {
      return summary.reduce((acc, row) => acc + Number(row.total || 0), 0);
    }
    const row = summary.find(item => item.status === key);
    return row ? Number(row.total || 0) : 0;
  };

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {return list;}
    return list.filter(item => {
      const name = (item.customer_name || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const preview = (item.message_preview || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || preview.includes(q);
    });
  }, [list, search]);

  const renderItem = ({item, index}) => {
    const st = styleFor(item.status);
    const d = dateOf(item);
    return (
      <View
        style={[
          styles.row,
          index === filteredList.length - 1 && styles.rowLast,
        ]}>
        <View style={[styles.avatar, {backgroundColor: st.bg}]}>
          <Icon name={st.icon} size={15} color={st.tint} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {item.customer_name || item.phone || 'Tanpa nama'}
          </Text>
          <Text style={styles.phone} numberOfLines={1}>
            {item.phone || '-'}
            {item.channel_code ? ` · ${item.channel_code}` : ''}
          </Text>
          <Text style={styles.preview} numberOfLines={1}>
            {item.message_preview || '-'}
          </Text>
          {item.last_error ? (
            <Text style={styles.error} numberOfLines={1}>
              {item.last_error}
            </Text>
          ) : null}
        </View>
        <View style={styles.right}>
          <View style={[styles.statusTag, {backgroundColor: st.bg}]}>
            <Text style={[styles.statusText, {color: st.tint}]}>
              {st.label}
            </Text>
          </View>
          <Text style={styles.date}>
            {d.isValid() ? d.format('DD MMM') : '-'}
          </Text>
          <Text style={styles.time}>
            {d.isValid() ? d.format('HH:mm') : ''}
          </Text>
          <Text style={styles.attempts}>
            {item.attempts || 0}x percobaan
          </Text>
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
      <Header title="Notification Queue" />
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key || 'all'}
              style={[styles.chip, filter === f.key && styles.chipOn]}
              onPress={() => selectFilter(f.key)}>
              <Text
                style={[
                  styles.chipText,
                  filter === f.key && styles.chipTextOn,
                ]}>
                {f.label} {totalOf(f.key)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.searchBox}>
          <Icon name="search" size={14} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari customer / nomor / pesan"
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

        <Text style={styles.listTitle}>
          {filteredList.length} dari {total} pesan
        </Text>

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
                  ? 'Pesan tidak ditemukan.'
                  : filter
                  ? 'Belum ada pesan dengan status ini.'
                  : 'Antrean kosong.'}
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

export default NotificationQueueView;

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
  chipsScroll: {flexGrow: 0, marginBottom: 10},
  chips: {gap: 7, paddingRight: 8},
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
  listTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
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
  name: {fontSize: 12.5, fontWeight: '700', color: '#333'},
  phone: {fontSize: 10, color: '#999', marginTop: 1},
  preview: {fontSize: 10.5, color: '#6B6480', marginTop: 2},
  error: {fontSize: 9.5, color: '#B91C1C', marginTop: 2},
  right: {alignItems: 'flex-end', maxWidth: 104},
  statusTag: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  statusText: {fontSize: 8.5, fontWeight: '700'},
  date: {fontSize: 9, color: '#AAA'},
  time: {fontSize: 9, color: '#AAA'},
  attempts: {fontSize: 8.5, color: '#B9B9C6', marginTop: 4},
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    paddingVertical: 24,
  },
});
