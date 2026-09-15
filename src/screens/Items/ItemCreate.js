import {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import InputText from '../../components/InputText';
import UploadImage from '../../components/UploadImage';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {createItem, updateItem} from '../../resource/Item';
import {createCustomer, getListCustomer} from '../../resource/Customer';
import {fetchDashboard} from '../../resource/Dashboard';
import {getEndpoint, getSysConfig} from '../../storage';
import {getMimeType} from '../../helper/helper';
import {normalizePhone} from '../../helper/contactSync';
import {PRICE_UNIT_LIST} from '../../constant/priceUnit';
import Toast from 'react-native-toast-message';

// Ubah nomor penuh (+62812... / 0812...) menjadi digit lokal (812...)
const toLocalDigits = phone => {
  if (!phone) return '';
  const cc = getSysConfig()?.country_code || '+62';
  const ccPlain = cc.replace('+', '');
  let p = String(phone).replace(/[\s\-().]/g, '');
  if (p.startsWith(cc)) p = p.slice(cc.length);
  else if (p.startsWith(ccPlain)) p = p.slice(ccPlain.length);
  else if (p.startsWith('0')) p = p.slice(1);
  return p;
};

// Validasi digit lokal: 9-15 digit
const isValidPhone = local => {
  const digits = String(local || '').replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
};

const ItemCreate = ({navigation, route}) => {
  // Prefix (+62) diambil dari sys_configuration_mst yang tersimpan di MMKV
  const phonePrefix = getSysConfig()?.country_code || '+62';
  const [formData, setFormData] = useState({
    id: null,
    item_name: null,
    customer_phone: null,
    quantity: '1',
    cost_code: null,
    selling_code: null,
    photo: null,
  });
  // Autocomplete customer
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  // Ref untuk navigasi keyboard antar field
  const quantityRef = useRef(null);
  const phoneRef = useRef(null);
  const costPriceRef = useRef(null);
  const sellingPriceRef = useRef(null);
  // Session aktif (untuk info mata uang/unit cost saat create)
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    // Ambil session aktif untuk menampilkan mata uang/unit cost (read-only)
    fetchDashboard(false).then(d => {
      if (d?.active_session) setSessionInfo(d.active_session);
    });
  }, []);

