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
import {updateCustomer} from '../../resource/Customer';
import {getSysConfig} from '../../storage';

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

const CustomerEdit = ({navigation, route}) => {
  const phonePrefix = getSysConfig()?.country_code || '+62';
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    pic: '',
    phone: '',
    phone_alt: '',
    email: '',
    address: '',
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route?.params?.item) {
      let item = route.params.item;
      setFormData({
        id: item.id || null,
        name: item.name || '',
        pic: item.pic || '',
        phone: toLocalDigits(item.phone),
        phone_alt: toLocalDigits(item.phone_alt),
        email: item.email || '',
        address: item.address || '',
        status: item.status || 'Active',
      });
    }
  }, []);

  const setField = (key, value) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const handleSave = async () => {
    if (!formData.name) {
      return;
    }
    setSaving(true);
    let response = await updateCustomer({
      id: formData.id,
      name: formData.name,
      pic: formData.pic || null,
      phone: formData.phone,
      phone_alt: formData.phone_alt || null,
      email: formData.email || null,
      address: formData.address || null,
      status: formData.status,
    });
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
      <Header title="Edit Customer" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 40}}>
        <InputText
          label="Nama"
          required={true}
          value={formData.name}
          onChangeText={text => setField('name', text)}
          placeholder="Nama customer"
        />
        <InputText
          label="PIC"
          value={formData.pic}
          onChangeText={text => setField('pic', text)}
          placeholder="Nama PIC"
        />
        <InputText
          label="No. HP"
          required={true}
          prefix={phonePrefix}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={text => setField('phone', text)}
          placeholder="81234567890"
        />
        <InputText
          label="No. HP Alternatif"
          prefix={phonePrefix}
          keyboardType="phone-pad"
          value={formData.phone_alt}
          onChangeText={text => setField('phone_alt', text)}
          placeholder="81234567891"
        />
        <InputText
          label="Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={text => setField('email', text)}
          placeholder="email@example.com"
        />
        <InputText
          label="Alamat"
          value={formData.address}
          onChangeText={text => setField('address', text)}
          placeholder="Alamat customer"
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

export default CustomerEdit;

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