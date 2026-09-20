import Icon from '@react-native-vector-icons/lucide';
import {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import InputText from '../../components/InputText';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {
  createPayment,
  getPaymentSummary,
  getPaymentSummaryList,
} from '../../resource/Payment';
import {getProfile} from '../../storage';

// Metode pembayaran (harus sama dengan PAYMENT_METHODS di backend)
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'];

const formatRupiah = value => {
  const n = Number(value || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
};

const STATUS_COLOR = {
  UNPAID: color.danger,
  PARTIAL: color.warning,
  PAID: color.success,
};

const today = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Layar "Tambah Payment" — pembayaran bertahap per customer.
// Dibuka dari detail tagihan (PaymentCustomerDetail) dengan param
// customer_id + session_id (opsional) → customer sudah terpilih.
const PaymentCreate = ({route}) => {
  const sessionId = route?.params?.session_id;
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Daftar customer baru (punya item, belum punya payment record)
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Autocomplete customer
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  // Form payment
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(today());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const searchSeqRef = useRef(0);

  // Jika dibuka dari tab Pending (customer sudah terpilih)
  useEffect(() => {
    loadCandidates();
    if (route?.params?.customer_id) {
      loadCustomerById(route.params.customer_id);
    }
    // route stabil seumur hidup screen — cukup sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Customer baru = punya item tapi BELUM punya payment record sama sekali
  // (has_payment_record = false). Diambil dari summary list modul payment.
  const loadCandidates = async () => {
    setCandidatesLoading(true);
    const list = await getPaymentSummaryList({session_id: sessionId}, false);
    setCandidatesLoading(false);
    if (list) {
      setCandidates(list.filter(x => !x.has_payment_record));
    }
  };

  const loadCustomerById = async customerId => {
    setSummaryLoading(true);
    const s = await getPaymentSummary(customerId, sessionId, false);
    setSummaryLoading(false);
    if (s) {
      setSelectedCustomer({
        id: s.customer_id,
        name: s.customer_name,
        phone: s.customer_phone,
      });
      setQuery(s.customer_name || '');
      setSummary(s);
    }
  };

  // Pencarian customer saat ketikan >= 2 karakter (debounce 400ms).
  // Pencarian dilakukan di daftar customer baru (candidates) — client-side.
  useEffect(() => {
    if (!query || query.length < 2 || selectedCustomer || candidatesLoading) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(() => searchCustomer(query), 400);
    return () => clearTimeout(timer);
    // searchCustomer dibuat ulang tiap render — sengaja bukan dep agar
    // debounce tidak ter-reset oleh render lain
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCustomer, candidates, candidatesLoading]);

  const searchCustomer = async keyword => {
    const seq = ++searchSeqRef.current;
    setSearching(true);
    setShowSuggestions(true);
    const kw = keyword.toLowerCase();
    const result = candidates.filter(
      c =>
        (c.customer_name || '').toLowerCase().includes(kw) ||
        (c.customer_phone || '').toLowerCase().includes(kw),
    );
    setSearching(false);
    if (seq !== searchSeqRef.current) {return;}
    setSuggestions(result);
    setShowSuggestions(result.length > 0);
  };

  const selectCustomer = async cust => {
    searchSeqRef.current++;
    const selected = {
      id: cust.customer_id,
      name: cust.customer_name,
      phone: cust.customer_phone,
    };
    setSelectedCustomer(selected);
    setQuery(selected.name || '');
    setSuggestions([]);
    setShowSuggestions(false);
    // Muat ringkasan tagihan customer
    setSummaryLoading(true);
    const s = await getPaymentSummary(selected.id, sessionId, false);
    setSummaryLoading(false);
    if (s) {setSummary(s);}
  };

  const clearCustomer = () => {
    searchSeqRef.current++;
    setSelectedCustomer(null);
    setSummary(null);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const save = async () => {
    if (!selectedCustomer) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Pilih customer terlebih dahulu',
      });
      return;
    }
    const value = Number(amount);
    if (!value || value <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Jumlah pembayaran wajib diisi',
      });
      return;
    }
    if (summary && value > summary.remaining_amount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Melebihi sisa tagihan (${formatRupiah(summary.remaining_amount)})`,
      });
      return;
    }
    if (saving) {return;}
    setSaving(true);
    const ok = await createPayment({
      customer_id: selectedCustomer.id,
      session_id: sessionId,
      amount: value,
      payment_method: method,
      payment_date: paymentDate.trim() || null,
      reference_number: referenceNumber.trim() || null,
      notes: notes.trim() || null,
      created_by: getProfile()?.id || 0,
    });
    setSaving(false);
    if (ok) {RootNavigation.goBack();}
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Tambah Payment" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Pilih customer */}
          <InputText
            label="Customer"
            required
            showError
            value={query}
            onChangeText={text => {
              setSelectedCustomer(null);
              setSummary(null);
              setQuery(text);
            }}
            placeholder="Cari nama / nomor customer baru..."
            rightIcon={
              selectedCustomer ? <Icon name="x" size={18} color="#999" /> : null
            }
            onPressRightIcon={clearCustomer}
          />

          {/* Dropdown hasil pencarian customer baru */}
          {showSuggestions && (
            <View style={styles.suggestionBox}>
              {searching ? (
                <Text style={styles.suggestionHint}>Mencari customer...</Text>
              ) : (
                suggestions.map((cust, index) => (
                  <TouchableOpacity
                    key={cust.customer_id || index}
                    style={[
                      styles.suggestionItem,
                      index < suggestions.length - 1 &&
                        styles.suggestionItemBorder,
                    ]}
                    onPress={() => selectCustomer(cust)}>
                    <Text style={styles.suggestionName}>
                      {cust.customer_name}
                    </Text>
                    <Text style={styles.suggestionPhone}>
                      {cust.customer_phone}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Tidak ada customer baru sama sekali */}
          {!selectedCustomer &&
            !candidatesLoading &&
            candidates.length === 0 && (
              <Text style={styles.suggestionHint}>
                Tidak ada customer baru — semua customer sudah tercatat payment
              </Text>
            )}

          {/* Ringkasan tagihan customer terpilih */}
          {selectedCustomer && (
            <View style={styles.summaryBox}>
              {summaryLoading ? (
                <Text style={styles.summaryHint}>Memuat tagihan...</Text>
              ) : summary ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Tagihan</Text>
                    <Text style={styles.summaryValue}>
                      {formatRupiah(summary.grand_total)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sudah Dibayar</Text>
                    <Text style={styles.summaryPaid}>
                      {formatRupiah(summary.total_paid)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sisa Tagihan</Text>
                    <Text style={styles.summaryRemaining}>
                      {formatRupiah(summary.remaining_amount)}
                    </Text>
                  </View>
                  <View style={styles.summaryStatusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            STATUS_COLOR[summary.payment_status] || '#C4C4C4',
                        },
                      ]}>
                      <Text style={styles.statusBadgeText}>
                        {summary.payment_status}
                      </Text>
                    </View>
                    <Text style={styles.summaryItems}>
                      {summary.total_items} item • {summary.total_quantity} pcs
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.summaryHint}>
                  Tidak ada tagihan untuk customer ini
                </Text>
              )}
            </View>
          )}

          {/* Jumlah pembayaran */}
          <InputText
            label="Jumlah Pembayaran"
            required
            showError
            keyboardType="numeric"
            prefix="Rp"
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
          />

          {/* Metode pembayaran */}
          <Text style={styles.fieldLabel}>Metode Pembayaran</Text>
          <View style={styles.methodWrap}>
            {PAYMENT_METHODS.map(m => {
              const active = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, active && styles.methodChipActive]}
                  onPress={() => setMethod(m)}>
                  <Text
                    style={[
                      styles.methodChipText,
                      active && styles.methodChipTextActive,
                    ]}>
                    {m.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <InputText
            label="Tanggal Pembayaran"
            value={paymentDate}
            onChangeText={setPaymentDate}
            placeholder="YYYY-MM-DD"
          />
          <InputText
            label="No. Referensi"
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            placeholder="Opsional (misal: no. transfer)"
          />
          <InputText
            label="Catatan"
            value={notes}
            onChangeText={setNotes}
            placeholder="Opsional"
          />

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Menyimpan...' : 'Simpan Payment'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default PaymentCreate;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.white,
  },
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
  },
  suggestionBox: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionHint: {
    fontSize: 13,
    color: '#9A9A9A',
    paddingVertical: 14,
    textAlign: 'center',
  },
  suggestionItem: {
    paddingVertical: 12,
  },
  suggestionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.primaryLighter,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  suggestionPhone: {
    fontSize: 13,
    fontWeight: '500',
    color: color.primaryColor,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: color.primaryLight,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6A6A6A',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  summaryPaid: {
    fontSize: 14,
    fontWeight: '700',
    color: color.success,
  },
  summaryRemaining: {
    fontSize: 14,
    fontWeight: '700',
    color: color.danger,
  },
  summaryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: color.white,
  },
  summaryItems: {
    fontSize: 11,
    color: '#9A9A9A',
  },
  summaryHint: {
    fontSize: 13,
    color: '#9A9A9A',
    textAlign: 'center',
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#9A9A9A',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  methodWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  methodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: color.white,
  },
  methodChipActive: {
    borderColor: color.primaryColor,
    backgroundColor: color.primaryLight,
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  methodChipTextActive: {
    color: color.primaryColor,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
