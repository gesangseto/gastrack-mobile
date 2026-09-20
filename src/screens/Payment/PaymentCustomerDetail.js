import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getPaymentItems, getPaymentSummary} from '../../resource/Payment';

// Detail tagihan customer — dibuka dari tab Pending/Paid di menu Payment.
// Menampilkan ringkasan tagihan + daftar item yang dipesan customer pada
// session terpilih, dengan tombol "Bayar" → PaymentCreate (customer terpilih).
const formatRupiah = value => {
  const n = Number(value || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
};

const STATUS_COLOR = {
  UNPAID: color.danger,
  PARTIAL: color.warning,
  PAID: color.success,
};

// Warna badge status item (mengikuti mst_epc_status)
const ITEM_STATUS_COLOR = {
  '200': color.success, // GRN
  '201': color.warning, // In Transit
  '202': color.warning, // Arrived
  '203': color.success, // GRN
  '204': color.danger, // Disposal
  '205': color.danger, // Lost
  '206': color.danger, // Damaged
};

const PaymentCustomerDetail = ({route}) => {
  const {customer_id, session_id} = route.params || {};
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    const [s, it] = await Promise.all([
      getPaymentSummary(customer_id, session_id, false),
      getPaymentItems(customer_id, session_id, false),
    ]);
    if (!mountedRef.current) {
      return;
    }
    if (s) {
      setSummary(s);
    }
    if (it) {
      setItems(it);
    }
    setLoading(false);
  };

  // Muat ulang setiap kali layar aktif (data berubah setelah PaymentCreate)
  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer_id, session_id]),
  );

  const status = summary?.payment_status || 'UNPAID';

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Detail Tagihan" />
      <View style={styles.container}>
        {loading && !summary ? (
          <ActivityIndicator
            size="small"
            color={color.primaryColor}
            style={styles.loading}
          />
        ) : (
          <>
            {/* Identitas customer */}
            <View style={styles.customerBox}>
              <View style={styles.customerIcon}>
                <Icon name="user" size={22} color={color.primaryColor} />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {summary?.customer_name || `Customer #${customer_id}`}
                </Text>
                <Text style={styles.customerPhone}>
                  {summary?.customer_phone || '—'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: STATUS_COLOR[status] || '#C4C4C4'},
                ]}>
                <Text style={styles.statusBadgeText}>{status}</Text>
              </View>
            </View>

            {/* Ringkasan tagihan */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Tagihan</Text>
                <Text style={styles.summaryValue}>
                  {formatRupiah(summary?.grand_total)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sudah Dibayar</Text>
                <Text style={styles.summaryPaid}>
                  {formatRupiah(summary?.total_paid)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sisa Tagihan</Text>
                <Text style={styles.summaryRemaining}>
                  {formatRupiah(summary?.remaining_amount)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <Text style={styles.summaryItems}>
                {summary?.total_items || 0} item •{' '}
                {summary?.total_quantity || 0} pcs
              </Text>
            </View>

            {/* Daftar item yang dipesan — header fix, list scrollable */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Item Dipesan</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {items.length} item
                </Text>
              </View>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.itemList}>
              {items.length === 0 ? (
                <Text style={styles.emptyText}>
                  Tidak ada item pada session ini
                </Text>
              ) : (
                items.map(item => {
                  const total =
                    Number(item.quantity || 0) * Number(item.selling_price || 0);
                  const itemColor =
                    ITEM_STATUS_COLOR[String(item.status)] || '#C4C4C4';
                  return (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemIcon}>
                        <Icon
                          name="package"
                          size={18}
                          color={color.primaryColor}
                        />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.product_name || `Item #${item.id}`}
                        </Text>
                        <Text style={styles.itemSub}>
                          {item.quantity} pcs ×{' '}
                          {formatRupiah(item.selling_price)}
                        </Text>
                        <Text style={styles.itemTotal}>
                          {formatRupiah(total)}
                        </Text>
                      </View>
                      <View
                        style={[styles.itemBadge, {backgroundColor: itemColor}]}>
                        <Text style={styles.itemBadgeText}>
                          {item.status_name || item.status}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </>
        )}
      </View>

      {/* Tombol "Bayar Tagihan" — fixed di bagian bawah layar */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() =>
            RootNavigation.navigate('PaymentCreate', {
              customer_id,
              session_id,
            })
          }
          style={styles.payButton}>
          <Icon name="wallet" size={18} color={color.white} />
          <Text style={styles.payButtonText}>Bayar Tagihan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaymentCustomerDetail;

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
  loading: {
    marginTop: 40,
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  customerPhone: {
    fontSize: 13,
    color: '#9A9A9A',
    marginTop: 2,
  },
  customerInfo: {
    flex: 1,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: color.white,
  },
  summaryBox: {
    backgroundColor: color.primaryLight,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  summaryDivider: {
    height: 1,
    backgroundColor: color.primaryLighter,
    marginVertical: 10,
  },
  summaryItems: {
    fontSize: 11,
    color: '#9A9A9A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  countBadge: {
    backgroundColor: color.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: color.primaryColor,
  },
  itemList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    color: '#9A9A9A',
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 12,
    marginBottom: 10,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  itemSub: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
    marginTop: 2,
  },
  itemBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  itemBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: color.white,
  },
  payButton: {
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  payButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: color.white,
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
});
