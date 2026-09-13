import {useState} from 'react';
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
import {getProfile, setProfile} from '../../storage';
import Toast from 'react-native-toast-message';
import $axios from '../../config/Api';

const ProfileView = ({navigation, route}) => {
  const profile = getProfile() || {};
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.full_name || !form.email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nama dan email wajib diisi',
      });
      return;
    }
    setSaving(true);
    try {
      const res = await $axios.post('/api/v1/master/user', {
        id: profile.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
      });
      const data = res.data;
      if (data.error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message,
        });
        setSaving(false);
        return;
      }
      // Perbarui profile di MMKV agar tampilan tetap sinkron
      setProfile({...profile, ...form});
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profil tersimpan',
      });
      setSaving(false);
      RootNavigation.goBack();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: e?.message || e,
      });
      setSaving(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Profile" />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Informasi Login User</Text>
          <Text style={styles.sectionDesc}>
            Data ini tersimpan di mst_user dan dipakai untuk login aplikasi.
          </Text>

          <InputText
            label="Username"
            value={profile.username || ''}
            editable={false}
            placeholder="Username"
          />
          <InputText
            label="Nama Lengkap"
            required={true}
            showError={true}
            value={form.full_name}
            onChangeText={value => setForm({...form, full_name: value})}
            placeholder="Masukkan nama lengkap"
          />
          <InputText
            label="Email"
            required={true}
            showError={true}
            value={form.email}
            onChangeText={value => setForm({...form, email: value})}
            placeholder="Masukkan email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputText
            label="No. HP"
            value={form.phone}
            onChangeText={value => setForm({...form, phone: value})}
            placeholder="Masukkan nomor HP"
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default ProfileView;

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
});