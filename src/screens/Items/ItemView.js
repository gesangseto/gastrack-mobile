import Icon from '@react-native-vector-icons/lucide';
import moment from 'moment';
import {useState} from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {PRICE_UNIT_LIST} from '../../constant/priceUnit';
import {cancelItem, getListItem} from '../../resource/Item';
import ImageThumbnail from '../../components/ImageThumbnail';
import ImageViewer from '../../components/ImageViewer';

/**
 * Format angka ke format rupiah compact (tanpa prefix Rp).
 * Contoh: 125000 → "125.000"
 */
const fmt = v => {
  const n = Math.round(Number(v || 0));
  return n.toLocaleString('id-ID');
};

/**
 * Hitung profit IDR dari data item:
 * cost_idr = cost_currency==='IDR' ? cost_price : cost_price * exchange_rate
 * profit   = selling_price - cost_idr
 */
const calcProfit = item => {
  const sp = Number(item?.selling_price || 0);
  const cp = Number(item?.cost_price || 0);
  const rate = Number(item?.exchange_rate || 1);
  const costIdr = (item?.cost_currency || 'IDR') === 'IDR' ? cp : cp * rate;
  return sp - costIdr;
};

/**
 * Suffix pengali kode harga, mis. selling_unit 'thousands' → " (000)".
 */
const codeUnitSuffix = unit =>
  unit && unit !== 'none'
    ? ` (${PRICE_UNIT_LIST.find(u => u.value === unit)?.multiplier || ''})`
    : '';

const ItemView = ({navigation, route}) => {
  let item = route.params?.item || {};
  const [visibleImageViewer, setVisibleImageViewer] = useState(false);
  const [profitMode, setProfitMode] = useState('local'); // 'local' | 'foreign'

  const handlePressDelete = () => {
    Alert.alert(
      'Hapus Item',
      'Item akan dihapus permanen dari database. Lanjutkan?',
      [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          let response = await cancelItem({id: item.id});
          if (response) {
            RootNavigation.goBack();
          }
        },
      },
    ]);
  };
  const handlePressEdit = async () => {
    RootNavigation.navigate('ItemCreate', {item});
  };

  const handleRefresh = async () => {
    let response = await getListItem({item_id: item.id});
    if (response && response[0]) {
      // Update params supaya data fresh
      navigation.setParams({item: response[0]});
    }
  };

  const statusColor = {
    200: color.warning,
    201: '#3B82F6',
    202: '#0EA5E9',
    203: '#F59E0B',
    204: '#F97316',
    205: color.success,
    206: color.danger,
    3: color.danger,
  };

  // Edit/hapus hanya untuk draft yang belum diklaim batch/transaksi. Draft
  // yang sudah masuk disposal (trx_model) tetap terkunci karena snapshot
  // transaksinya sudah dibuat di backend.
  const canEditDelete =
    Number(item?.status) === 200 && !item?.batch_id && !item?.trx_model;

  // Harga per pcs (mengikuti toggle mata uang) + total = qty × harga satuan
  const qty = Number(item?.quantity || 0);
  const unitCost = Number(item?.[`${profitMode}_cost`] || 0);
  const unitSelling = Number(item?.[`${profitMode}_price`] || 0);
  const unitShipping = Number(item?.[`${profitMode}_shipping`] || 0);
  const unitProfit = Number(item?.[`${profitMode}_profit`] || 0);
  const totalCost = unitCost * qty;
  const totalSelling = unitSelling * qty;
  const totalProfit = unitProfit * qty;
  const priceCode = `${item?.cost_code || '-'}${codeUnitSuffix(
    item?.cost_unit,
  )} → ${item?.selling_code || '-'}${codeUnitSuffix(item?.selling_unit)}`;

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      {visibleImageViewer && (
        <ImageViewer
          filename={item?.photo_path || item?.photo}
          onClose={() => setVisibleImageViewer(false)}
        />
      )}

      {/* Header minimalis */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => RootNavigation.goBack()}
            style={styles.headerBtn}>
            <Icon name="arrow-left" size={22} color={color.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Item</Text>
          {canEditDelete ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handlePressEdit}
                style={styles.headerBtn}>
                <Icon name="pencil" size={18} color={color.warning} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePressDelete}
                style={styles.headerBtn}>
                <Icon name="trash-2" size={18} color={color.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={() => setVisibleImageViewer(true)}>
            <ImageThumbnail
              filename={item?.photo_path || item?.photo}
              size={48}
              radius={12}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item?.customer_name}
            </Text>
            <Text style={styles.customerPhone} numberOfLines={1}>
              {item?.customer_phone}
            </Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            colors={[color.primaryColor]}
          />
        }>
        {/* Profit card */}
        <View style={styles.profitCard}>
          <View style={styles.profitHeader}>
            <Text style={styles.priceCellValue}>
              1 {item.cost_currency} = {item.exchange_rate}{' '}
              {item.selling_currency}
            </Text>
            <View style={styles.profitToggle}>
              <TouchableOpacity
                style={[
                  styles.profitToggleBtn,
                  profitMode === 'local' && styles.profitToggleActive,
                ]}
                onPress={() => setProfitMode('local')}>
                <Text
                  style={[
                    styles.profitToggleText,
                    profitMode === 'local' && styles.profitToggleTextActive,
                  ]}>
                  {item?.local_currency}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.profitToggleBtn,
                  profitMode === 'foreign' && styles.profitToggleActive,
                ]}
                onPress={() => setProfitMode('foreign')}>
                <Text
                  style={[
                    styles.profitToggleText,
                    profitMode === 'foreign' && styles.profitToggleTextActive,
                  ]}>
                  {item?.foreign_currency}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Cost - Selling compact 2 kolom (harga per pcs) */}

          <View style={styles.priceCard}>
            <View style={styles.priceGrid}>
              <View style={styles.priceCell}>
                <Text style={styles.priceCellLabel}>Cost /pcs</Text>
                <Text style={styles.priceCellValue}>{fmt(unitCost)}</Text>
              </View>
              <View style={styles.priceCellDivider} />
              <View style={styles.priceCell}>
                <Text style={styles.priceCellLabel}>Selling /pcs</Text>
                <Text style={styles.priceCellValue}>{fmt(unitSelling)}</Text>
              </View>
            </View>
            {/* Shipment - Profit, compact 2 kolom */}
            <View
              style={[
                styles.priceGrid,
                {borderTopWidth: 1, borderTopColor: '#F0F0F5'},
              ]}>
              <View style={styles.priceCell}>
                <Text style={styles.priceCellLabel}>Shipment /pcs</Text>
                <Text style={styles.priceCellValue}>{fmt(unitShipping)}</Text>
              </View>
              <View style={styles.priceCellDivider} />
              <View style={styles.priceCell}>
                <Text style={styles.priceCellLabel}>Profit /pcs</Text>
                <Text style={styles.priceCellValue}>{fmt(unitProfit)}</Text>
              </View>
            </View>
          </View>

          {/* Ringkasan total = qty pcs × harga satuan */}
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Harga Total</Text>
              <Text style={styles.totalGrand}>{fmt(totalSelling)}</Text>
            </View>
            <Text style={styles.totalFormula}>
              {qty} pcs × {fmt(unitSelling)}/pcs
            </Text>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalSubLabel}>Modal Total</Text>
              <Text style={styles.totalSubValue}>{fmt(totalCost)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalSubLabel}>Profit Total</Text>
              <Text style={[styles.totalSubValue, styles.totalProfit]}>
                {fmt(totalProfit)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detail compact */}
        <View style={styles.detailCard}>
          {[
            {
              label: 'Item',
              value: item?.item_name || item?.product_name || '-',
            },
            {label: 'Kode Harga', value: priceCode},
            {label: 'Status', value: item?.status_name || '-'},
            {
              label: 'Qty',
              value: item?.quantity != null ? `${item.quantity} pcs` : '-',
            },
            {label: 'Barcode', value: item?.barcode || '-'},
            {label: 'Batch', value: item?.batch_no || '-'},
            {label: 'Gudang', value: item?.warehouse_name || '-'},
            {
              label: 'Order',
              value: moment(item?.created_date).format('DD MMM YYYY, HH:mm'),
            },
            {
              label: 'Update',
              value: moment(item?.modified_date).format('DD MMM YYYY, HH:mm'),
            },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                i < arr.length - 1 && styles.detailRowBorder,
              ]}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ItemView;

