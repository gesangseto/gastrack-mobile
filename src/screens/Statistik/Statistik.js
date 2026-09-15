import {useCallback} from 'react';
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
// Picking: -1 Canceled, 0 Waiting, 1 Done, 2 In Courier
const PICKING_STATUS = [
  {code: 0, label: 'Waiting', color: '#F59E0B'},
  {code: 2, label: 'In Courier', color: '#3B82F6'},
  {code: 1, label: 'Done', color: '#10B981'},
  {code: -1, label: 'Canceled', color: '#EF4444'},
];
// Invoice: -1 Canceled, 0 Waiting, 1 Done
const INVOICE_STATUS = [
  {code: 0, label: 'Waiting', color: '#F59E0B'},
  {code: 1, label: 'Done', color: '#10B981'},
  {code: -1, label: 'Canceled', color: '#EF4444'},
];

const formatRupiah = value => {
  const n = Number(value || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
};

const sumBy = (arr, key) =>
  (arr || []).reduce((acc, it) => acc + Number(it[key] || 0), 0);

const Statistik = ({navigation, route}) => {
  // Data dashboard dibagi via Zustand store (sama dengan Home)
  const data = useHomeStore(s => s.dashboard);
  const refreshing = useHomeStore(s => s.refreshing);
  const offline = useHomeStore(s => s.offline);
  const fetchHome = useHomeStore(s => s.fetchHome);

  useFocusEffect(
    useCallback(() => {
      fetchHome(false);
    }, [fetchHome]),
  );

  const onRefresh = () => {
    fetchHome(true);
  };

  // ===== Turunan data =====
  const itemByStatus = data?.item_by_status || [];
  const totalItems = sumBy(itemByStatus, 'total');
  const totalSelling = sumBy(itemByStatus, 'total_selling');
  const totalCost = sumBy(itemByStatus, 'total_cost');
  const totalProfit = totalSelling - totalCost;

  const totalBatch = sumBy(data?.batch_by_status || [], 'total');
  const totalPicking = sumBy(data?.picking_by_status || [], 'total');
  const totalInvoice = sumBy(data?.invoice_by_status || [], 'total');
  const totalCustomer = data?.total_customer || 0;

  const sold = data?.total_sales || {};
  const soldProfit = Number(sold.total_profit || 0);

  const itemCount = code => {
    const row = itemByStatus.find(it => Number(it.status) === code);
    return row ? Number(row.total || 0) : 0;
  };

  const invoiceAmount = code => {
    const row = (data?.invoice_by_status || []).find(
      it => Number(it.status) === code,
    );
    return row ? Number(row.total_selling || 0) : 0;
  };

  const pickingCount = code => {
    const row = (data?.picking_by_status || []).find(
      it => Number(it.status) === code,
    );
    return row ? Number(row.total || 0) : 0;
  };

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
        {/* Hero: Total Penjualan */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Icon name="wallet" size={22} color={color.white} />
            </View>
            <Text style={styles.heroLabel}>Total Penjualan</Text>
          </View>
          <Text style={styles.heroValue}>{formatRupiah(totalSelling)}</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroStats}>
            <View style={{flex: 1}}>
              <Text style={styles.heroStatLabel}>Modal</Text>
              <Text style={styles.heroStatValue}>
                {formatRupiah(totalCost)}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.heroStatLabel}>Profit</Text>
              <Text style={[styles.heroStatValue, {color: '#4ADE80'}]}>
                {formatRupiah(totalProfit)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mini stat cards */}
        <View style={styles.miniRow}>
          <View style={[styles.miniCard, {backgroundColor: '#F6F4FB'}]}>
            <Icon name="package" size={20} color={color.primaryColor} />
            <Text style={styles.miniValue}>{totalItems}</Text>
            <Text style={styles.miniLabel}>Item</Text>
          </View>
          <View style={[styles.miniCard, {backgroundColor: '#E0F2FE'}]}>
            <Icon name="users" size={20} color="#0EA5E9" />
            <Text style={styles.miniValue}>{totalCustomer}</Text>
            <Text style={styles.miniLabel}>Customer</Text>
          </View>
          <View style={[styles.miniCard, {backgroundColor: '#D1FAE5'}]}>
            <Icon name="layers" size={20} color="#10B981" />
            <Text style={styles.miniValue}>{totalBatch}</Text>
            <Text style={styles.miniLabel}>Batch</Text>
          </View>
        </View>

        {/* Status Item */}
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
                      height: 12,
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

        {/* Invoice */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Invoice</Text>
            <Text style={styles.cardTotal}>{totalInvoice} tagihan</Text>
          </View>
          <View style={styles.chipRow}>
            {INVOICE_STATUS.map(s => {
              const count = (data?.invoice_by_status || []).find(
                it => Number(it.status) === s.code,
              )?.total;
              if (!count) {return null;}
              return (
                <View
                  key={s.code}
                  style={[styles.chip, {backgroundColor: s.color + '1A'}]}>
                  <View
                    style={[styles.chipDot, {backgroundColor: s.color}]}
                  />
                  <Text style={[styles.chipLabel, {color: s.color}]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.chipValue, {color: s.color}]}>
                    {formatRupiah(invoiceAmount(s.code))}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Picking */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Picking</Text>
            <Text style={styles.cardTotal}>{totalPicking} pengiriman</Text>
          </View>
          <View style={styles.chipRow}>
            {PICKING_STATUS.map(s => {
              const count = pickingCount(s.code);
              if (!count) {return null;}
              return (
                <View
                  key={s.code}
                  style={[styles.chip, {backgroundColor: s.color + '1A'}]}>
                  <View
                    style={[styles.chipDot, {backgroundColor: s.color}]}
                  />
                  <Text style={[styles.chipLabel, {color: s.color}]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.chipValue, {color: s.color}]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Sold summary */}
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
                {formatRupiah(sold.total_selling)}
              </Text>
            </View>
            <View style={styles.soldBox}>
              <Text style={styles.soldLabel}>Profit</Text>
              <Text style={[styles.soldValue, {color: '#10B981'}]}>
                {formatRupiah(soldProfit)}
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
  heroCard: {
    backgroundColor: color.primaryColor,
    borderRadius: 22,
    padding: 20,
    marginTop: -30,
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
    width: 40,
    height: 40,
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
    fontSize: 30,
    fontWeight: '800',
    color: color.white,
    marginTop: 12,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 14,
  },
  heroStats: {
    flexDirection: 'row',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#B1A3D2',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: color.white,
    marginTop: 2,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  miniCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  miniValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginTop: 6,
  },
  miniLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 16,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  cardTotal: {
    fontSize: 12,
    color: '#999',
  },
  progressTrack: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
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
    fontSize: 12,
    color: '#666',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  soldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  soldBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
  },
  soldLabel: {
    fontSize: 12,
    color: '#888',
  },
  soldValue: {
    fontSize: 16,
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
