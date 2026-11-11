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
  recipient_never_contacted: 'Belum pernah membalas',
};

const NotificationReportView = () => {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
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

  const filteredList = list.filter(item => {
    const q = search.trim().toLowerCase();
    if (!q) {return true;}
    return (
      (item.phone || '').toLowerCase().includes(q) ||
      (item.recipient_name || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    );
  });

  const renderItem = item => {
    const busy = retryingId === item.id;
    const date = item.last_attempt_date || item.created_date;
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.avatar}>
            <Icon name="shield-alert" size={17} color="#B91C1C" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {item.recipient_name || item.phone}
            </Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
          <Text style={styles.date}>
            {date ? moment(date).format('DD MMM HH:mm') : '-'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.reasonTag}>
            <Text style={styles.reasonText}>
              {REASON_LABEL[item.reason] || item.reason || 'Ditahan'}
            </Text>
          </View>
          <Text style={styles.metaText}>
            {item.channel_code} · {item.attempts || 0}x ditahan
          </Text>
        </View>

        {!!item.message_preview && (
          <Text style={styles.preview} numberOfLines={3}>
            “{item.message_preview}”
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.retryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => retry(item)}>
            <Icon name="refresh-cw" size={14} color={color.white} />
            <Text style={styles.retryText}>
              {busy ? 'Mengirim...' : 'Kirim Ulang'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            disabled={busy}
            onPress={() => remove(item)}>
            <Icon name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
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
      <Header title={`Notification Report (${total})`} />
      <View style={styles.container}>
        <Text style={styles.info}>
          Pesan ke nomor ini ditahan karena belum pernah ada pesan masuk.
          Setelah customer membalas, tekan Kirim Ulang.
        </Text>

        <View style={styles.searchBox}>
          <Icon name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama / nomor..."
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#B0B0B0"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="x" size={16} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredList.length === 0 && (
          <Text style={styles.emptyText}>
            {search ? 'Tidak ditemukan.' : 'Tidak ada penerima yang ditahan.'}
          </Text>
        )}

        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({item}) => renderItem(item)}
          contentContainerStyle={styles.listContent}
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
    paddingVertical: 15,
  },
  flex: {flex: 1, minWidth: 0},
  info: {
    fontSize: 11,
    color: '#8A8A97',
    lineHeight: 16,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 10,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    paddingVertical: 24,
  },
  listContent: {paddingBottom: 24},
  card: {
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 13,
    marginBottom: 12,
  },
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {fontSize: 13.5, fontWeight: '700', color: '#1F1F1F'},
  phone: {fontSize: 11, color: '#8A8A8A', marginTop: 1},
  date: {fontSize: 9.5, color: '#AAA'},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
    flexWrap: 'wrap',
  },
  reasonTag: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  reasonText: {fontSize: 9, fontWeight: '700', color: '#B91C1C'},
  metaText: {fontSize: 9.5, color: '#9A9A9A'},
  preview: {
    fontSize: 11,
    color: '#4A4A4A',
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F8',
    marginTop: 10,
    paddingTop: 10,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.primaryColor,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {color: color.white, fontSize: 11.5, fontWeight: '700'},
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {opacity: 0.6},
});
