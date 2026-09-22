import {useEffect, useState} from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {PRICE_UNIT_LIST} from '../../constant/priceUnit';
import Header from '../../layouts/Header';
import {fetchCountries} from '../../resource/Country';
import {updateSysConfig} from '../../resource/Configuration';
import {getSysConfig, setSysConfig} from '../../storage';
import Icon from '@react-native-vector-icons/lucide';
import Toast from 'react-native-toast-message';

const AppSettingView = ({navigation, route}) => {
  const config = getSysConfig() || {};
  const [form, setForm] = useState({
    identity_name: config.identity_name || '',
    identity_number: config.identity_number || '',
    identity_phone: config.identity_phone || '',
    identity_address: config.identity_address || '',
    country: config.country || 'Indonesia',
    country_code: config.country_code || '+62',
    currency: config.currency || 'IDR',
    price_unit_code: config.price_unit_code || 'none',
  });
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCountries().then(list => {
      const uniq = (list || []).filter(it => it.name);
      setCountries(uniq);
      // Currency unik (satu negara bisa pakai mata uang sama, mis. USD)
      const seen = {};
      const cur = uniq.filter(it => {
        if (!it.currency_code || seen[it.currency_code]) {
          return false;
        }
        seen[it.currency_code] = true;
        return true;
      });
      setCurrencies(cur);
    });
  }, []);

  const save = async () => {
    if (!form.country_code) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Kode negara wajib diisi',
      });
      return;
    }
    setSaving(true);
    const payload = {
      users_name: config.users_name,
      identity_name: form.identity_name,
      identity_number: form.identity_number,
      identity_phone: form.identity_phone,
      identity_address: form.identity_address,
      country: form.country,
      country_code: form.country_code,
      currency: form.currency,
      price_unit_code: form.price_unit_code,
    };
    const updated = await updateSysConfig(payload);
    setSaving(false);
    if (updated) {
      // Perbarui MMKV agar country_code langsung terpakai (mis. prefix +62)
      setSysConfig({...config, ...payload});
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Konfigurasi tersimpan',
      });
      RootNavigation.goBack();
    }
  };

  const currencyLabel = code => {
    const c = currencies.find(it => it.currency_code === code);
    return c ? `${c.currency_code} · ${c.currency_symbol}` : code;
  };

  const filteredCountries = countries.filter(it => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) {return true;}
    return (
      (it.name || '').toLowerCase().includes(q) ||
      (it.code || '').toLowerCase().includes(q) ||
      (it.currency_code || '').toLowerCase().includes(q)
    );
  });

  // Pilih negara → isi country (nama), country_code (kode telp), currency
  // (kode mata uang) — keduanya non-editable, otomatis mengikuti negara
  const selectCountry = item => {
    setForm(prev => ({
      ...prev,
      country: item.name,
      country_code: item.country_code || prev.country_code,
      currency: item.currency_code || prev.currency,
    }));
    setCountryPickerOpen(false);
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Setting" />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>
          <Text style={styles.sectionDesc}>
            Konfigurasi ini dikirim ke Backend (sys_configuration_mst) dan
            dipakai aplikasi (mis. kode negara untuk nomor HP).
          </Text>

          <InputText
            label="Nama Perusahaan"
            value={form.identity_name}
            onChangeText={value =>
              setForm({...form, identity_name: value})
            }
            placeholder="Nama perusahaan / identity"
          />
          <InputText
            label="Nomor Identitas"
            value={form.identity_number}
            onChangeText={value =>
              setForm({...form, identity_number: value})
            }
            placeholder="Nomor identitas perusahaan"
          />
          <InputText
            label="No. HP"
            keyboardType="phone-pad"
            value={form.identity_phone}
            onChangeText={value => setForm({...form, identity_phone: value})}
            placeholder="08xxxxxxxxxx"
          />
          <InputText
            label="Alamat"
            value={form.identity_address}
            onChangeText={value =>
              setForm({...form, identity_address: value})
            }
            placeholder="Alamat perusahaan"
          />
          {/* Negara */}
          <Text style={styles.fieldLabel}>Negara</Text>
          <TouchableOpacity
            style={styles.currencyBox}
            onPress={() => {
              setCountrySearch('');
              setCountryPickerOpen(true);
            }}>
            <Text style={styles.currencyValue}>{form.country}</Text>
            <Icon name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>

          {/* Kode Negara — otomatis dari negara, non-editable */}
          <Text style={styles.fieldLabel}>Kode Negara</Text>
          <View style={[styles.currencyBox, styles.readOnlyBox]}>
            <Text style={styles.currencyValue}>
              {form.country_code || '-'}
            </Text>
            <Icon name="lock" size={14} color="#B0B0B0" />
          </View>

          {/* Currency — otomatis dari negara, non-editable */}
          <Text style={styles.fieldLabel}>Currency</Text>
          <View style={[styles.currencyBox, styles.readOnlyBox]}>
            <Text style={styles.currencyValue}>
              {currencyLabel(form.currency)}
            </Text>
            <Icon name="lock" size={14} color="#B0B0B0" />
          </View>
          <Text style={styles.fieldHint}>
            Kode negara & currency otomatis mengikuti negara yang dipilih.
          </Text>

          {/* Unit kode harga (selling) */}
          <Text style={styles.fieldLabel}>Unit Kode Harga (Selling)</Text>
          <View style={styles.unitWrap}>
            {PRICE_UNIT_LIST.map(u => {
              const active = form.price_unit_code === u.value;
              return (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.unitChip, active && styles.unitChipActive]}
                  onPress={() =>
                    setForm({...form, price_unit_code: u.value})
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
            Unit selling price global (sys_configuration); cost price memakai
            unit dari session.
          </Text>

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </Text>
          </TouchableOpacity>
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
                placeholder="Cari negara / kode..."
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
                  style={styles.currencyItem}
                  onPress={() => selectCountry(item)}>
                  <View style={styles.currencyItemLeft}>
                    <Text style={styles.currencyItemCode}>{item.name}</Text>
                    <Text style={styles.currencyItemName}>
                      {item.code} · {item.country_code} · {item.currency_code}
                    </Text>
                  </View>
                  <Text style={styles.currencyItemSymbol}>
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

export default AppSettingView;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
  },
  sectionTitle: {
    color: color.primaryColor,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  fieldLabel: {
    marginBottom: 6,
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 15,
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
    backgroundColor: '#fff',
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
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  readOnlyBox: {
    backgroundColor: '#F4F4F8',
    borderColor: '#E5E5E5',
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
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
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    paddingVertical: 24,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  currencyItemLeft: {
    flex: 1,
  },
  currencyItemCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  currencyItemName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  currencyItemSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: color.primaryColor,
  },
});
