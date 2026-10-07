import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import InputText from '../../components/InputText';
import SegmentedTabs from '../../components/SegmentedTabs';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {
  getPaymentHistory,
  getPaymentSummaryList,
  sendInvoiceBlast,
} from '../../resource/Payment';
import {useSessionStore} from '../../store/sessionStore';

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
  0: {label: 'PENDING', color: color.warning},
  1: {label: 'SUCCESS', color: color.success},
};

const PaymentTab = () => {
  const [activeTab, setActiveTab] = useState('Pending');
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  // Blast tagihan (kirim invoice ke semua customer belum lunas pada session
  // terpilih) — state `blasting` menahan tombol saat request berjalan.
  const [blasting, setBlasting] = useState(false);

  // Session dropdown — daftar session dari store (cache MMKV). Tidak
  // di-fetch ulang saat kembali ke layar; refresh hanya via pull-to-refresh.
  const sessionList = useSessionStore(s => s.sessionList);
  const fetchSessionList = useSessionStore(s => s.fetchSessionList);
  const initSessionListFromCache = useSessionStore(
    s => s.initSessionListFromCache,
  );
  const setSessionList = useSessionStore(s => s.setSessionList);
  // Session terpilih disimpan di store (persist MMKV) beserta datanya —
  // sumber tunggal filter. Saat kembali ke Payment, pilihan tetap tampil
  // tanpa perlu muat ulang.
  const selectedSession = useSessionStore(s => s.selectedSession);
  const selectSession = useSessionStore(s => s.selectSession);
  // Value dropdown = id session terpilih (jika masih ada di daftar).
  const sessionValue =
    selectedSession && sessionList.some(s => s.id === selectedSession.id)
      ? selectedSession.id
      : null;
  const [sessionOpen, setSessionOpen] = useState(false);

  // Cegah setState setelah screen unmount (stale response saat ganti screen)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Session terakhir yang dimuat — mencegah duplikat request dari onChangeValue
  // DropDownPicker (yang ikut terpicu saat value/items berubah).
  const lastLoadedSessionRef = useRef(null);

  const loadData = async sessionId => {
    lastLoadedSessionRef.current = sessionId;
    setLoading(true);
    // Tanpa session terpilih → jangan muat data tanpa filter session.
    // (Opsi "Semua Session" sudah dihapus; null hanya terjadi saat tidak ada
    // session aktif — tampilkan daftar kosong, bukan data seluruh session.)
    if (!sessionId) {
      setBills([]);
      setHistory([]);
      setLoading(false);
      return;
    }
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
  // berubah. Tanpa guard ini, perubahan items/value ikut memicu onChangeValue →
  // loadData duplikat.
  const handleSessionChange = value => {
    if (lastLoadedSessionRef.current !== value) {
      loadData(value);
    }
  };

  // Pilih session di dropdown → simpan lengkap ke store (persist MMKV).
  // Catatan: react-native-dropdown-picker memanggil setValue dengan FUNGSI
  // (state => newValue) — evaluasi dulu sebelum dipakai.
  const handleSelectSession = value => {
    const id = typeof value === 'function' ? value(sessionValue) : value;
    const session = sessionList.find(s => s.id === id) || null;
    selectSession(session);
  };

  // Saat tab Payment aktif: muat daftar session dari cache MMKV (tanpa
  // network). Data tagihan/riwayat TIDAK di-fetch ulang — hanya saat session
  // berubah (onChangeValue) atau pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      initSessionListFromCache();
    }, [initSessionListFromCache]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSessionList(true);
      loadData(sessionValue);
    } finally {
      setRefreshing(false);
    }
  };

  // ===== Blast tagihan (FAB) — kirim invoice ke semua customer belum lunas =====
  // Jalankan request blast. Session id diambil dari session terpilih di store
  // (sumber yang sama dengan filter list & navigasi detail), bukan hardcode.
  const handleBlast = async () => {
    if (blasting) {
      return;
    }
    setBlasting(true);
    const result = await sendInvoiceBlast({session_id: sessionValue}, false);
    setBlasting(false);
    if (!mountedRef.current) {
      return;
    }
    if (!result || result.error) {
      Alert.alert(
        'Gagal',
        (result && result.message) || 'Gagal kirim tagihan blast',
      );
      return;
    }
    // Ringkasan hasil: hitung dari rows (sent/failed/skipped); fallback ke
    // pesan dari backend bila rows tidak ada.
    const rows = Array.isArray(result.rows) ? result.rows : [];
    const counts = rows.reduce(
      (acc, row) => {
        if (row.status === 'sent') {
          acc.sent += 1;
        } else if (row.status === 'failed') {
          acc.failed += 1;
        } else if (row.status === 'skipped') {
          acc.skipped += 1;
        }
        return acc;
      },
      {sent: 0, failed: 0, skipped: 0},
    );
    const summary = rows.length
      ? `${counts.sent} terkirim, ${counts.failed} gagal, ${counts.skipped} dilewati`
      : result.message || 'Tagihan terkirim';
    Toast.show({type: 'success', text1: 'Berhasil', text2: summary});
  };

  // Konfirmasi sebelum blast (tombol Batal / Kirim).
  const handleConfirmBlast = () => {
    if (blasting) {
      return;
    }
    if (!sessionValue) {
      Alert.alert('Blast Tagihan', 'Pilih session terlebih dahulu.');
      return;
    }
    Alert.alert(
      'Blast Tagihan',
      'Kirim tagihan ke semua customer yang belum lunas di session ini?',
      [
        {text: 'Batal', style: 'cancel'},
        {text: 'Kirim', onPress: handleBlast},
      ],
    );
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
            <Text style={styles.amountPaid}>
              {formatRupiah(item.total_paid)}
            </Text>
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
            {item.payment_date
              ? moment(item.payment_date).format('DD MMM YYYY, HH:mm')
              : item.created_date
              ? moment(item.created_date).format('DD MMM YYYY, HH:mm')
              : ''}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: rec.color}]}>
          <Text style={styles.badgeText}>{rec.label}</Text>
        </View>
      </View>
    );
  };

  const list =
    activeTab === 'Pending' ? pending : activeTab === 'Paid' ? paid : history;
  const renderItem = activeTab === 'Riwayat' ? renderHistory : renderBill;

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
          setValue={handleSelectSession}
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

      <SegmentedTabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        style={{marginTop: 0}}
      />

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

        {/* FAB Blast — kirim tagihan ke semua customer belum lunas pada
            session terpilih (tab Pending). Di-disable selama request jalan. */}
        {activeTab === 'Pending' && (
          <TouchableOpacity
            style={[styles.fab, blasting && styles.fabDisabled]}
            onPress={handleConfirmBlast}
            disabled={blasting}
            activeOpacity={0.8}>
            {blasting ? (
              <ActivityIndicator size="small" color={color.white} />
            ) : (
              <>
                <Icon name="send" size={20} color={color.white} />
                <Text style={styles.fabText}>Blast</Text>
              </>
            )}
          </TouchableOpacity>
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
  // FAB Blast — mengikuti gaya FAB list lain (CustomerList/PriceCodeList):
  // bulat, warna primary, shadow/elevation. Bentuk pill agar muat label.
  // right: 0 (bukan 20) karena FAB ada di dalam listWrap yang sudah
  // terkena paddingHorizontal container = 20 → tepi FAB 20px dari layar.
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 16,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: color.primaryColor,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  fabDisabled: {
    opacity: 0.7,
  },
  fabText: {
    color: color.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
