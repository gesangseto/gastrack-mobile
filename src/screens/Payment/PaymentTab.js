import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MenuTile from '../../components/MenuTile';
import SegmentedTabs from '../../components/SegmentedTabs';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {
  getPaymentHistory,
  getPaymentSummaryList,
} from '../../resource/Payment';

// Tab "Payment" — pembayaran bertahap PER CUSTOMER (module payment baru).
//
//   Pending  : customer yang SUDAH punya payment record & masih punya sisa
//              tagihan (belum lunas). Tap customer → PaymentCreate.
//   Riwayat  : daftar payment record (SUCCESS / PENDING / CANCELLED).
//
// Customer BARU (punya item tapi belum pernah tercatat payment) dikelola
// lewat PaymentCreate — tidak tampil di tab Pending.
const PAYMENT_TABS = [
  {key: 'Pending', label: 'Pending'},
  {key: 'Riwayat', label: 'Riwayat'},
];

const formatRupiah = value => {
  const n = Number(value || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
};

// Warna badge status pembayaran customer
const STATUS_COLOR = {
  UNPAID: color.danger,
  PARTIAL: color.warning,
  PAID: color.success,
};

// Warna badge status payment record (-1 CANCELLED, 0 PENDING, 1 SUCCESS)
const RECORD_STATUS = {
  '-1': {label: 'CANCELLED', color: color.danger},
  '0': {label: 'PENDING', color: color.warning},
  '1': {label: 'SUCCESS', color: color.success},
};

const PaymentTab = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [b, h] = await Promise.all([
      getPaymentSummaryList(false),
      getPaymentHistory({}, false),
    ]);
    if (b) {
      // Tab Pending = customer yang sudah punya payment record & masih punya
      // sisa tagihan (belum lunas). Customer baru (belum punya payment record)
      // dikelola lewat PaymentCreate.
      setBills(
        b.filter(
          x => x.has_payment_record && Number(x.remaining_amount) > 0,
        ),
      );
    }
    if (h) {setHistory(h);}
    setLoading(false);
  };

  // Muat ulang setiap kali tab Payment aktif (data bisa berubah setelah
  // PaymentCreate / session baru).
  useFocusEffect(
    useCallback(() => {
      loadData();

    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderBill = item => {
    const status = item.payment_status || 'UNPAID';
    return (
      <Pressable
        onPress={() =>
          RootNavigation.navigate('PaymentCreate', {
            customer_id: item.customer_id,
          })
        }
        key={item.customer_id}
        style={styles.card}>
        <View style={styles.iconBox}>
          <Icon name="receipt-text" size={22} color={color.primaryColor} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.customer_name || `Customer #${item.customer_id}`}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.customer_phone || '—'}
          </Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Tagihan</Text>
            <Text style={styles.amountValue}>
              {formatRupiah(item.grand_total)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Dibayar</Text>
            <Text style={styles.amountPaid}>{formatRupiah(item.total_paid)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Sisa</Text>
            <Text style={styles.amountRemaining}>
              {formatRupiah(item.remaining_amount)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.badge,
            {backgroundColor: STATUS_COLOR[status] || '#C4C4C4'},
          ]}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </Pressable>
    );
  };

  const renderHistory = item => {
    const rec = RECORD_STATUS[item.status] || {
      label: 'UNKNOWN',
      color: '#C4C4C4',
    };
    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.iconBox}>
          <Icon name="wallet" size={22} color={color.primaryColor} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.customer_name || `Customer #${item.customer_id}`}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.payment_method || '—'}
            {item.reference_number ? ` • ${item.reference_number}` : ''}
          </Text>
          <Text style={styles.amountValue}>{formatRupiah(item.amount)}</Text>
          <Text style={styles.date}>
            {item.payment_date || item.created_date || ''}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: rec.color}]}>
          <Text style={styles.badgeText}>{rec.label}</Text>
        </View>
      </View>
    );
  };

  const list = activeTab === 'Pending' ? bills : history;
  const renderItem = activeTab === 'Pending' ? renderBill : renderHistory;

  const tabs = PAYMENT_TABS.map(t => ({
    ...t,
    qty: t.key === 'Pending' ? bills.length : history.length,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Kelola tagihan & pembayaran customer</Text>

      <MenuTile
        icon="plus"
        iconBg={color.primaryLight}
        iconColor={color.primaryColor}
        title="Tambah Payment"
        desc="Catat pembayaran customer"
        onPress={() => RootNavigation.navigate('PaymentCreate')}
      />

      <SegmentedTabs items={tabs} value={activeTab} onChange={setActiveTab} />

      <View style={styles.listWrap}>
        {loading && list.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={color.primaryColor}
            style={styles.loading}
          />
        ) : (
          <FlatList
            data={list}
            renderItem={({item}) => renderItem(item)}
            keyExtractor={(item, index) =>
              (item.id || item.customer_id)?.toString() || index.toString()
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[color.primaryColor]}
              />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>
                {activeTab === 'Pending'
                  ? 'Belum ada tagihan pending'
                  : 'Belum ada riwayat payment'}
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
};

export default PaymentTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 74,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  subtitle: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 2,
    marginBottom: 14,
  },
  listWrap: {
    flex: 1,
  },
  loading: {
    marginTop: 24,
  },
  listContent: {
    paddingBottom: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#9A9A9A',
    marginTop: 40,
    fontSize: 13,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 12,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: '700',
    color: '#1F1F1F',
    fontSize: 14,
  },
  sub: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  amountLabel: {
    color: '#9A9A9A',
    fontSize: 11,
  },
  amountValue: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  amountPaid: {
    color: color.success,
    fontSize: 13,
    fontWeight: '700',
  },
  amountRemaining: {
    color: color.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: '#C4C4C4',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: color.white,
  },
});
