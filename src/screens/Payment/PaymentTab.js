import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import InputText from '../../components/InputText';
import SegmentedTabs from '../../components/SegmentedTabs';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {
  getPaymentHistory,
  getPaymentSummaryList,
} from '../../resource/Payment';
import {getSessionList} from '../../resource/Session';

// Tab "Payment" — pembayaran bertahap PER CUSTOMER (module payment baru).
//
//   Pending  : SEMUA customer yang masih punya sisa tagihan (belum bayar &
//              belum lunas) pada session terpilih. Tap customer → detail
//              tagihan (item yang dipesan) → PaymentCreate.
//   Paid     : customer yang sudah lunas (sisa tagihan = 0) pada session.
//   Riwayat  : daftar payment record (SUCCESS / PENDING / CANCELLED).
//
// Data ditampilkan berdasarkan session yang dipilih (default: session aktif).
const CloseIcon = ({style}) => (
  <Icon name="x" size={20} color="#9CA3AF" style={style} />
);

const CustomArrowIcon = () => (
  <Icon name="chevron-down" size={18} color="#9CA3AF" />
);

const CustomTickIcon = () => (
  <Icon name="check" size={16} color={color.primaryColor} />
);

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
  const [query, setQuery] = useState('');

  // Session dropdown (default: session aktif)
  const [sessionList, setSessionList] = useState([]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionValue, setSessionValue] = useState(null);

  // Cegah setState setelah screen unmount (stale response saat ganti screen)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Session terakhir yang dimuat — mencegah duplikat request dari onChangeValue
  // DropDownPicker (yang ikut terpicu saat loadSessions meng-set sessionValue).
  const lastLoadedSessionRef = useRef(null);

  const loadData = async sessionId => {
    lastLoadedSessionRef.current = sessionId;
    setLoading(true);
    const [b, h] = await Promise.all([
      getPaymentSummaryList({session_id: sessionId}, false),
      getPaymentHistory({session_id: sessionId}, false),
    ]);
    if (!mountedRef.current) {
      return;
    }
    if (b) {
      setBills(b);
    }
    if (h) {
      setHistory(h);
    }
    setLoading(false);
  };

  // onChangeValue DropDownPicker: panggil loadData hanya jika session benar-benar
  // berubah. Tanpa guard ini, setSessionValue() dari loadSessions ikut memicu
  // onChangeValue → loadData duplikat.
  const handleSessionChange = value => {
    if (lastLoadedSessionRef.current !== value) {
      loadData(value);
    }
  };

  const loadSessions = async () => {
    const list = await getSessionList({}, false);
    if (!mountedRef.current) {
      return;
    }
    if (list) {
      setSessionList(list);
      // Default: session aktif
      const active = list.find(s => s.status === 'Active');
      const next = active ? active.id : null;
      setSessionValue(next);
      loadData(next);
    }
  };

  // Muat ulang setiap kali tab Payment aktif (data bisa berubah setelah
  // PaymentCreate / session baru).
  useFocusEffect(
    useCallback(() => {
      loadSessions();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  // Filter customer by nama / no. HP (tab Pending & Paid)
  const kw = query.trim().toLowerCase();
  const filteredBills = bills.filter(
    b =>
      !kw ||
      (b.customer_name || '').toLowerCase().includes(kw) ||
      (b.customer_phone || '').toLowerCase().includes(kw),
  );
  const pending = filteredBills.filter(b => Number(b.remaining_amount) > 0);
  const paid = filteredBills.filter(b => Number(b.remaining_amount) <= 0);

  const renderBill = item => {
    const status = item.payment_status || 'UNPAID';
    return (
      <Pressable
        onPress={() =>
          RootNavigation.navigate('PaymentCustomerDetail', {
            customer_id: item.customer_id,
            session_id: sessionValue,
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

  const list =
    activeTab === 'Pending'
      ? pending
      : activeTab === 'Paid'
        ? paid
        : history;
  const renderItem =
    activeTab === 'Riwayat' ? renderHistory : renderBill;

  const tabs = [
    {key: 'Pending', label: 'Pending', qty: pending.length},
    {key: 'Paid', label: 'Paid', qty: paid.length},
    {key: 'Riwayat', label: 'Riwayat', qty: history.length},
  ];

  const emptyText =
    activeTab === 'Pending'
      ? 'Belum ada tagihan pending'
      : activeTab === 'Paid'
        ? 'Belum ada customer lunas'
        : 'Belum ada riwayat payment';

  // Items dropdown session — WAJIB di-memoize. DropDownPicker v5 memanggil
  // onChangeValue setiap kali referensi `items` berubah; array inline yang dibuat
  // ulang tiap render akan memicu loop tak berujung (loadData → setState → render
  // → items baru → onChangeValue → ...).
  const sessionItems = useMemo(
    () => [
      {label: 'Semua Session', value: null},
      ...sessionList.map(s => ({
        label: `${s.session_no} • ${s.country || '-'} (${s.status})`,
        value: s.id,
      })),
    ],
    [sessionList],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Kelola tagihan & pembayaran customer</Text>

      {/* Dropdown pilih session */}
      <View style={styles.dropdownWrap}>
        <DropDownPicker
          open={sessionOpen}
          value={sessionValue}
          items={sessionItems}
          setOpen={setSessionOpen}
          setValue={setSessionValue}
          setItems={setSessionList}
          onChangeValue={handleSessionChange}
          placeholder="Pilih session jastip"
          style={styles.picker}
          dropDownContainerStyle={styles.pickerDropdown}
          listMode="MODAL"
          modalAnimationType="slide"
          modalContentContainerStyle={styles.pickerModal}
          searchable
          searchPlaceholder="Cari session..."
          searchContainerStyle={styles.pickerSearchContainer}
          searchTextInputStyle={styles.pickerSearchInput}
          searchPlaceholderTextColor="#9CA3AF"
          CloseIconComponent={CloseIcon}
          closeIconStyle={styles.pickerCloseIcon}
          closeIconContainerStyle={styles.pickerCloseIconContainer}
          textStyle={styles.pickerText}
          labelStyle={styles.pickerLabel}
          placeholderStyle={styles.pickerPlaceholder}
          arrowIconStyle={styles.pickerArrow}
          tickIconStyle={styles.pickerTick}
          customArrowIcon={CustomArrowIcon}
          customTickIcon={CustomTickIcon}
          listItemContainerStyle={styles.pickerListItem}
          listItemLabelStyle={styles.pickerListItemLabel}
          selectedItemContainerStyle={styles.pickerSelectedItem}
          selectedItemLabelStyle={styles.pickerSelectedLabel}
          itemSeparatorStyle={styles.pickerItemSeparator}
          listMessageContainerStyle={styles.pickerEmptyContainer}
          listMessageTextStyle={styles.pickerEmptyText}
          closeOnBackPressed
          zIndex={1000}
        />
      </View>

      {/* Pencarian customer (tab Pending & Paid) */}
      {activeTab !== 'Riwayat' && (
        <InputText
          value={query}
          onChangeText={setQuery}
          placeholder="Cari customer..."
          rightIcon={<Icon name="search" size={18} color="#9CA3AF" />}
        />
      )}

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
            ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
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
  dropdownWrap: {
    zIndex: 1000,
    marginBottom: 12,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  pickerDropdown: {
    borderColor: '#E5E5E5',
  },
  pickerModal: {
    backgroundColor: color.white,
  },
  pickerSearchContainer: {
    borderBottomColor: '#E5E5E5',
  },
  pickerSearchInput: {
    borderColor: '#E5E5E5',
  },
  pickerCloseIcon: {
    width: 28,
    height: 28,
  },
  pickerCloseIconContainer: {
    padding: 4,
  },
  pickerText: {
    fontSize: 14,
    color: '#1F1F1F',
  },
  pickerLabel: {
    fontWeight: '600',
  },
  pickerPlaceholder: {
    color: '#9CA3AF',
  },
  pickerArrow: {
    width: 20,
    height: 20,
  },
  pickerTick: {
    width: 20,
    height: 20,
  },
  pickerListItem: {
    paddingVertical: 12,
  },
  pickerListItemLabel: {
    fontSize: 14,
    color: '#1F1F1F',
  },
  pickerSelectedItem: {
    backgroundColor: color.primaryLight,
  },
  pickerSelectedLabel: {
    fontWeight: '700',
    color: color.primaryColor,
  },
  pickerItemSeparator: {
    height: 1,
    backgroundColor: '#F0F0F5',
  },
  pickerEmptyContainer: {
    padding: 20,
  },
  pickerEmptyText: {
    color: '#9CA3AF',
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