const styles = StyleSheet.create({
  header: {
    backgroundColor: color.primaryColor,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 15,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: color.white,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  headerText: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: color.white,
  },
  customerPhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: color.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  /* ---- Price Card ---- */
  priceCard: {
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    overflow: 'hidden',
    marginBottom: 12,
  },
  priceGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  priceCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  priceCellDivider: {
    width: 1,
    backgroundColor: '#F0F0F5',
  },
  priceCellLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9A9A9A',
  },
  priceCellValue: {
    fontSize: 15,
    fontWeight: '800',
    color: color.primaryColor,
    marginTop: 2,
  },
  priceCellSub: {
    fontSize: 10,
    color: '#B0B0B0',
    marginTop: 2,
  },
  /* ---- Total Card ---- */
  totalCard: {
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E9F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  totalGrand: {
    fontSize: 17,
    fontWeight: '800',
    color: color.primaryColor,
  },
  totalFormula: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 1,
    textAlign: 'right',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 8,
  },
  totalSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
  },
  totalSubValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  totalProfit: {
    color: color.success,
  },
  /* ---- Profit Card ---- */
  profitCard: {
    backgroundColor: '#F6F8FC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  profitToggle: {
    flexDirection: 'row',
    backgroundColor: '#E8EAF0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 5,
  },
  profitToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profitToggleActive: {
    backgroundColor: color.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 2,
    elevation: 1,
  },
  profitToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  profitToggleTextActive: {
    color: color.primaryColor,
  },
  profitValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  /* ---- Detail Card ---- */
  detailCard: {
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F1F1F',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});