useEffect(() => {
    if (route && route?.params?.item) {
      let item = route?.params?.item;
      let param = {};
      param.id = item.id || null;
      param.customer_phone = toLocalDigits(item.customer_phone);
      param.item_name = item.product_name || item.item_name || null;
      param.quantity = item.quantity != null ? String(item.quantity) : null;
      // Harga dikirim sebagai kode (alphabet) — tampilkan cost_code/selling_code
      param.cost_code = item.cost_code || null;
      param.selling_code = item.selling_code || null;
      param.photo = getImageObject(item.photo_path || item.photo);
      setFormData(f => ({...f, ...param}));
      // Jangan trigger pencarian ulang untuk nomor yang sudah ada
      if (item.customer_phone) {
        setSelectedCustomer({
          id: item.customer_id,
          name: item.customer_name,
          phone: item.customer_phone,
        });
      }
    }
    // route stabil seumur hidup screen — cukup jalankan sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pencarian otomatis customer saat nomor sudah >= 3 digit (debounce 500ms)
  useEffect(() => {
    const phone = formData.customer_phone;
    // Bandingkan dalam format yang sama (local digits) agar guard akurat
    const selectedLocal =
      selectedCustomer && toLocalDigits(selectedCustomer.phone);
    if (
      !phone ||
      phone.length < 3 ||
      (selectedLocal && selectedLocal === phone)
    ) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      setShowAddCustomer(false);
      return;
    }
    const timer = setTimeout(() => searchCustomer(phone), 500);
    return () => clearTimeout(timer);
    // searchCustomer dibuat ulang tiap render — sengaja tidak dijadikan dep
    // agar debounce tidak ter-reset oleh render lain
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customer_phone, selectedCustomer]);

  // Ref untuk membatalkan hasil pencarian yang sudah basi (stale)
  const searchSeqRef = useRef(0);

  const searchCustomer = async phone => {
    const seq = ++searchSeqRef.current;
    setCustomerSearching(true);
    setShowSuggestions(true);
    let result = await getListCustomer({search: phone}, false);
    setCustomerSearching(false);
    // Hasil basi (input berubah / customer sudah dipilih) — jangan tampilkan
    if (seq !== searchSeqRef.current) return;
    if (result) {
      // Jika ada kecocokan persis, langsung pilih customer tsb
      // (bandingkan dalam local digits agar format +62 vs 8xx cocok)
      const exact = result.find(c => toLocalDigits(c.phone) === phone);
      if (exact) {
        selectCustomer(exact);
        return;
      }
      setCustomerSuggestions(result);
      setShowSuggestions(result.length > 0);
      setShowAddCustomer(result.length === 0);
    } else {
      setShowSuggestions(false);
      setShowAddCustomer(false);
    }
  };

  const handlePhoneChange = value => {
    searchSeqRef.current++; // batalkan pencarian yang sedang berjalan
    // Hanya terima digit (prefix +62 ditampilkan terpisah)
    const digits = String(value).replace(/\D/g, '');
    setSelectedCustomer(null);
    setFormData({...formData, customer_phone: digits});
  };

  const selectCustomer = cust => {
    searchSeqRef.current++; // batalkan pencarian yang sedang berjalan
    setSelectedCustomer(cust);
    setFormData({...formData, customer_phone: toLocalDigits(cust.phone)});
    setCustomerSuggestions([]);
    setShowSuggestions(false);
    setShowAddCustomer(false);
  };

  // Hapus pilihan customer (icon close di field Phone No.)
  const clearCustomer = () => {
    searchSeqRef.current++; // batalkan pencarian yang sedang berjalan
    setSelectedCustomer(null);
    setFormData({...formData, customer_phone: ''});
    setCustomerSuggestions([]);
    setShowSuggestions(false);
    setShowAddCustomer(false);
    phoneRef.current?.focus();
  };

  const saveNewCustomer = async () => {
    if (!newCustomerName) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nama customer wajib diisi',
      });
      return;
    }
    const fullPhone = normalizePhone(formData.customer_phone);
    setSavingCustomer(true);
    let saved = await createCustomer({
      name: newCustomerName,
      phone: fullPhone,
      address: newCustomerAddress,
    });
    setSavingCustomer(false);
    if (saved) {
      setSelectedCustomer({
        id: saved.id,
        name: saved.name || newCustomerName,
        phone: saved.phone || fullPhone,
        address: saved.address || newCustomerAddress,
      });
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerAddress('');
    }
  };

  const getImageObject = filename => {
    if (!filename) return null;
    const time = new Date().getTime(); // 👈 cache buster
    // Backend menyimpan foto di public/uploads/jastip (di-serve statis)
    const url = `${getEndpoint()}/${filename.replace(
      /^public\//,
      '',
    )}?t=${time}`;
    let photo = {
      uri: url,
      filename: filename,
      type: getMimeType(filename),
    };

    return photo;
  };
  const save = async () => {
    // Validasi nomor telp (9-15 digit setelah +62)
    if (!isValidPhone(formData.customer_phone)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nomor telp tidak valid (9-15 digit)',
      });
      return;
    }
    const form = new FormData();
    // Isi FormData dengan semua properti dari Params
    try {
      for (let key in formData) {
        const value = formData[key];
        if (key === 'customer_phone') continue; // ditangani khusus di bawah
        // Jika value adalah file (misal gambar dari picker)
        if (value && typeof value === 'object' && value.uri) {
          if (value.uri.startsWith('http')) {
            // Foto lama dari server — kirim path-nya saja, jangan upload ulang
            form.append('photo_path', value.filename);
          } else {
            form.append(key, {
              uri: value.uri,
              name: value.name || 'file.jpg',
              type: value.type || 'image/jpeg',
            });
          }
        } else if (value !== null && value !== undefined && value !== '') {
          // Jika value bukan null
          form.append(key, value);
        }
      }
      // customer_id diambil dari database berdasarkan nomor telpon yang dipilih
      if (selectedCustomer?.id) {
        form.append('customer_id', selectedCustomer.id);
      } else {
        form.append('customer_phone', normalizePhone(formData.customer_phone));
      }
      let submit = null;
      if (formData.id) {
        submit = await updateItem(form);
      } else {
        submit = await createItem(form);
      }
      if (submit) RootNavigation.goBack();
    } catch (error) {
      console.log(error);
    }
  };
  // Info mata uang & unit (read-only): snapshot item saat edit; session aktif
  // (cost) & sys_configuration (selling) saat create.
  const sysCfg = getSysConfig() || {};
  const editItem = route?.params?.item;
  const costCurrency =
    editItem?.cost_currency || sessionInfo?.currency_code || 'IDR';
  const costUnit =
    editItem?.cost_unit || sessionInfo?.price_code_unit || 'none';
  const sellingCurrency = editItem?.selling_currency || sysCfg.currency || 'IDR';
  const sellingUnit =
    editItem?.selling_unit || sysCfg.price_unit_code || 'none';
  const unitLabel = unit => {
    const u = PRICE_UNIT_LIST.find(x => x.value === unit);
    return u ? `${u.label} (${u.multiplier || '1'})` : unit;
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={formData.id ? 'Edit Item' : 'Create Item'} />
      <View
        style={{
          flex: 1,
          backgroundColor: color.white,
          marginTop: -40,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          padding: 30,
        }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <View style={{marginTop: 18}}>
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <InputText
                    label="Item Name"
                    value={formData.item_name}
                    onChangeText={value =>
                      setFormData({...formData, item_name: value})
                    }
                    placeholder="Nama barang"
                    returnKeyType="next"
                    onSubmitEditing={() => quantityRef.current?.focus()}
                  />
                </View>
                <View style={styles.rowItem}>
                  <InputText
                    ref={quantityRef}
                    label="Quantity"
                    required={true}
                    showError={true}
                    keyboardType="numeric"
                    value={formData.quantity}
                    onChangeText={value =>
                      setFormData({...formData, quantity: value})
                    }
                    placeholder="Jumlah"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                  />
                </View>
              </View>
              <InputText
                ref={phoneRef}
                label="Phone No."
                required={true}
                showError={true}
                prefix={phonePrefix}
                keyboardType="phone-pad"
                maxLength={15}
                value={formData.customer_phone}
                onChangeText={handlePhoneChange}
                placeholder="81234567890"
                returnKeyType="next"
                onSubmitEditing={() => costPriceRef.current?.focus()}
                rightIcon={
                  selectedCustomer ? (
                    <Icon name="x" size={18} color="#999" />
                  ) : null
                }
                onPressRightIcon={clearCustomer}
              />

              {/* Chip customer terpilih */}
              {selectedCustomer && (
                <View style={styles.selectedCustomerBox}>
                  <Text style={styles.selectedCustomerName}>
                    {selectedCustomer.name || '—'}
                  </Text>
                  <Text style={styles.selectedCustomerPhone}>
                    {selectedCustomer.phone}
                  </Text>
                </View>
              )}

              {/* Dropdown hasil pencarian customer */}
              {showSuggestions && (
                <View style={styles.suggestionBox}>
                  {customerSearching ? (
                    <Text style={styles.suggestionHint}>
                      Mencari customer...
                    </Text>
                  ) : (
                    customerSuggestions.map((cust, index) => (
                      <TouchableOpacity
                        key={cust.id || index}
                        style={[
                          styles.suggestionItem,
                          index < customerSuggestions.length - 1 &&
                            styles.suggestionItemBorder,
                        ]}
                        onPress={() => selectCustomer(cust)}>
                        <Text style={styles.suggestionName}>{cust.name}</Text>
                        <Text style={styles.suggestionPhone}>{cust.phone}</Text>
                        {cust.address ? (
                          <Text
                            style={styles.suggestionAddress}
                            numberOfLines={1}>
                            {cust.address}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Panel tambah customer baru jika nomor tidak ditemukan */}
              {showAddCustomer && (
                <View style={styles.addCustomerBox}>
                  <Text style={styles.addCustomerTitle}>
                    Customer tidak ditemukan
                  </Text>
                  <Text style={styles.addCustomerSubtitle}>
                    Nomor {normalizePhone(formData.customer_phone)} belum
                    terdaftar. Tambahkan customer baru:
                  </Text>
                  <InputText
                    label="Nama Customer"
                    required={true}
                    value={newCustomerName}
                    onChangeText={setNewCustomerName}
                    placeholder="Masukkan nama customer"
                  />
                  <InputText
                    label="Alamat"
                    value={newCustomerAddress}
                    onChangeText={setNewCustomerAddress}
                    placeholder="Masukkan alamat customer"
                  />
                  <TouchableOpacity
                    onPress={saveNewCustomer}
                    disabled={savingCustomer}
                    style={[
                      styles.addCustomerButton,
                      savingCustomer && styles.addCustomerButtonDisabled,
                    ]}>
                    <Text style={styles.addCustomerButtonText}>
                      {savingCustomer ? 'Menyimpan...' : 'Simpan Customer Baru'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <InputText
                ref={costPriceRef}
                label="Cost Price"
                required={true}
                showError={true}
                value={formData.cost_code}
                onChangeText={value =>
                  setFormData({...formData, cost_code: value})
                }
                placeholder="Kode harga (misal: ADB)"
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => sellingPriceRef.current?.focus()}
              />
              <Text style={styles.priceInfo}>
                Mata uang: {costCurrency} • Unit: {unitLabel(costUnit)}
              </Text>
              <InputText
                ref={sellingPriceRef}
                label="Selling Price"
                required={true}
                showError={true}
                value={formData.selling_code}
                onChangeText={value =>
                  setFormData({...formData, selling_code: value})
                }
                placeholder="Kode harga (misal: ADB)"
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={() => save()}
              />
              <Text style={styles.priceInfo}>
                Mata uang: {sellingCurrency} • Unit: {unitLabel(sellingUnit)}
              </Text>
              <UploadImage
                label="Foto Barang"
                image={formData.photo}
                setImage={image => {
                  setFormData({...formData, photo: image});
                }}
                //   required
                //   showError={submitted}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => save()}
            style={{
              marginTop: 10,
              borderRadius: 20,
              backgroundColor: color.primaryColor,
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}>
            <Text
              style={{
                color: color.white,
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              Save Item
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default ItemCreate;

const styles = StyleSheet.create({
  title: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  priceInfo: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: -8,
    marginBottom: 12,
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
  selectedCustomerBox: {
    backgroundColor: color.primaryLight,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  selectedCustomerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: color.primaryColor,
    marginBottom: 2,
  },
  selectedCustomerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  selectedCustomerPhone: {
    fontSize: 13,
    fontWeight: '500',
    color: color.primaryColor,
    marginTop: 2,
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
  suggestionAddress: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 2,
  },
  addCustomerBox: {
    backgroundColor: color.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: color.primaryLighter,
  },
  addCustomerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: color.primaryColor,
  },
  addCustomerSubtitle: {
    fontSize: 12,
    color: '#6A6A6A',
    marginTop: 4,
    marginBottom: 12,
  },
  addCustomerButton: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: color.primaryColor,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerButtonDisabled: {
    opacity: 0.7,
  },
  addCustomerButtonText: {
    color: color.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
