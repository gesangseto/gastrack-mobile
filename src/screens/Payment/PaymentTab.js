import Icon from '@react-native-vector-icons/lucide';
import {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ItemCard from '../../components/ItemCard';
import color from '../../constant/color';
import {
  createInvoice,
  getPaymentItems,
  markPaid,
  payInvoice,
} from '../../resource/Payment';
import {getProfile} from '../../storage';

// Tab "Payment" — dipakai inline di dalam bottom navigation (TabView).
//
// Dua cara melunasi item:
//  1. Flow invoice: buat invoice Waiting dari item (payment_status null) milik
//     satu customer, lalu bayar dengan mengisi nomor invoice.
//     Atau bayar invoice yang sudah ada (item payment_status=0 / Waiting).
//  2. Tandai lunas langsung: set payment_status=1 tanpa record invoice.
const genInvoiceNumber = customerId => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `INV-${customerId ?? 'X'}-${stamp}`;
};

const PaymentTab = () => {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [pending, setPending] = useState(null);

  const loadData = async (searchText = '') => {
    setLoading(true);
    const response = await getPaymentItems(
      searchText ? {search: searchText} : {},
    );
    if (response) {
      setList(response);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Filter dijalankan di server (param `search`), bukan saat render.
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(search);
    setRefreshing(false);
  };

  const toggle = item => {
    setSelected(prev => {
      const next = {...prev};
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  };

  const selectedItems = useMemo(() => Object.values(selected), [selected]);
  const count = selectedItems.length;
  const customerIds = useMemo(
    () => [...new Set(selectedItems.map(i => i.customer_id))],
    [selectedItems],
  );
  const trxIds = useMemo(
    () => [
      ...new Set(
        selectedItems
          .map(i => i.trx_id)
          .filter(v => v !== null && v !== undefined),
      ),
    ],
    [selectedItems],
  );
  const allUnpaid =
    count > 0 &&
    selectedItems.every(i => i.payment_status === null || i.payment_status === undefined);
  const allWaiting =
    count > 0 && selectedItems.every(i => Number(i.payment_status) === 0);

  let invoiceMode = null;
  if (count > 0) {
    if (allUnpaid && customerIds.length === 1) {
      invoiceMode = 'create';
    } else if (allWaiting && trxIds.length === 1) {
      invoiceMode = 'existing';
    }
  }

  const invoiceHint = () => {
    if (count === 0) {
      return 'Pilih item dulu';
    }
    if (customerIds.length > 1) {
      return 'Invoice hanya untuk item dari 1 customer yang sama';
    }
    return 'Campuran item belum & sudah invoice — pisahkan pilihannya';
  };

  const doMarkPaid = async () => {
    setSubmitting(true);
    const ok = await markPaid(selectedItems.map(i => i.id));
    setSubmitting(false);
    if (ok) {
      setSelected({});
      loadData(search);
    }
  };

  const handleMarkPaid = () => {
    if (count === 0 || submitting) {
      return;
    }
    Alert.alert(
      'Tandai Lunas',
      `Tandai ${count} item sebagai LUNAS tanpa invoice?`,
      [
        {text: 'Batal', style: 'cancel'},
        {text: 'Lunas', onPress: doMarkPaid},
      ],
    );
  };

  const handleInvoice = () => {
    if (submitting) {
      return;
    }
    if (!invoiceMode) {
      Toast.show({
        type: 'error',
        text1: 'Tidak bisa invoice',
        text2: invoiceHint(),
      });
      return;
    }
    const customerId = selectedItems[0]?.customer_id;
    setPending({
      mode: invoiceMode,
      invoiceId: invoiceMode === 'existing' ? trxIds[0] : null,
      customer_id: customerId,
    });
    setInvoiceNumber(genInvoiceNumber(customerId));
    setModalVisible(true);
  };

  const submitInvoice = async () => {
    const number = invoiceNumber.trim();
    if (!number) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nomor invoice wajib diisi',
      });
      return;
    }
    setSubmitting(true);
    let invoiceId = pending?.invoiceId;
    if (pending?.mode === 'create') {
      const inv = await createInvoice({
        customer_id: pending.customer_id,
        items: selectedItems.map(i => ({id: i.id})),
        created_by: getProfile()?.id || 0,
      });
      if (!inv || !inv.id) {
        setSubmitting(false);
        return;
      }
      invoiceId = inv.id;
    }
    const ok = await payInvoice({
      id: invoiceId,
      invoice_number: number,
      modified_by: getProfile()?.id || 0,
    });
    setSubmitting(false);
    if (ok) {
      setModalVisible(false);
      setPending(null);
      setSelected({});
      loadData(search);
    }
  };

  const renderItem = item => {
    const waiting = Number(item.payment_status) === 0;
    return (
      <ItemCard
        item={item}
        selected={!!selected[item.id]}
        onToggle={toggle}
        right={
          <View style={[styles.badge, waiting && styles.badgeWaiting]}>
            <Text style={[styles.badgeText, waiting && styles.badgeTextWaiting]}>
              {waiting ? 'Waiting' : 'Baru'}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment ({list.length})</Text>
        <Text style={styles.subtitle}>Item yang belum lunas</Text>
      </View>

      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={color.primaryColor} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama customer / barcode..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadData(search)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearch('');
              loadData('');
            }}>
            <Icon name="x" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={list}
        renderItem={({item}) => renderItem(item)}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
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
            {loading ? 'Memuat...' : 'Tidak ada item yang perlu dibayar'}
          </Text>
        }
      />

      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={handleMarkPaid}
          disabled={count === 0 || submitting}
          style={[
            styles.actionButton,
            styles.paidButton,
            (count === 0 || submitting) && styles.actionDisabled,
          ]}>
          <Icon name="check-check" size={16} color={color.white} />
          <Text style={styles.actionText}>Tandai Lunas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleInvoice}
          disabled={count === 0 || submitting}
          style={[
            styles.actionButton,
            styles.invoiceButton,
            (count === 0 || submitting) && styles.actionDisabled,
          ]}>
          {submitting ? (
            <ActivityIndicator size="small" color={color.white} />
          ) : (
            <Icon name="receipt" size={16} color={color.white} />
          )}
          <Text style={styles.actionText}>
            {invoiceMode === 'existing' ? 'Bayar Invoice' : 'Buat Invoice'} (
            {count})
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pending?.mode === 'existing' ? 'Bayar Invoice' : 'Buat Invoice'}
            </Text>
            <Text style={styles.modalSub}>
              {count} item • customer {pending?.customer_id}
            </Text>
            <Text style={styles.modalLabel}>Nomor Invoice</Text>
            <TextInput
              style={styles.modalInput}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="INV-..."
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={submitting}
                style={[styles.modalButton, styles.modalCancel]}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitInvoice}
                disabled={submitting}
                style={[styles.modalButton, styles.modalSubmit]}>
                {submitting ? (
                  <ActivityIndicator size="small" color={color.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Bayar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    marginBottom: 8,
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
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    height: 42,
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
  badge: {
    backgroundColor: color.primaryLighter,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  badgeWaiting: {
    backgroundColor: '#FFF4E5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: color.primaryColor,
  },
  badgeTextWaiting: {
    color: color.secondaryColor,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    height: 48,
  },
  paidButton: {
    backgroundColor: color.success,
  },
  invoiceButton: {
    backgroundColor: color.primaryColor,
  },
  actionDisabled: {
    backgroundColor: '#C4C4C4',
  },
  actionText: {
    color: color.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: color.white,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  modalSub: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 2,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 16,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: '#1F1F1F',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    backgroundColor: color.primaryLight,
  },
  modalCancelText: {
    color: color.primaryColor,
    fontWeight: '700',
    fontSize: 14,
  },
  modalSubmit: {
    backgroundColor: color.primaryColor,
  },
  modalSubmitText: {
    color: color.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
