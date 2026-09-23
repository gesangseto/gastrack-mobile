import {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {createCountry, updateCountry} from '../../resource/Country';

const CountryEdit = ({navigation, route}) => {
  // Tanpa param `item` = mode tambah negara baru.
  const isEdit = !!route?.params?.item;
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    code: '',
    country_code: '',
    currency_code: '',
    currency_symbol: '',
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route?.params?.item) {
      let item = route.params.item;
      setFormData({
        id: item.id || null,
        name: item.name || '',
        code: item.code || '',
        country_code: item.country_code || '',
        currency_code: item.currency_code || '',
        currency_symbol: item.currency_symbol || '',
        status: item.status || 'Active',
      });
    }
    // Hanya saat mount: form diisi dari item yang dikirim via route params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const handleSave = async () => {
    if (!formData.name) {
      return;
    }
    setSaving(true);
    const payload = {
      name: formData.name,
      code: formData.code || null,
      country_code: formData.country_code || null,
      currency_code: formData.currency_code || null,
      currency_symbol: formData.currency_symbol || null,
      status: formData.status,
    };
    let response = isEdit
      ? await updateCountry({id: formData.id, ...payload})
      : await createCountry(payload);
    setSaving(false);
    if (response) {
      RootNavigation.goBack();
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={isEdit ? 'Edit Negara' : 'Tambah Negara'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 40}}>
        <InputText
          label="Nama"
          required={true}
          value={formData.name}
          onChangeText={text => setField('name', text)}
          placeholder="Nama negara"
        />
        <InputText
          label="Kode"
          value={formData.code}
          onChangeText={text => setField('code', text)}
          placeholder="ID"
          autoCapitalize="characters"
        />
        <InputText
          label="Kode Negara (Telepon)"
          value={formData.country_code}
          onChangeText={text => setField('country_code', text)}
          placeholder="+62"
        />
        <InputText
          label="Kode Mata Uang"
          value={formData.currency_code}
          onChangeText={text => setField('currency_code', text)}
          placeholder="IDR"
          autoCapitalize="characters"
        />
        <InputText
          label="Simbol Mata Uang"
          value={formData.currency_symbol}
          onChangeText={text => setField('currency_symbol', text)}
          placeholder="Rp"
        />
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {['Active', 'Inactive'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setField('status', status)}
              style={[
                styles.statusChip,
                formData.status === status && styles.statusChipActive,
              ]}>
              <Text
                style={[
                  styles.statusChipText,
                  formData.status === status && styles.statusChipTextActive,
                ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CountryEdit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 30,
    paddingTop: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: color.primaryLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipActive: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  statusChipText: {
    color: '#666',
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: color.white,
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
  saveButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});