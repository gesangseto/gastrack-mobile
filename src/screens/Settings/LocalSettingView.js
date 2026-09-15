import {useEffect, useState} from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {fetchCurrencies} from '../../resource/Currency';
import {
  getEndpoint,
  getLocalSetting,
  setEndpoint,
  setLocalSetting,
} from '../../storage';
import Icon from '@react-native-vector-icons/lucide';
import Toast from 'react-native-toast-message';

const LocalSettingView = ({navigation, route}) => {
  const local = getLocalSetting() || {};
  const [endpoint, setEndpointState] = useState(getEndpoint());
  const [currencies, setCurrencies] = useState([]);
  const [currencyTo, setCurrencyTo] = useState(local.currency_to || 'IDR');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrencies().then(list => setCurrencies(list));
  }, []);

  const saveEndpoint = () => {
    const ep = (endpoint || '').trim().replace(/\/+$/, '');
    if (!ep) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Endpoint wajib diisi',
      });
      return;
    }
    const normalized = /^https?:\/\//i.test(ep) ? ep : 'http://' + ep;
    setSaving(true);
    setEndpoint(normalized);
    setEndpointState(normalized);
    setSaving(false);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Endpoint tersimpan',
    });
  };

  const selectCurrency = item => {
    setCurrencyTo(item.code);
    setLocalSetting({currency_to: item.code});
    setPickerOpen(false);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Currency tujuan disimpan',
    });
  };

  const currencyLabel = code => {
    const c = currencies.find(it => it.code === code);
    return c ? `${c.code} · ${c.symbol}` : code;
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Local Setting" />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Endpoint Api Backend */}
          <Text style={styles.sectionTitle}>Endpoint Api Backend</Text>
          <Text style={styles.sectionDesc}>
            Alamat server Backend yang dipakai aplikasi untuk komunikasi data.
          </Text>
          <InputText
            label="Endpoint"
            required={true}
            showError={true}
            value={endpoint}
            onChangeText={setEndpointState}
            placeholder="http://192.168.2.199:8001"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TouchableOpacity
            onPress={saveEndpoint}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Menyimpan...' : 'Simpan Endpoint'}
            </Text>
          </TouchableOpacity>

          {/* Currency tujuan */}
          <Text style={[styles.sectionTitle, {marginTop: 28}]}>Currency</Text>
          <Text style={styles.sectionDesc}>
            Mata uang tujuan untuk konversi harga (mis. belanja di Jepang maka
            pilih JPY).
          </Text>

          <TouchableOpacity
            style={styles.currencyBox}
            onPress={() => setPickerOpen(true)}>
            <View>
              <Text style={styles.currencyLabel}>Currency Tujuan</Text>
              <Text style={styles.currencyValue}>
                {currencyLabel(currencyTo)}
              </Text>
            </View>
            <Icon name="chevron-down" size={18} color="#999" />
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
              <Text style={styles.modalTitle}>Pilih Currency Tujuan</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Icon name="x" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: 400}}>
              {currencies.length === 0 && (
                <Text style={styles.modalEmpty}>
                  Tidak ada data currency. Cek endpoint backend di atas.
                </Text>
              )}
              {currencies.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.currencyItem}
                  onPress={() => selectCurrency(item)}>
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

export default LocalSettingView;

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
  currencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  currencyLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
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
