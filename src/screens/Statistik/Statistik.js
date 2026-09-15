import {useCallback, useEffect, useState} from 'react';
import {
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
import {fetchSessionStats} from '../../resource/Dashboard';
import {getSessionList} from '../../resource/Session';
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
  const n = Number(v || 0);
  return n.toLocaleString('id-ID');
};

const sumBy = (arr, key) =>
  (arr || []).reduce((acc, it) => acc + Number(it[key] || 0), 0);

const Statistik = ({navigation, route}) => {
  // Data dashboard dibagi via Zustand store (sama dengan Home)
  const data = useHomeStore(s => s.dashboard);
  const refreshing = useHomeStore(s => s.refreshing);
  const offline = useHomeStore(s => s.offline);
  const fetchHome = useHomeStore(s => s.fetchHome);

  // Session dropdown
  const [sessionList, setSessionList] = useState([]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionValue, setSessionValue] = useState(null); // null = semua
  // Statistik per session (grafik)
  const [sessionStats, setSessionStats] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHome(false);
      loadSessions();
    }, [fetchHome]),
  );

  const loadSessions = async () => {
    const list = await getSessionList({}, false);
    if (list) {
      setSessionList(list);
      // Default: session aktif
      const active = list.find(s => s.status === 'Active');
      setSessionValue(active ? active.id : null);
    }
  };

  // Muat statistik per session (grafik 6 terakhir)
  const loadSessionStats = async () => {
    setChartLoading(true);
    const stats = await fetchSessionStats({limit: 6}, false);
    setSessionStats(stats || []);
    setChartLoading(false);
  };

  useEffect(() => {
    loadSessionStats();
  }, []);

  const onRefresh = () => {
    fetchHome(true);
    loadSessions();
    loadSessionStats();
  };

  // ===== Turunan data =====
  const itemByStatus = data?.item_by_status || [];
  const totalItems = sumBy(itemByStatus, 'total');
  const totalSelling = sumBy(itemByStatus, 'total_selling');
  const totalCost = sumBy(itemByStatus, 'total_cost');
  const totalProfit = totalSelling - totalCost;

  const totalBatch = sumBy(data?.batch_by_status || [], 'total');
  const totalCustomer = data?.total_customer || 0;

  const sold = data?.total_sales || {};
  const soldProfit = Number(sold.total_profit || 0);

  const itemCount = code => {
    const row = itemByStatus.find(it => Number(it.status) === code);
    return row ? Number(row.total || 0) : 0;
  };

  // Session terpilih → statistik detail
  const selectedSession = sessionValue
    ? sessionList.find(s => s.id === sessionValue)
    : null;

  // ===== Grafik: pengeluaran & keuntungan per session =====
  const chartData = sessionStats.slice(0, 6).reverse(); // urut lama → baru
  const maxVal = Math.max(
    1,
    ...chartData.map(d => Math.max(Number(d.total_cost || 0), Number(d.total_profit || 0))),
  );
  const barHeight = v => (maxVal > 0 ? (Number(v || 0) / maxVal) * 100 : 0);

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />

      {/* Header */}
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

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[color.primaryColor]}
          />
        }>
        {/* Dropdown pilih session */}
        <View style={styles.dropdownWrap}>
          <DropDownPicker
            open={sessionOpen}
            value={sessionValue}
            items={[
              {label: 'Semua Session', value: null},
              ...sessionList.map(s => ({
                label: `${s.session_no} • ${s.country || '-'} (${s.status})`,
                value: s.id,
              })),
            ]}
            setOpen={setSessionOpen}
            setValue={setSessionValue}
            setItems={setSessionList}
            placeholder="Pilih session jastip"
            style={styles.picker}
            dropDownContainerStyle={styles.pickerDropdown}
            listMode="MODAL"
            modalProps={{animationType: 'slide'}}
            modalTitle="Pilih Session Jastip"
            modalContentContainerStyle={styles.pickerModal}
            textStyle={{fontSize: 13}}
            labelStyle={{fontWeight: '600', color: '#333'}}
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
                : 'Total Penjualan'}
            </Text>
          </View>
          <Text style={styles.heroValue}>
            Rp {fmt(selectedSession ? selectedSession.total_selling : totalSelling)}
          </Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroStats}>
            <View style={{flex: 1}}>
              <Text style={styles.heroStatLabel}>Modal</Text>
              <Text style={styles.heroStatValue}>
                Rp {fmt(selectedSession ? selectedSession.total_cost : totalCost)}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.heroStatLabel}>Profit</Text>
              <Text style={[styles.heroStatValue, {color: '#4ADE80'}]}>
                Rp{' '}
                {fmt(
                  selectedSession
                    ? selectedSession.total_profit
                    : totalProfit,
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Mini stat cards */}
        <View style={styles.miniRow}>
          <View style={[styles.miniCard, {backgroundColor: '#F6F4FB'}]}>
            <Icon name="package" size={18} color={color.primaryColor} />
            <Text style={styles.miniValue}>
              {selectedSession ? selectedSession.total_items : totalItems}
            </Text>
            <Text style={styles.miniLabel}>Item</Text>
          </View>
          <View style={[styles.miniCard, {backgroundColor: '#E0F2FE'}]}>
            <Icon name="users" size={18} color="#0EA5E9" />
            <Text style={styles.miniValue}>{totalCustomer}</Text>
            <Text style={styles.miniLabel}>Customer</Text>
          </View>
          <View style={[styles.miniCard, {backgroundColor: '#D1FAE5'}]}>
            <Icon name="layers" size={18} color="#10B981" />
            <Text style={styles.miniValue}>
              {selectedSession ? selectedSession.total_shipment : totalBatch}
            </Text>
            <Text style={styles.miniLabel}>
              {selectedSession ? 'Shipment' : 'Batch'}
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
                            {height: `${Math.max(barHeight(d.total_cost), 2)}%`},
                          ]}
                        />
                      </View>
                      <View style={styles.chartBarWrap}>
                        <View
                          style={[
                            styles.chartBar,
                            styles.chartBarProfit,
                            {height: `${Math.max(barHeight(d.total_profit), 2)}%`},
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
                  <View style={[styles.legendDot, {backgroundColor: '#F59E0B'}]} />
                  <Text style={styles.legendText}>Pengeluaran (Modal)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, {backgroundColor: '#10B981'}]} />
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
                if (!count) {return null;}
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
              if (!count) {return null;}
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
            <Text style={styles.cardTotal}>
              {itemCount(205)} item sold
            </Text>
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
      </ScrollView>
    </View>
  );
};

export default Statistik;

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? 140 : 110,
    backgroundColor: color.primaryColor,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
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
  dropdownWrap: {
    marginTop: -30,
    marginBottom: 14,
    zIndex: 1000,
  },
  picker: {
    borderRadius: 14,
    borderColor: '#E0E0E8',
    backgroundColor: color.white,
    minHeight: 46,
  },
  pickerDropdown: {
    borderRadius: 14,
    borderColor: '#E0E0E8',
  },
  pickerModal: {
    backgroundColor: color.white,
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
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
