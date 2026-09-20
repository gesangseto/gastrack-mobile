import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
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
import {PRICE_UNIT_LIST} from '../../constant/priceUnit';
import Header from '../../layouts/Header';
import {
  closeSession,
  createSession,
  updateSessionRate,
} from '../../resource/Session';
import {fetchCountries, fetchExchangeRate} from '../../resource/Country';
import {fetchSysConfig} from '../../resource/Configuration';
import {getSysConfig} from '../../storage';
import {useHomeStore} from '../../store/homeStore';
import {useSessionStore} from '../../store/sessionStore';
import Toast from 'react-native-toast-message';

const SessionView = () => {
  const dashboard = useHomeStore(s => s.dashboard);
  const fetchHome = useHomeStore(s => s.fetchHome);
  // Refresh daftar session di store + cache MMKV setelah buka/tutup session,
  // agar dropdown "Per Session Jastip" di Home tidak menampilkan data basi.
  const fetchSessionList = useSessionStore(s => s.fetchSessionList);

  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit rate konversi session aktif
  const [rateDraft, setRateDraft] = useState('');
  const [rateSaving, setRateSaving] = useState(false);

  // Flag: user sudah mengetik rate manual → auto-fetch API kurs TIDAK menimpa input
  const rateTouchedRef = useRef(false);

  // Form buka session
  const [countries, setCountries] = useState([]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [rateLoading, setRateLoading] = useState(false);
  const [form, setForm] = useState({
    country: getSysConfig()?.country || 'Indonesia',
    symbol_currency: 'Rp',
    currency: '1', // rate: 1 unit mata uang tujuan = X IDR
    price_code_unit: getSysConfig()?.price_unit_code || 'none',
  });

  const activeSession = dashboard?.active_session || null;
  const summary = dashboard?.session_summary || {
    items_without_batch: 0,
    batches_not_shipping: 0,
  };

  // Sinkronkan draft rate dengan session aktif (misal setelah load/refresh)
  useEffect(() => {
    if (activeSession?.currency) {
      setRateDraft(String(Math.ceil(Number(activeSession.currency))));
    }
  }, [activeSession?.currency]);

  const load = useCallback(async () => {
    try {
      await fetchHome(false);
    } catch (e) {
      console.log('load session error', e);
    }
  }, [fetchHome]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Muat daftar negara (dari mst_country) + konfigurasi aplikasi
  useEffect(() => {
    fetchCountries().then(list => {
      // Negara dari mst_country (name → currency_code/currency_symbol)
      const uniq = (list || []).filter(it => it.name);
      setCountries(uniq);
      // Default: symbol + rate untuk negara awal (dari sys_config)
      const def = uniq.find(it => it.name === getSysConfig()?.country);
      if (def) {
        setForm(prev => ({
          ...prev,
          symbol_currency: def.currency_symbol || prev.symbol_currency,
        }));
        if (def.currency_code && def.currency_code !== 'IDR') {
          fetchExchangeRate(def.currency_code).then(rate => {
            if (rate && !rateTouchedRef.current) {
              setForm(prev => ({...prev, currency: String(Math.ceil(rate))}));
            }
          });
        }
      }
    });
    fetchSysConfig().then(conf => {
      if (conf) {
        setForm(prev => ({
          ...prev,
          country: conf.country || prev.country,
          price_code_unit: conf.price_unit_code || prev.price_code_unit,
        }));
      }
    });
  }, []);

  // Symbol + rate otomatis dari negara yang dipilih (mst_country → currency, API kurs → rate)
  const selectCountry = country => {
    const c = countries.find(it => it.name === country);
    setCountryPickerOpen(false);
    if (!c) {
      setForm(prev => ({...prev, country}));
      return;
    }
    // Negara baru → reset flag, auto-fetch boleh mengisi rate
    rateTouchedRef.current = false;
    setForm(prev => ({
      ...prev,
      country,
      symbol_currency: c.currency_symbol || prev.symbol_currency,
    }));
    if (c.currency_code && c.currency_code !== 'IDR') {
      setRateLoading(true);
      fetchExchangeRate(c.currency_code).then(rate => {
        setRateLoading(false);
        if (rate) {
          setForm(prev => ({...prev, currency: String(Math.ceil(rate))}));
        }
      });
    } else {
      setForm(prev => ({...prev, currency: '1'}));
    }
  };

  const handleStart = async () => {
    const rate = Math.ceil(Number(form.currency));
    if (!(rate > 0)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Rate konversi (currency) harus lebih dari 0',
      });
      return;
    }
    setBusy(true);
    try {
      const ok = await createSession({
        country: form.country,
        symbol_currency: form.symbol_currency,
        currency: rate,
        price_code_unit: form.price_code_unit,
      });
      if (ok) {
        await load();
        fetchSessionList();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async () => {
    if (!activeSession) {
      return;
    }
    setBusy(true);
    try {
      const ok = await closeSession(activeSession.id, {});
      if (ok) {
        await load();
        fetchSessionList();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRate = async () => {
    const rate = Math.ceil(Number(rateDraft));
    if (!(rate > 0)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Rate konversi harus lebih dari 0',
      });
      return;
    }
    setRateSaving(true);
    try {
      const ok = await updateSessionRate(rate);
      if (ok) {
        await load();
      }
    } finally {
      setRateSaving(false);
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

  // Filter negara untuk pencarian di modal
  const filteredCountries = countries.filter(it => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (it.name || '').toLowerCase().includes(q) ||
      (it.currency_code || '').toLowerCase().includes(q) ||
      (it.currency_symbol || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Session Jastip" />
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[color.primaryColor]}
            />
          }>
          {activeSession ? (
            <View style={styles.activeCard}>
              <View style={styles.activeHeader}>
                <View style={styles.activeIcon}>
                  <Icon name="play" size={22} color={color.white} />
                </View>
                <View style={styles.activeNoWrap}>
                  <Text style={styles.activeLabel}>Session Aktif</Text>
                  <Text style={styles.activeNo} numberOfLines={2}>
                    {activeSession.session_no}
                  </Text>
                  <View style={styles.activeStatusRow}>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Berjalan</Text>
                    </View>
                  </View>
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
                  <Text style={styles.activeMetaLabel}>Symbol</Text>
                  <Text style={styles.activeMetaValue}>
                    {activeSession.symbol_currency || '-'}
                  </Text>
                </View>
              </View>
              <View style={styles.activeMetaRow}>
                <View style={styles.activeMetaItem}>
                  <Text style={styles.activeMetaLabel}>Rate (1 = X IDR)</Text>
                  <View style={styles.rateEditRow}>
                    <TextInput
                      style={styles.rateEditInput}
                      value={rateDraft}
                      onChangeText={v =>
                        setRateDraft(v.replace(/[^0-9.]/g, ''))
                      }
                      onEndEditing={() => {
                        const n = Number(rateDraft);
                        if (Number.isFinite(n) && n > 0) {
                          setRateDraft(String(Math.ceil(n)));
                        }
                      }}
                      keyboardType="decimal-pad"
                      placeholder="cth: 530"
                    />
                    <TouchableOpacity
                      style={[
                        styles.rateSaveBtn,
                        rateSaving && styles.btnDisabled,
                      ]}
                      onPress={handleSaveRate}
                      disabled={rateSaving}>
                      {rateSaving ? (
                        <ActivityIndicator size="small" color={color.white} />
                      ) : (
                        <Icon name="check" size={16} color={color.white} />
                      )}
                    </TouchableOpacity>
                  </View>
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
                <Icon
                  name="calendar-plus"
                  size={30}
                  color={color.primaryColor}
                />
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
                onPress={() => {
                  setCountrySearch('');
                  setCountryPickerOpen(true);
                }}>
                <Text style={styles.pickerValue}>{form.country}</Text>
                <Icon name="chevron-down" size={18} color="#999" />
              </TouchableOpacity>

              {/* Symbol mata uang (otomatis dari negara) */}
              <Text style={styles.fieldLabel}>Symbol Mata Uang</Text>
              <View style={styles.currencyBox}>
                <Text style={styles.pickerValue}>{form.symbol_currency}</Text>
                <Icon
                  name="badge-dollar-sign"
                  size={18}
                  color={color.primaryColor}
                />
              </View>
              <Text style={styles.fieldHint}>
                Symbol otomatis dari negara terpilih (mst_currency).
              </Text>

              {/* Rate konversi (otomatis dari API kurs, bisa diedit) */}
              <Text style={styles.fieldLabel}>
                Rate Konversi (1 unit = X IDR)
              </Text>
              <View style={styles.rateBox}>
                <TextInput
                  style={styles.rateInput}
                  value={form.currency}
                  onChangeText={value => {
                    rateTouchedRef.current = true;
                    setForm(prev => ({
                      ...prev,
                      currency: value.replace(/[^0-9.]/g, ''),
                    }));
                  }}
                  onEndEditing={() => {
                    const n = Number(form.currency);
                    if (Number.isFinite(n) && n > 0) {
                      setForm(prev => ({
                        ...prev,
                        currency: String(Math.ceil(n)),
                      }));
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="cth: 530"
                />
                {rateLoading ? (
                  <ActivityIndicator size="small" color={color.primaryColor} />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      const c = countries.find(it => it.name === form.country);
                      if (c && c.currency_code && c.currency_code !== 'IDR') {
                        setRateLoading(true);
                        fetchExchangeRate(c.currency_code).then(rate => {
                          setRateLoading(false);
                          if (rate) {
                            setForm(prev => ({
                              ...prev,
                              currency: String(Math.ceil(rate)),
                            }));
                          }
                        });
                      }
                    }}>
                    <Icon
                      name="refresh-cw"
                      size={18}
                      color={color.primaryColor}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.fieldHint}>
                Otomatis dari API kurs saat negara dipilih; bisa diedit manual.
                Dibulatkan ke atas (tanpa koma).
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
            <View style={styles.searchBox}>
              <Icon name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Cari negara / mata uang..."
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView style={{maxHeight: 400}}>
              {countries.length === 0 && (
                <Text style={styles.modalEmpty}>
                  Tidak ada data negara. Cek endpoint backend (Local Setting).
                </Text>
              )}
              {countries.length > 0 && filteredCountries.length === 0 && (
                <Text style={styles.modalEmpty}>Tidak ditemukan.</Text>
              )}
              {filteredCountries.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.countryItem}
                  onPress={() => selectCountry(item.name)}>
                  <View style={styles.countryItemLeft}>
                    <Text style={styles.countryItemName}>{item.name}</Text>
                    <Text style={styles.countryItemCode}>
                      {item.currency_code}
                    </Text>
                  </View>
                  <Text style={styles.countryItemSymbol}>
                    {item.currency_symbol}
                  </Text>
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
    width: 60,
    height: 60,
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
  activeNoWrap: {
    flex: 1,
    minWidth: 0,
  },
  activeStatusRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  activeNo: {
    color: color.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
    flexShrink: 1,
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
  rateEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rateEditInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: color.white,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
    marginRight: 6,
  },
  rateSaveBtn: {
    backgroundColor: color.primaryColor,
    borderRadius: 8,
    padding: 6,
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
  rateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D9D9E3',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: color.white,
    marginBottom: 4,
  },
  rateInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
    paddingVertical: 12,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 10,
    marginLeft: 8,
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
