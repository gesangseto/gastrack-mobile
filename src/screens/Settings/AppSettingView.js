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
import Header from '../../layouts/Header';
import {fetchCurrencies} from '../../resource/Currency';
import {updateSysConfig} from '../../resource/Configuration';
import {getSysConfig, setSysConfig} from '../../storage';
import Icon from '@react-native-vector-icons/lucide';
import Toast from 'react-native-toast-message';

const AppSettingView = ({navigation, route}) => {
  const config = getSysConfig() || {};
  const [form, setForm] = useState({
    identity_name: config.identity_name || '',
    identity_number: config.identity_number || '',
    country: config.country || 'Indonesia',
    country_code: config.country_code || '+62',
    currency: config.currency || 'IDR',
    entity_address: config.entity_address || '',
  });
  const [currencies, setCurrencies] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrencies().then(list => setCurrencies(list));
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
      country: form.country,
      country_code: form.country_code,
      currency: form.currency,
      entity_address: form.entity_address,
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
    const c = currencies.find(it => it.code === code);
    return c ? `${c.code} · ${c.symbol}` : code;
  };

  const filteredCurrencies = currencies.filter(it => {
    const q = currencySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (it.code || '').toLowerCase().includes(q) ||
      (it.name || '').toLowerCase().includes(q) ||
      (it.country || '').toLowerCase().includes(q)
    );
  });

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
            label="Negara"
            value={form.country}
            onChangeText={value => setForm({...form, country: value})}
            placeholder="Indonesia"
          />
          <InputText
            label="Kode Negara"
            required={true}
            showError={true}
            value={form.country_code}
            onChangeText={value =>
              setForm({...form, country_code: value})
            }
            placeholder="+62"
          />

          {/* Currency */}
          <Text style={styles.fieldLabel}>Currency</Text>
          <TouchableOpacity
            style={styles.currencyBox}
            onPress={() => {
              setCurrencySearch('');
              setPickerOpen(true);
            }}>
            <Text style={styles.currencyValue}>
              {currencyLabel(form.currency)}
            </Text>
            <Icon name="chevron-down" size={18} color="#999" />
          </TouchableOpacity>

          <InputText
            label="Alamat"
            value={form.entity_address}
            onChangeText={value =>
              setForm({...form, entity_address: value})
            }
            placeholder="Alamat perusahaan"
          />
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

      {/* Modal pilih currency */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Currency</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Icon name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Icon name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                placeholder="Cari kode / nama / negara..."
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <ScrollView style={{maxHeight: 400}}>
              {currencies.length === 0 && (
                <Text style={styles.modalEmpty}>
                  Tidak ada data currency. Cek endpoint backend (Local Setting).
                </Text>
              )}
              {currencies.length > 0 && filteredCurrencies.length === 0 && (
                <Text style={styles.modalEmpty}>Tidak ditemukan.</Text>
              )}
              {filteredCurrencies.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.currencyItem}
                  onPress={() => {
                    setForm({...form, currency: item.code});
                    setPickerOpen(false);
                  }}>
                  <View style={styles.currencyItemLeft}>
                    <Text style={styles.currencyItemCode}>{item.code}</Text>
                    <Text style={styles.currencyItemName}>
                      {item.name} · {item.country}
                    </Text>
                  </View>
                  <Text style={styles.currencyItemSymbol}>{item.symbol}</Text>
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