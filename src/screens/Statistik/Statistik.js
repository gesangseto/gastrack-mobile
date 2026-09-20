import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import color from '../../constant/color';
import Icon from '@react-native-vector-icons/lucide';
import {useHomeStore} from '../../store/homeStore';
import {useSessionStore} from '../../store/sessionStore';
import {fetchSessionStats} from '../../resource/Dashboard';
import DropDownPicker from 'react-native-dropdown-picker';

// ===== Mapping status =====
// Item stock: 200 Draft, 201 Manifesting, 202 In-Transit, 203 GRN,
//             204 Dispatch, 205 Sold, 206 Disposed
const ITEM_STATUS = [
  {code: 200, label: 'Draft', color: '#9CA3AF'},
  {code: 201, label: 'Manifest', color: '#3B82F6'},
  {code: 202, label: 'In Transit', color: '#0EA5E9'},
  {code: 203, label: 'GRN', color: '#F59E0B'},
  {code: 204, label: 'Dispatch', color: '#F97316'},
  {code: 205, label: 'Sold', color: '#10B981'},
  {code: 206, label: 'Disposed', color: '#EF4444'},
];

const fmt = v => {
  const n = Math.round(Number(v || 0));
  return n.toLocaleString('id-ID');
};

const sumBy = (arr, key) =>
  (arr || []).reduce((acc, it) => acc + Number(it[key] || 0), 0);

// Icon close untuk modal dropdown (minimalis, konsisten dgn ikon lucide)
const CloseIcon = ({style}) => (
  <Icon name="x" size={20} color="#9CA3AF" style={style} />
);

