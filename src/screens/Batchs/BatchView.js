import Icon from '@react-native-vector-icons/lucide';
import moment from 'moment';
import {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import ItemCard from '../../components/ItemCard';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {
  cancelBatch,
  getListBatch,
  shippingBatch,
  updateBatch,
} from '../../resource/Batch';
import {useFocusEffect} from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import {getListMstWarehouse} from '../../resource/MstWarehouse';
import {fetchDashboard} from '../../resource/Dashboard';

const BatchView = ({navigation, route}) => {
  let item = route.params?.item || {};
  const [data, setData] = useState(null);
  const [list, setList] = useState([]);
  const [weight, setWeight] = useState('');
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [shipmentPrice, setShipmentPrice] = useState('');
  const [shipmentCurrency, setShipmentCurrency] = useState('IDR');
  const [showShipForm, setShowShipForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shipping, setShipping] = useState(false);
  // Dropdown tujuan (warehouse)
  const [open, setOpen] = useState(false);
  const [warehouseList, setWarehouseList] = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWarehouse = async () => {
    let response = await getListMstWarehouse({status: 'Active'}, false);
    if (response) {
      let arr = [];
      for (const it of response) {
        arr.push({value: it.id, label: it.address, ...it});
      }
      setWarehouseList(arr);
    }
  };

  // Default shipment currency dari session jastip aktif
  const loadSessionCurrency = async () => {
    const d = await fetchDashboard(false);
    const cur = d?.active_session?.currency_code;
    if (cur) {
      setShipmentCurrency(cur);
    }
  };

  const loadData = async () => {
    // Backend hanya mengisi items saat query memakai id
    let response = await getListBatch({id: item.id});
    if (response && response[0]) {
      setData(response[0]);
      setList(response[0].items || []);
      setWeight(response[0].weight != null ? String(response[0].weight) : '');
      setWarehouseId(response[0].warehouse_id || null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    loadWarehouse();
    loadSessionCurrency();
    // loadData/loadWarehouse/loadSessionCurrency sengaja tidak dijadikan dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Terima item yang dipilih dari BatchItemPicker
  useFocusEffect(
    useCallback(() => {
      if (route.params?.pickedItems) {
        const picked = route.params.pickedItems;
        setList(prev => {
          const existing = new Set(prev.map(i => i.id));
          const merged = [...prev];
          for (const p of picked) {
            if (!existing.has(p.id)) {
              merged.push(p);
              existing.add(p.id);
            }
          }
          return merged;
        });
        // Bersihkan params agar tidak ter-merge dua kali
        navigation.setParams({pickedItems: undefined});
      }
      // navigation stabil; sengaja tidak dijadikan dep
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.pickedItems]),
  );

  const handleRemoveItem = item => {
    setList(prev => prev.filter(i => i.id !== item.id));
  };

  const handleSave = () => {
    if (list.length === 0) {
      return;
    }
    Alert.alert(
      'Simpan Perubahan',
      'Apakah anda yakin ingin menyimpan perubahan batch ini?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Simpan',
          onPress: async () => {
            setSaving(true);
            let response = await updateBatch({
              id: item.id,
              items: list.map(i => ({id: i.id})),
              weight: data?.weight,
              modified_by: 0,
            });
            setSaving(false);
            if (response) {
              loadData();
            }
          },
        },
      ],
    );
  };

  const handlePressDelete = () => {
    Alert.alert(
      'Hapus Batch',
      'Apakah anda yakin ingin menghapus batch ini?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            let response = await cancelBatch({id: item.id});
            if (response) {
              RootNavigation.goBack();
            }
          },
        },
      ],
    );
  };

  const handlePressShip = async () => {
    if (!shipmentNumber || !shipmentPrice || !warehouseId) {
      return;
    }
    setShipping(true);
    let response = await shippingBatch({
      id: data.id,
      weight: weight,
      shipment_number: shipmentNumber,
      shipment_price: shipmentPrice,
      shipment_currency: shipmentCurrency,
      warehouse_id: warehouseId,
    });
    setShipping(false);
    if (response) {
      RootNavigation.goBack();
    }
  };

  const statusColor = {
    Draft: color.warning,
    Shipping: color.secondaryColor,
    Done: color.success,
  };

  const renderItem = (item, index) => {
    return (
      <ItemCard
        key={index}
        item={item}
        size={44}
        onRemove={data?.status === 'Draft' ? handleRemoveItem : null}
      />
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />

      {/* Header minimalis */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => RootNavigation.goBack()}
            style={styles.headerBtn}>
            <Icon name="arrow-left" size={22} color={color.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Batch</Text>
          {data?.status === 'Draft' ? (
            <TouchableOpacity
              onPress={handlePressDelete}
              style={styles.headerBtn}>
              <Icon name="trash-2" size={20} color={color.danger} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.batchNo} numberOfLines={1}>
            {data?.batch_no || '...'}
          </Text>
          <View
            style={[
              styles.statusChip,
              {backgroundColor: statusColor[data?.status] || '#C4C4C4'},
            ]}>
            <Text style={styles.statusText}>{data?.status || '-'}</Text>
          </View>
        </View>
        <Text style={styles.headerMeta}>
          {list.length} item • {moment(item?.created_date).format('DD MMM YYYY, HH:mm')}
        </Text>
      </View>

      {/* List item batch */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Item Batch ({list.length})</Text>
          {data?.status === 'Draft' && (
            <TouchableOpacity
              onPress={() =>
                RootNavigation.navigate('BatchItemPicker', {
                  batchId: item.id,
                })
              }
              style={styles.addItemBtn}>
              <Icon name="plus" size={14} color={color.white} />
              <Text style={styles.addItemText}>Tambah Item</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={list}
          renderItem={({item, index}) => renderItem(item, index)}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[color.primaryColor]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Belum ada item dalam batch</Text>
          }
        />
      </View>

      {/* Aksi Draft: simpan + kirim */}
      {data?.status === 'Draft' && (
        <View style={styles.formCard}>
          {!showShipForm ? (
            <View style={styles.formActions}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || list.length === 0}
                style={[
                  styles.secondaryBtn,
                  (saving || list.length === 0) && styles.btnDisabled,
                ]}>
                <Text style={styles.secondaryBtnText}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowShipForm(true)}
                style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Kirim</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.formTitle}>Kirim Batch</Text>
              <InputText
                label="Weight (kg)"
                required={true}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="Masukkan berat batch"
              />
              <DropDownPicker
                open={open}
                value={warehouseId}
                items={warehouseList}
                setOpen={setOpen}
                onSelectItem={item => {
                  setWarehouseId(item.value);
                }}
                setItems={setWarehouseList}
                placeholder={'Pilih tujuan'}
                style={styles.picker}
                dropDownContainerStyle={styles.pickerDropdown}
              />
              <InputText
                label="Shipment Number"
                required={true}
                value={shipmentNumber}
                onChangeText={setShipmentNumber}
                placeholder="Masukkan nomor resi"
              />
              <InputText
                label="Shipment Price"
                required={true}
                keyboardType="numeric"
                value={shipmentPrice}
                onChangeText={setShipmentPrice}
                placeholder="Masukkan harga kirim"
              />
              <InputText
                label="Shipment Currency"
                required={true}
                value={shipmentCurrency}
                onChangeText={setShipmentCurrency}
                placeholder="cth: IDR / THB"
                autoCapitalize="characters"
              />
              <Text style={styles.currencyHint}>
                Default dari session jastip aktif ({shipmentCurrency}).
              </Text>
              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={() => setShowShipForm(false)}
                  style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePressShip}
                  disabled={shipping}
                  style={[styles.primaryBtn, shipping && styles.btnDisabled]}>
                  <Text style={styles.primaryBtnText}>
                    {shipping ? 'Mengirim...' : 'Konfirmasi Kirim'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default BatchView;

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
    gap: 10,
    marginTop: 12,
  },
  batchNo: {
    fontSize: 22,
    fontWeight: '800',
    color: color.white,
    flexShrink: 1,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: color.white,
  },
  headerMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
  listContainer: {
    flex: 1,
    backgroundColor: color.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addItemText: {
    color: color.white,
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#9A9A9A',
    marginTop: 30,
    fontSize: 13,
  },
  formCard: {
    backgroundColor: color.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 8,
  },
  picker: {
    borderRadius: 15,
    borderColor: '#E0E0E8',
    marginTop: 5,
    marginBottom: 10,
  },
  pickerDropdown: {
    borderRadius: 15,
    borderColor: '#E0E0E8',
  },
  currencyHint: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: -4,
    marginBottom: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: color.primaryLight,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: '#C4C4C4',
  },
  primaryBtnText: {
    color: color.white,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtnText: {
    color: color.primaryColor,
    fontSize: 14,
    fontWeight: '700',
  },
});