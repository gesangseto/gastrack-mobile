import Icon from '@react-native-vector-icons/lucide';
import moment from 'moment';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {cancelItem} from '../../resource/Item';
import ImageThumbnail from '../../components/ImageThumbnail';
import {useState} from 'react';
import ImageViewer from '../../components/ImageViewer';

const ItemView = ({navigation, route}) => {
  let item = route.params?.item || {};
  const [visibleImageViewer, setVisibleImageViewer] = useState(false);

  const handlePressDelete = async () => {
    let response = await cancelItem({id: item.id});
    if (response) {
      RootNavigation.goBack();
    }
  };
  const handlePressEdit = async item => {
    RootNavigation.navigate('ItemCreate', {item: item});
  };

  const statusColor = {
    200: color.warning,
    201: '#3B82F6',
    202: '#0EA5E9',
    203: '#F59E0B',
    204: '#F97316',
    205: color.success,
    206: color.danger,
  };

  const detailRows = [
    {label: 'Order Time', value: moment(item?.created_date).format('YYYY-MM-DD HH:mm')},
    {label: 'Last Update', value: moment(item?.modified_date).format('YYYY-MM-DD HH:mm')},
    {label: 'Item Name', value: item?.product_name || item?.item_name || '-'},
    {label: 'Batch No', value: item?.batch_no || '-'},
    {label: 'Status', value: item?.status_name || item?.status || '-'},
    {label: 'Location Transit', value: item?.warehouse_name || '-'},
    {label: 'Destination Address', value: item?.customer_destination_address || '-'},
    {label: 'Destination Phone', value: item?.customer_destination_phone || '-'},
    {label: 'Destination PIC', value: item?.customer_destination_name || '-'},
  ];

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
          {item?.status === 200 ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => handlePressEdit(item)}
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
              size={56}
              radius={14}
            />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item?.customer_name}
            </Text>
            <Text style={styles.customerPhone} numberOfLines={1}>
              {item?.customer_phone}
            </Text>
            <Text style={styles.customerAddress} numberOfLines={2}>
              {item?.customer_address}
            </Text>
          </View>
        </View>
      </View>

      {/* Detail */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 && styles.detailRowBorder,
              ]}>
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
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
    paddingBottom: 20,
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
    gap: 14,
    marginTop: 12,
  },
  headerText: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '800',
    color: color.white,
  },
  customerPhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  body: {
    flex: 1,
    backgroundColor: color.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  card: {
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    paddingHorizontal: 16,
  },
  detailRow: {
    paddingVertical: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
    marginTop: 3,
  },
});