const Statistik = ({navigation, route, inline = false, header = null}) => {
  // Data dashboard dibagi via Zustand store (sama dengan Home)
  const data = useHomeStore(s => s.dashboard);
  const refreshing = useHomeStore(s => s.refreshing);
  const offline = useHomeStore(s => s.offline);
  const fetchHome = useHomeStore(s => s.fetchHome);

  // Session dropdown — daftar session dari store (cache MMKV). Tidak
  // di-fetch ulang saat kembali ke layar; refresh hanya via pull-to-refresh.
  const sessionList = useSessionStore(s => s.sessionList);
  const fetchSessionList = useSessionStore(s => s.fetchSessionList);
  const initSessionListFromCache = useSessionStore(
    s => s.initSessionListFromCache,
  );
  const setSessionList = useSessionStore(s => s.setSessionList);
  // Session terpilih disimpan di store (persist MMKV) beserta datanya —
  // sumber tunggal filter. Saat kembali ke Home, pilihan tetap tampil
  // tanpa perlu muat ulang.
  const selectedSession = useSessionStore(s => s.selectedSession);
  const selectSession = useSessionStore(s => s.selectSession);
  // Value dropdown = id session terpilih (jika masih ada di daftar).
  const sessionValue =
    selectedSession && sessionList.some(s => s.id === selectedSession.id)
      ? selectedSession.id
      : null;
  const [sessionOpen, setSessionOpen] = useState(false);
  // Statistik per session (grafik)
  const [sessionStats, setSessionStats] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  // Detail statistik session terpilih (hero + mini card)
  const [sessionDetail, setSessionDetail] = useState(null);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);

  // Cegah setState setelah screen unmount (stale response saat ganti screen cepat)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHome(false);
      // Muat daftar session dari cache MMKV (tanpa network). Fetch hanya
      // saat belum ada cache (pertama kali) atau via pull-to-refresh.
      initSessionListFromCache();
    }, [fetchHome, initSessionListFromCache]),
  );

  // Default pilihan = session aktif (hanya saat belum ada pilihan tersimpan).
  // Disimpan ke store agar bertahan saat pindah menu / restart app.
  useEffect(() => {
    if (!selectedSession && sessionList.length > 0) {
      const active = sessionList.find(s => s.status === 'Active');
      if (active) selectSession(active);
    }
  }, [sessionList, selectedSession, selectSession]);

  // Muat statistik per session (grafik 6 terakhir)
  const loadSessionStats = async () => {
    setChartLoading(true);
    const stats = await fetchSessionStats({limit: 6}, false);
    if (!mountedRef.current) {
      return;
    }
    setSessionStats(stats || []);
    setChartLoading(false);
  };

  useEffect(() => {
    loadSessionStats();
  }, []);

  // Penanda request session terbaru — mencegah stale response: response
  // fetch session lama diabaikan jika session sudah berubah (termasuk
  // menjadi null / "Semua Session").
  const sessionRequestRef = useRef(0);

  // Saat session dipilih di dropdown → ambil detail statistik session tsb
  // (total_items, total_selling, total_cost, total_profit, total_batch,
  //  total_paid, total_unpaid) agar card per-session ikut ter-update.
  // null = Semua Session → pakai total global, TANPA fetch data session.
  useEffect(() => {
    const requestId = ++sessionRequestRef.current;
    if (!sessionValue) {
      setSessionDetail(null);
      setSessionDetailLoading(false);
      return;
    }
    setSessionDetailLoading(true);
    fetchSessionStats({session_id: sessionValue}, false).then(stats => {
      if (!mountedRef.current) {
        return;
      }
      // Ada request lebih baru (session berubah / jadi null) → abaikan
      if (sessionRequestRef.current !== requestId) {
        return;
      }
      setSessionDetail(stats && stats[0] ? stats[0] : null);
      setSessionDetailLoading(false);
    });
  }, [sessionValue]);

  const onRefresh = () => {
    fetchHome(true);
    fetchSessionList(true);
    loadSessionStats();
  };

  // Pilih session di dropdown → simpan lengkap ke store (persist MMKV)
  // beserta informasinya (session_no, country, status, dll).
  // Catatan: react-native-dropdown-picker memanggil setValue dengan FUNGSI
  // (state => newValue) — evaluasi dulu sebelum dipakai.
  const handleSelectSession = value => {
    const id = typeof value === 'function' ? value(sessionValue) : value;
    const session = sessionList.find(s => s.id === id) || null;
    selectSession(session);
  };

  // ===== Turunan data =====
  const itemByStatus = data?.item_by_status || [];
  const totalItems = sumBy(itemByStatus, 'total');

  const sold = data?.total_sales || {};
  const soldProfit = Number(sold.total_profit || 0);

  // Ringkasan pembayaran customer (dari dashboard backend) — dipakai card
  // "Pembayaran Customer" di section Total Keseluruhan (agregat semua session).
  const paymentSummary = data?.payment_summary || {};

  // Nilai hero & mini card: HANYA dari data session terpilih. Tanpa session
  // terpilih → 0. Tidak pernah fallback ke angka global (seluruh session).
  const heroVal = sessionKey =>
    sessionData ? Number(sessionData[sessionKey] || 0) : 0;

  const itemCount = code => {
    const row = itemByStatus.find(it => Number(it.status) === code);
    return row ? Number(row.total || 0) : 0;
  };

  // Session terpilih → info header (session_no, country, status).
  // Data diambil langsung dari store (persist MMKV), bukan dari sessionList,
  // agar tetap tampil walau daftar session belum dimuat ulang.
  // Detail statistik session terpilih (dari /session-stats?session_id=...)
  // Berisi total_items, total_selling, total_cost, total_profit, total_batch.
  const sessionData = sessionDetail || null;

  // ===== Grafik: pengeluaran & keuntungan per session =====
  const chartData = sessionStats.slice(0, 6).reverse(); // urut lama → baru
  const maxVal = Math.max(
    1,
    ...chartData.map(d =>
      Math.max(Number(d.total_cost || 0), Number(d.total_profit || 0)),
    ),
  );
  const barHeight = v => (maxVal > 0 ? (Number(v || 0) / maxVal) * 100 : 0);

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      {!inline && (
        <StatusBar
          barStyle={'light-content'}
          backgroundColor={color.primaryColor}
        />
      )}

      {/* Header layar penuh — saat inline (di dalam Home) header disuplai Home */}
      {!inline && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Statistik</Text>
            <Text style={styles.headerSub}>
              {offline
                ? 'Offline — menampilkan data terakhir'
                : 'Ringkasan Jasa Titip Belanja'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Icon name="refresh-cw" size={20} color={color.primaryColor} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={[styles.body, inline && styles.bodyInline]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[color.primaryColor]}
          />
        }>
        {header}
        {inline && (
          <View style={styles.inlineHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.inlineTitle}>Dashboard Statistik</Text>
              <Text style={styles.inlineSub}>
                {offline
                  ? 'Offline — menampilkan data terakhir'
                  : 'Ringkasan Jasa Titip Belanja'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtnLight}
              onPress={onRefresh}>
              <Icon name="refresh-cw" size={18} color={color.primaryColor} />
            </TouchableOpacity>
          </View>
        )}

        {/* ===== Section: Per Session Jastip ===== */}
        <View style={styles.sessionSection}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {backgroundColor: color.primaryColor},
              ]}>
              <Icon name="calendar-range" size={18} color={color.white} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sectionTitle}>Per Session Jastip</Text>
              <Text style={styles.sectionSub}>
                Ringkasan berdasarkan session terpilih
              </Text>
            </View>
          </View>

          {/* Dropdown pilih session */}
          <View style={styles.dropdownWrap}>
            <DropDownPicker
              open={sessionOpen}
              value={sessionValue}
              items={[
                ...sessionList.map(s => ({
                  label: `${s.session_no} • ${s.country || '-'} (${s.status})`,
                  value: s.id,
                })),
              ]}
              setOpen={setSessionOpen}
              setValue={handleSelectSession}
              setItems={setSessionList}
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
              customArrowIcon={() => (
                <Icon name="chevron-down" size={18} color="#9CA3AF" />
              )}
              customTickIcon={() => (
                <Icon name="check" size={16} color={color.primaryColor} />
              )}
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

          {/* Hero: Total Penjualan (compact) */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Icon name="wallet" size={20} color={color.white} />
              </View>
              <Text style={styles.heroLabel}>
                {selectedSession
                  ? `Session ${selectedSession.session_no}`
                  : 'Pilih session'}
              </Text>
              {sessionDetailLoading && (
                <ActivityIndicator size="small" color="#B1A3D2" />
              )}
            </View>
            <Text style={styles.heroValue}>
              Rp {fmt(heroVal('total_selling'))}
            </Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroStats}>
              <View style={{flex: 1}}>
                <Text style={styles.heroStatLabel}>Modal</Text>
                <Text style={styles.heroStatValue}>
                  Rp {fmt(heroVal('total_cost'))}
                </Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.heroStatLabel}>Profit</Text>
                <Text style={[styles.heroStatValue, {color: '#4ADE80'}]}>
                  Rp {fmt(heroVal('total_profit'))}
                </Text>
              </View>
            </View>

            <View style={styles.heroStats}>
              <View style={{flex: 1}}>
                <Text style={styles.heroStatLabel}>Total Belum Dibayar</Text>
                <Text style={[styles.heroStatValue, {color: '#de604a'}]}>
                  Rp {fmt(heroVal('total_unpaid'))}
                </Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.heroStatLabel}>Total Dibayarkan</Text>
                <Text style={[styles.heroStatValue, {color: '#4ADE80'}]}>
                  Rp {fmt(heroVal('total_paid'))}
                </Text>
              </View>
            </View>
          </View>

          {/* Mini stat cards */}
          <View style={styles.miniRow}>
            <View style={[styles.miniCard, {backgroundColor: '#F6F4FB'}]}>
              <Icon name="package" size={18} color={color.primaryColor} />
              <Text style={styles.miniValue}>
                {heroVal('total_items')}
              </Text>
              <Text style={styles.miniLabel}>Item</Text>
            </View>
            <View style={[styles.miniCard, {backgroundColor: '#E0F2FE'}]}>
              <Icon name="users" size={18} color="#0EA5E9" />
              <Text style={styles.miniValue}>{heroVal('total_customer')}</Text>
              <Text style={styles.miniLabel}>Customer</Text>
            </View>
            <View style={[styles.miniCard, {backgroundColor: '#D1FAE5'}]}>
              <Icon name="layers" size={18} color="#10B981" />
              <Text style={styles.miniValue}>
                {heroVal('total_batch')}
              </Text>
              <Text style={styles.miniLabel}>Batch</Text>
            </View>
          </View>

          {/* Pembayaran Session: total dibayarkan & belum dibayar */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pembayaran Session</Text>
            </View>
          </View>
        </View>

        {/* ===== Section: Total Keseluruhan ===== */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, {backgroundColor: '#E8EDF3'}]}>
              <Icon name="chart-column" size={18} color="#64748B" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sectionTitle}>Total Keseluruhan</Text>
              <Text style={styles.sectionSub}>
                Akumulasi semua session jastip
              </Text>
            </View>
          </View>

          {/* Grafik: Pengeluaran & Keuntungan per Session */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pengeluaran & Keuntungan</Text>
              <Text style={styles.cardTotal}>6 session terakhir</Text>
            </View>
            {chartLoading ? (
              <Text style={styles.emptyText}>Memuat grafik...</Text>
            ) : chartData.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada data session</Text>
            ) : (
              <View>
                <View style={styles.chartRow}>
                  {chartData.map(d => (
                    <View key={d.session_id} style={styles.chartCol}>
                      <View style={styles.chartBars}>
                        <View style={styles.chartBarWrap}>
                          <View
                            style={[
                              styles.chartBar,
                              styles.chartBarCost,
                              {
                                height: `${Math.max(
                                  barHeight(d.total_cost),
                                  2,
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.chartBarWrap}>
                          <View
                            style={[
                              styles.chartBar,
                              styles.chartBarProfit,
                              {
                                height: `${Math.max(
                                  barHeight(d.total_profit),
                                  2,
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.chartLabel} numberOfLines={1}>
                        {d.session_no}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, {backgroundColor: '#F59E0B'}]}
                    />
                    <Text style={styles.legendText}>Pengeluaran (Modal)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, {backgroundColor: '#10B981'}]}
                    />
                    <Text style={styles.legendText}>Keuntungan</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Status Item (compact) */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Status Item</Text>
              <Text style={styles.cardTotal}>{totalItems} item</Text>
            </View>
            {totalItems > 0 ? (
              <View style={styles.progressTrack}>
                {ITEM_STATUS.map(s => {
                  const count = itemCount(s.code);
                  if (!count) {
                    return null;
                  }
                  return (
                    <View
                      key={s.code}
                      style={{
                        flex: count,
                        backgroundColor: s.color,
                        height: 10,
                      }}
                    />
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Belum ada item</Text>
            )}
            <View style={styles.legendWrap}>
              {ITEM_STATUS.map(s => {
                const count = itemCount(s.code);
                if (!count) {
                  return null;
                }
                return (
                  <View key={s.code} style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, {backgroundColor: s.color}]}
                    />
                    <Text style={styles.legendText}>
                      {s.label} · {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Item Terjual */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Item Terjual</Text>
              <Text style={styles.cardTotal}>{itemCount(205)} item sold</Text>
            </View>
            <View style={styles.soldRow}>
              <View style={styles.soldBox}>
                <Text style={styles.soldLabel}>Pendapatan</Text>
                <Text style={styles.soldValue}>
                  Rp {fmt(sold.total_selling)}
                </Text>
              </View>
              <View style={styles.soldBox}>
                <Text style={styles.soldLabel}>Profit</Text>
                <Text style={[styles.soldValue, {color: '#10B981'}]}>
                  Rp {fmt(soldProfit)}
                </Text>
              </View>
            </View>
          </View>

          {/* Pembayaran Customer */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pembayaran Customer</Text>
              <Text style={styles.cardTotal}>
                {paymentSummary.payment_count || 0} payment
              </Text>
            </View>
            <View style={styles.payRow}>
              <View style={styles.payBox}>
                <Text style={styles.payLabel}>Total Pengeluaran</Text>
                <Text style={styles.payValue}>
                  Rp {fmt(paymentSummary.total_cost)}
                </Text>
              </View>
              <View style={styles.payBox}>
                <Text style={styles.payLabel}>Pendapatan</Text>
                <Text style={[styles.payValue, {color: '#10B981'}]}>
                  Rp {fmt(paymentSummary.total_selling)}
                </Text>
              </View>
            </View>
            <View style={styles.payRow}>
              <View style={styles.payBox}>
                <Text style={styles.payLabel}>Total Dibayarkan</Text>
                <Text style={[styles.payValue, {color: color.primaryColor}]}>
                  Rp {fmt(paymentSummary.total_paid)}
                </Text>
              </View>
              <View style={styles.payBox}>
                <Text style={styles.payLabel}>Total Belum Dibayar</Text>
                <Text style={[styles.payValue, {color: '#EF4444'}]}>
                  Rp {fmt(paymentSummary.total_unpaid)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Statistik;

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? 110 : 90,
    backgroundColor: color.primaryColor,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 30 : 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: color.white,
  },
  headerSub: {
    fontSize: 13,
    color: '#B1A3D2',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    paddingBottom: 100,
  },
  bodyInline: {
    paddingTop: 4,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  inlineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  inlineSub: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 2,
  },
  refreshBtnLight: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* ---- Section header (pembeda) ---- */
  section: {
    marginTop: 18,
  },
  sessionSection: {
    marginTop: 16,
    backgroundColor: '#FBFAFE',
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 20,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  sectionSub: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 1,
  },
  dropdownWrap: {
    marginBottom: 14,
    zIndex: 1000,
  },
  picker: {
    borderRadius: 12,
    borderColor: '#E5E7EB',
    backgroundColor: color.white,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  pickerDropdown: {
    borderRadius: 12,
    borderColor: '#E5E7EB',
    backgroundColor: color.white,
  },
  pickerModal: {
    flexGrow: 1,
    backgroundColor: color.white,
    paddingBottom: 24,
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  pickerSearchInput: {
    flexGrow: 1,
    flexShrink: 1,
    margin: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: '#F3F4F6',
    color: '#1F1F1F',
    fontSize: 14,
  },
  pickerCloseIcon: {
    width: 20,
    height: 20,
    tintColor: '#9CA3AF',
  },
  pickerCloseIconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  pickerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  pickerListItemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  pickerSelectedItem: {
    backgroundColor: '#F6F4FB',
  },
  pickerSelectedLabel: {
    color: color.primaryColor,
    fontWeight: '600',
  },
  pickerItemSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 16,
  },
  pickerEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  pickerText: {
    fontSize: 13,
    color: '#1F1F1F',
    fontWeight: '500',
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  pickerArrow: {
    tintColor: '#9CA3AF',
  },
  pickerTick: {
    tintColor: color.primaryColor,
  },
  heroCard: {
    backgroundColor: color.primaryColor,
    borderRadius: 22,
    padding: 18,
    shadowColor: color.primaryColor,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B1A3D2',
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '800',
    color: color.white,
    marginTop: 10,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 12,
  },
  heroStats: {
    flexDirection: 'row',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#B1A3D2',
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: color.white,
    marginTop: 2,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  miniCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  miniValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginTop: 5,
  },
  miniLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 14,
    marginTop: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  cardTotal: {
    fontSize: 11,
    color: '#999',
  },
  /* ---- Chart ---- */
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 110,
  },
  chartBarWrap: {
    width: 12,
    height: 110,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 12,
    borderRadius: 4,
  },
  chartBarCost: {
    backgroundColor: '#F59E0B',
  },
  chartBarProfit: {
    backgroundColor: '#10B981',
  },
  chartLabel: {
    fontSize: 9,
    color: '#999',
    marginTop: 6,
    maxWidth: 44,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  progressTrack: {
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  soldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  soldBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  soldLabel: {
    fontSize: 11,
    color: '#888',
  },
  soldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
    marginTop: 4,
  },
  payRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  payBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  payLabel: {
    fontSize: 11,
    color: '#888',
  },
  payValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
