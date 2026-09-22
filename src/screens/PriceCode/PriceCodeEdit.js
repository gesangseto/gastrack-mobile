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
import {
  createPriceCode,
  updatePriceCode,
} from '../../resource/PriceCode';

const PriceCodeEdit = ({navigation, route}) => {
  // Tanpa param `item` = mode tambah price code baru.
  const isEdit = !!route?.params?.item;
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    code: '',
    number: '',
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
        number: item.number != null ? String(item.number) : '',
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
    if (!formData.name || !formData.code || formData.number === '') {
      return;
    }
    setSaving(true);
    const payload = {
      name: formData.name,
      code: formData.code,
      number: Number(formData.number),
      status: formData.status,
    };
    let response = isEdit
      ? await updatePriceCode({id: formData.id, ...payload})
      : await createPriceCode(payload);
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
      <Header title={isEdit ? 'Edit Price Code' : 'Tambah Price Code'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 40}}>
        <InputText
          label="Nama"
          required={true}
          value={formData.name}
          onChangeText={text => setField('name', text)}
          placeholder="Contoh: Kode A"
        />
        <InputText
          label="Kode"
          required={true}
          value={formData.code}
          onChangeText={text => setField('code', text)}
          placeholder="a"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          Kode 1 huruf alphabet yang mewakili digit harga: a=0, b=1, c=2, d=3,
          e=4, f=5, g=6, h=7, i=8, j=9.
        </Text>
        <InputText
          label="Angka"
          required={true}
          keyboardType="decimal-pad"
          value={formData.number}
          onChangeText={text => setField('number', text)}
          placeholder="0"
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

export default PriceCodeEdit;

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
  hint: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: -6,
    marginBottom: 12,
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