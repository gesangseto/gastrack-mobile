import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
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
import {fetchCurrencies} from '../../resource/Currency';
import {fetchSysConfig} from '../../resource/Configuration';
import {getSysConfig} from '../../storage';
import {useHomeStore} from '../../store/homeStore';

// Unit pengali kode harga (harus sinkron dengan backend price-code-unit.js)
export const PRICE_UNIT_LIST = [
  {value: 'none', label: 'None', multiplier: 'x1'},
  {value: 'tens', label: 'Tens', multiplier: 'x10'},
  {value: 'hundreds', label: 'Hundreds', multiplier: 'x100'},
  {value: 'thousands', label: 'Thousands', multiplier: 'x1.000'},
  {value: 'ten_thousands', label: 'Ten Thousands', multiplier: 'x10.000'},
  {value: 'hundred_thousands', label: 'Hundred Thousands', multiplier: 'x100.000'},
  {value: 'million', label: 'Million', multiplier: 'x1.000.000'},
  {value: 'billion', label: 'Billion', multiplier: 'x1.000.000.000'},
];

const SessionView = () => {
  const dashboard = useHomeStore(s => s.dashboard);
  const fetchHome = useHomeStore(s => s.fetchHome);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form buka session
  const [countries, setCountries] = useState([]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [form, setForm] = useState({
    country: getSysConfig()?.country || 'Indonesia',
    currency: getSysConfig()?.currency || 'IDR',
    price_code_unit: getSysConfig()?.price_unit_code || 'none',
  });

  const activeSession = dashboard?.active_session || null;
  const summary = dashboard?.session_summary || {
    items_without_batch: 0,
    batches_not_shipping: 0,
  };

  const load = useCallback(async () => {
    setLoading(true);
    await fetchHome(false);
    const list = await getSessionList({}, false);
    if (list) {
      setHistory(list);
    }
    setLoading(false);
  }, [fetchHome]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Muat daftar negara (dari mst_currency) + konfigurasi aplikasi
  useEffect(() => {
    fetchCurrencies().then(list => {
      // Negara unik dari mst_currency (country → symbol)
      const seen = {};
      const uniq = (list || []).filter(it => {
        if (!it.country || seen[it.country]) {
          return false;
        }
        seen[it.country] = true;
        return true;
      });
      setCountries(uniq);
    });
    fetchSysConfig().then(conf => {
      if (conf) {
        setForm(prev => ({
          ...prev,
          country: conf.country || prev.country,
          currency: conf.currency || prev.currency,
          price_code_unit: conf.price_unit_code || prev.price_code_unit,
        }));
      }
    });
  }, []);

  // Currency otomatis dari negara yang dipilih (mst_currency → symbol)
  const selectCountry = country => {
    const c = countries.find(it => it.country === country);
    setForm(prev => ({
      ...prev,
      country,
      currency: c ? c.symbol : prev.currency,
    }));
    setCountryPickerOpen(false);
  };

  const handleStart = async () => {
    setBusy(true);
    const ok = await createSession({
      country: form.country,
      currency: form.currency,
      price_code_unit: form.price_code_unit,
    });
    setBusy(false);
    if (ok) {
      load();
    }
  };

  const handleClose = async () => {
    if (!activeSession) {
      return;
    }
    setBusy(true);
    const ok = await closeSession(activeSession.id, {});
    setBusy(false);
    if (ok) {
      load();
    }
  };

  const formatDate = d => {
    if (!d) {
      return '-';
    }
    return new Date(d).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unitLabel = value => {
    const u = PRICE_UNIT_LIST.find(it => it.value === value);
    return u ? `${u.label} (${u.multiplier})` : value;
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

              <View style={styles.activeMetaRow}>
                <View style={styles.activeMetaItem}>
                  <Text style={styles.activeMetaLabel}>Negara</Text>
                  <Text style={styles.activeMetaValue}>
                    {activeSession.country || '-'}
                  </Text>
                </View>
                <View style={styles.activeMetaItem}>
                  <Text style={styles.activeMetaLabel}>Currency</Text>
                  <Text style={styles.activeMetaValue}>
                    {activeSession.currency || '-'}
                  </Text>
                </View>
                <View style={styles.activeMetaItem}>
                  <Text style={styles.activeMetaLabel}>Unit Harga</Text>
                  <Text style={styles.activeMetaValue}>
                    {unitLabel(activeSession.price_code_unit)}
                  </Text>
                </View>
              </View>

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
              <Text style={styles.emptyTitle}>Buka Session Baru</Text>
              <Text style={styles.emptyDesc}>
                Pilih negara & unit kode harga. Item & batch akan terhubung ke
                session ini.
              </Text>

              {/* Negara */}
              <Text style={styles.fieldLabel}>Negara</Text>
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={() => setCountryPickerOpen(true)}>
                <Text style={styles.pickerValue}>{form.country}</Text>
                <Icon name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>

              {/* Currency (otomatis dari negara) */}
              <Text style={styles.fieldLabel}>Currency</Text>
              <View style={styles.currencyBox}>
                <Text style={styles.pickerValue}>{form.currency}</Text>
                <Icon name="badge-dollar-sign" size={18} color={color.primaryColor} />
              </View>
              <Text style={styles.fieldHint}>
                Currency otomatis dari negara terpilih (mst_currency).
              </Text>

              {/* Unit kode harga */}
              <Text style={styles.fieldLabel}>Unit Kode Harga (Cost)</Text>
              <View style={styles.unitWrap}>
                {PRICE_UNIT_LIST.map(u => {
                  const active = form.price_code_unit === u.value;
                  return (
                    <TouchableOpacity
                      key={u.value}
                      style={[styles.unitChip, active && styles.unitChipActive]}
                      onPress={() =>
                        setForm({...form, price_code_unit: u.value})
                      }>
                      <Text
                        style={[
                          styles.unitChipText,
                          active && styles.unitChipTextActive,
                        ]}>
                        {u.label}
                      </Text>
                      <Text
                        style={[
                          styles.unitChipSub,
                          active && styles.unitChipSubActive,
                        ]}>
                        {u.multiplier}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.fieldHint}>
                Unit cost dari session ini; unit selling mengikuti pengaturan
                aplikasi (sys_configuration).
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
                        s.status === 'Active' ? color.success : '#9A9A9A'
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
                    <Text style={styles.historyMeta}>
                      {s.country || '-'} · {s.currency || '-'} ·{' '}
                      {unitLabel(s.price_code_unit)}
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

      {/* Modal pilih negara */}
      <Modal
        visible={countryPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Negara</Text>
              <TouchableOpacity onPress={() => setCountryPickerOpen(false)}>
                <Icon name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: 400}}>
              {countries.length === 0 && (
                <Text style={styles.modalEmpty}>
                  Tidak ada data negara (mst_currency kosong).
                </Text>
              )}
              {countries.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.countryItem}
                  onPress={() => selectCountry(item.country)}>
                  <View style={styles.countryItemLeft}>
                    <Text style={styles.countryItemName}>{item.country}</Text>
                    <Text style={styles.countryItemCode}>{item.name}</Text>
                  </View>
                  <Text style={styles.countryItemSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  activeMetaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  activeMetaItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  activeMetaLabel: {
    color: '#C9BCE8',
    fontSize: 10,
    fontWeight: '600',
  },
  activeMetaValue: {
    color: color.white,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
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
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F1F1F',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    marginBottom: 18,
  },
  fieldLabel: {
    marginBottom: 6,
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 15,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D9D9E3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: color.white,
    marginBottom: 12,
  },
  pickerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D9D9E3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: color.white,
    marginBottom: 4,
  },
  unitWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  unitChip: {
    borderWidth: 1,
    borderColor: '#D9D9E3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: color.white,
    alignItems: 'center',
  },
  unitChipActive: {
    borderColor: color.primaryColor,
    backgroundColor: color.primaryColor,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  unitChipTextActive: {
    color: color.white,
  },
  unitChipSub: {
    fontSize: 9,
    color: '#9A9A9A',
    marginTop: 1,
  },
  unitChipSubActive: {
    color: '#C9BCE8',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: color.primaryColor,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
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
  historyMeta: {
    fontSize: 11,
    color: color.primaryColor,
    marginTop: 2,
    fontWeight: '500',
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A9A9A',
  },
  historyStatusActive: {
    color: color.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: color.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalEmpty: {
    fontSize: 13,
    color: '#9A9A9A',
    textAlign: 'center',
    paddingVertical: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  countryItemLeft: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  countryItemCode: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  countryItemSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: color.primaryColor,
  },
});
