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
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getEndpoint, setEndpoint} from '../../storage';
import Toast from 'react-native-toast-message';

const LocalSettingView = ({navigation, route}) => {
  const [endpoint, setEndpointState] = useState(getEndpoint());
  const [saving, setSaving] = useState(false);

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
        </ScrollView>
      </View>
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
});
