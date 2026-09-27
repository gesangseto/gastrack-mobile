import {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import {fetchCountries} from '../../resource/Country';
import {getEndpoint, getSysConfig} from '../../storage';
import {getMimeType} from '../../helper/helper';
import {
  isValidLocalPhone,
  normalizePhone,
} from '../../helper/phone';
import {PRICE_UNIT_LIST} from '../../constant/priceUnit';
import Toast from 'react-native-toast-message';
import {useSessionStore} from '../../store/sessionStore';

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
  // Pembayaran langsung (opsional)
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  // Ref untuk navigasi keyboard antar field
  const quantityRef = useRef(null);
  const phoneRef = useRef(null);
  const costPriceRef = useRef(null);
  const sellingPriceRef = useRef(null);
  // Session aktif (untuk info mata uang/unit cost saat create)
  const [sessionInfo, setSessionInfo] = useState(null);
  // Unit harga per item: null = pakai default (cost ← session, selling ← config)
  const [costUnit, setCostUnit] = useState(null);
  const [sellingUnit, setSellingUnit] = useState(null);
  // Picker unit harga: 'cost' | 'selling' | null
  const [unitPickerFor, setUnitPickerFor] = useState(null);
  // Daftar negara untuk symbol mata uang selling
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Ambil session aktif untuk menampilkan mata uang/unit cost (read-only)
    fetchDashboard(false).then(d => {
      if (d?.active_session) setSessionInfo(d.active_session);
    });
    fetchCountries().then(list => setCountries(list || []));
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
      // Unit harga snapshot item (fallback ke default session/config)
      if (item.cost_unit) setCostUnit(item.cost_unit);
      if (item.selling_unit) setSellingUnit(item.selling_unit);
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
    if (!newCustomerName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nama customer wajib diisi',
      });
      return;
    }
    if (!isValidLocalPhone(formData.customer_phone)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nomor telp tidak valid (9-15 digit)',
      });
      return;
    }
    if (savingCustomer) return;
    const fullPhone = normalizePhone(formData.customer_phone);
    setSavingCustomer(true);
    try {
      const saved = await createCustomer({
        name: newCustomerName.trim(),
        phone: fullPhone,
        address: newCustomerAddress.trim(),
      });
      if (saved) {
        setSelectedCustomer({
          id: saved.id,
          name: saved.name || newCustomerName.trim(),
          phone: saved.phone || fullPhone,
          address: saved.address || newCustomerAddress.trim(),
        });
        setShowAddCustomer(false);
        setNewCustomerName('');
        setNewCustomerAddress('');
      }
    } finally {
      setSavingCustomer(false);
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
    // Guard create: wajib ada session aktif (edit item tidak butuh session baru)
    if (!formData.id) {
      const session = await useSessionStore.getState().ensureActiveSession();
      if (!session) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Tidak ada session aktif. Mulai session terlebih dahulu.',
        });
        return;
      }
    }
    // Validasi nomor telp (9-15 digit setelah +62)
    if (!isValidPhone(formData.customer_phone)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nomor telp tidak valid (9-15 digit)',
      });
      return;
    }
    const doSubmit = async () => {
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
        // Unit harga per item (override default session/config)
        form.append('cost_unit', effectiveCostUnit);
        form.append('selling_unit', effectiveSellingUnit);
        // Pembayaran langsung (opsional — hanya saat create baru)
        if (!formData.id && Number(paymentAmount) > 0) {
          form.append('payment_amount', paymentAmount);
          form.append('payment_method', paymentMethod);
          if (paymentRef.trim()) form.append('reference_number', paymentRef.trim());
          if (paymentNotes.trim()) form.append('payment_notes', paymentNotes.trim());
        }
        let submit = null;
        if (formData.id) {
          submit = await updateItem(form);
        } else {
          submit = await createItem(form);
        }
        if (submit) RootNavigation.goBack();
      } catch (error) {
        console.log('Save item error:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.message || 'Item gagal disimpan',
        });
      }
    };
    // Saat edit: konfirmasi dulu sebelum perubahan disimpan
    if (formData.id) {
      Alert.alert(
        'Simpan Perubahan',
        'Apakah anda yakin ingin menyimpan perubahan item ini?',
        [
          {text: 'Batal', style: 'cancel'},
          {text: 'Simpan', onPress: doSubmit},
        ],
      );
    } else {
      doSubmit();
    }
  };
  // Mata uang & unit: snapshot item saat edit; session aktif (cost) &
  // sys_configuration (selling) saat create. Unit bisa di-override per item.
  const sysCfg = getSysConfig() || {};
  const editItem = route?.params?.item;
  const costCurrency =
    editItem?.cost_currency || sessionInfo?.currency_code || 'IDR';
  const sellingCurrency = editItem?.selling_currency || sysCfg.currency || 'IDR';
  const effectiveCostUnit =
    costUnit || editItem?.cost_unit || sessionInfo?.price_code_unit || 'none';
  const effectiveSellingUnit =
    sellingUnit || editItem?.selling_unit || sysCfg.price_unit_code || 'none';
  // Symbol mata uang: cost ← session.symbol_currency; selling ← lookup negara
  const costSymbol = sessionInfo?.symbol_currency || costCurrency;
  const sellingCountry = countries.find(
    c => c.currency_code === sellingCurrency,
  );
  const sellingSymbol = sellingCountry?.currency_symbol || sellingCurrency;
  const unitLabel = unit => {
    const u = PRICE_UNIT_LIST.find(x => x.value === unit);
    return u ? `${u.label} (${u.multiplier || '1'})` : unit;
  };
  const unitShort = unit => {
    const u = PRICE_UNIT_LIST.find(x => x.value === unit);
    return u ? u.label : unit;
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
          marginTop: -30,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 18,
        }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <View style={{marginTop: 8}}>
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
                prefix={costSymbol}
                suffix={
                  <TouchableOpacity
                    onPress={() => setUnitPickerFor('cost')}
                    style={styles.unitSuffix}>
                    <Text style={styles.unitSuffixText}>
                      {unitShort(effectiveCostUnit)}
                    </Text>
                    <Icon name="chevron-down" size={14} color="#999" />
                  </TouchableOpacity>
                }
                value={formData.cost_code}
                onChangeText={value =>
                  setFormData({...formData, cost_code: value})
                }
                placeholder="Kode harga (misal: ADB)"
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => sellingPriceRef.current?.focus()}
              />
              <InputText
                ref={sellingPriceRef}
                label="Selling Price"
                required={true}
                showError={true}
                prefix={sellingSymbol}
                suffix={
                  <TouchableOpacity
                    onPress={() => setUnitPickerFor('selling')}
                    style={styles.unitSuffix}>
                    <Text style={styles.unitSuffixText}>
                      {unitShort(effectiveSellingUnit)}
                    </Text>
                    <Icon name="chevron-down" size={14} color="#999" />
                  </TouchableOpacity>
                }
                value={formData.selling_code}
                onChangeText={value =>
                  setFormData({...formData, selling_code: value})
                }
                placeholder="Kode harga (misal: ADB)"
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={() => save()}
              />
              <UploadImage
                label="Foto Barang"
                image={formData.photo}
                setImage={image => {
                  setFormData({...formData, photo: image});
                }}
                //   required
                //   showError={submitted}
              />

              {/* === Pembayaran Langsung (opsional, hanya create baru) === */}
              {!formData.id && selectedCustomer && (
                <View style={styles.paymentSection}>
                  <View style={styles.paymentDivider} />
                  <Text style={styles.paymentTitle}>Pembayaran (Opsional)</Text>
                  <InputText
                    label="Jumlah Bayar"
                    keyboardType="numeric"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder="0"
                    prefix={sellingSymbol}
                    returnKeyType="next"
                  />
                  <Text style={styles.label}>Metode Bayar</Text>
                  <TouchableOpacity
                    style={styles.methodPicker}
                    onPress={() => setShowMethodPicker(true)}>
                    <Text style={styles.methodPickerText}>
                      {paymentMethod === 'CASH' && '💵 Tunai'}
                      {paymentMethod === 'BANK_TRANSFER' && '🏦 Transfer Bank'}
                      {paymentMethod === 'E_WALLET' && '📱 E-Wallet'}
                      {paymentMethod === 'OTHER' && '🔄 Lainnya'}
                    </Text>
                    <Icon name="chevron-down" size={16} color="#999" />
                  </TouchableOpacity>
                  {Number(paymentAmount) > 0 && (
                    <>
                      <InputText
                        label="No. Referensi"
                        value={paymentRef}
                        onChangeText={setPaymentRef}
                        placeholder="No. transfer / referensi (opsional)"
                        returnKeyType="next"
                      />
                      <InputText
                        label="Catatan"
                        value={paymentNotes}
                        onChangeText={setPaymentNotes}
                        placeholder="Catatan pembayaran (opsional)"
                        returnKeyType="done"
                        onSubmitEditing={() => save()}
                      />
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => save()}
            style={{
              marginTop: 6,
              borderRadius: 16,
              backgroundColor: color.primaryColor,
              height: 42,
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

      {/* Modal pilih unit harga (cost / selling) */}
      <Modal
        visible={!!unitPickerFor}
        transparent
        animationType="slide"
        onRequestClose={() => setUnitPickerFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Pilih Unit Harga ({unitPickerFor === 'cost' ? 'Cost' : 'Selling'})
              </Text>
              <TouchableOpacity onPress={() => setUnitPickerFor(null)}>
                <Icon name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {PRICE_UNIT_LIST.map(u => {
              const active =
                (unitPickerFor === 'cost'
                  ? effectiveCostUnit
                  : effectiveSellingUnit) === u.value;
              return (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.unitItem, active && styles.unitItemActive]}
                  onPress={() => {
                    if (unitPickerFor === 'cost') {
                      setCostUnit(u.value);
                    } else {
                      setSellingUnit(u.value);
                    }
                    setUnitPickerFor(null);
                  }}>
                  <View style={styles.unitItemLeft}>
                    <Text
                      style={[
                        styles.unitItemLabel,
                        active && styles.unitItemLabelActive,
                      ]}>
                      {u.label}
                    </Text>
                    <Text style={styles.unitItemSub}>
                      Pengali: {u.multiplier || '1'}
                    </Text>
                  </View>
                  {active && (
                    <Icon name="check" size={18} color={color.primaryColor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Modal pilih metode bayar */}
      <Modal
        visible={showMethodPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMethodPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Metode Bayar</Text>
              <TouchableOpacity onPress={() => setShowMethodPicker(false)}>
                <Icon name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {[
              {value: 'CASH', label: '💵 Tunai'},
              {value: 'BANK_TRANSFER', label: '🏦 Transfer Bank'},
              {value: 'E_WALLET', label: '📱 E-Wallet'},
              {value: 'OTHER', label: '🔄 Lainnya'},
            ].map(m => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.unitItem,
                  paymentMethod === m.value && styles.unitItemActive,
                ]}
                onPress={() => {
                  setPaymentMethod(m.value);
                  setShowMethodPicker(false);
                }}>
                <View style={styles.unitItemLeft}>
                  <Text
                    style={[
                      styles.unitItemLabel,
                      paymentMethod === m.value && styles.unitItemLabelActive,
                    ]}>
                    {m.label}
                  </Text>
                </View>
                {paymentMethod === m.value && (
                  <Icon name="check" size={18} color={color.primaryColor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  unitSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F4F4F8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  unitSuffixText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: color.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  unitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  unitItemActive: {
    backgroundColor: color.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  unitItemLeft: {
    flex: 1,
  },
  unitItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  unitItemLabelActive: {
    color: color.primaryColor,
  },
  unitItemSub: {
    fontSize: 10,
    color: '#9A9A9A',
    marginTop: 1,
  },
  suggestionBox: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCustomerBox: {
    backgroundColor: color.primaryLight,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  selectedCustomerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: color.primaryColor,
    marginBottom: 1,
  },
  selectedCustomerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  selectedCustomerPhone: {
    fontSize: 11,
    fontWeight: '500',
    color: color.primaryColor,
    marginTop: 1,
  },
  suggestionHint: {
    fontSize: 13,
    color: '#9A9A9A',
    paddingVertical: 14,
    textAlign: 'center',
  },
  suggestionItem: {
    paddingVertical: 8,
  },
  suggestionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.primaryLighter,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  suggestionPhone: {
    fontSize: 11,
    fontWeight: '500',
    color: color.primaryColor,
    marginTop: 1,
  },
  suggestionAddress: {
    fontSize: 10,
    color: '#9A9A9A',
    marginTop: 2,
  },
  addCustomerBox: {
    backgroundColor: color.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: color.primaryLighter,
  },
  addCustomerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: color.primaryColor,
  },
  addCustomerSubtitle: {
    fontSize: 11,
    color: '#6A6A6A',
    marginTop: 2,
    marginBottom: 8,
  },
  addCustomerButton: {
    marginTop: 2,
    borderRadius: 10,
    backgroundColor: color.primaryColor,
    height: 38,
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
  paymentSection: {
    marginTop: 4,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: color.primaryColor,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  methodPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  methodPickerText: {
    fontSize: 13,
    color: '#333',
  },
});
