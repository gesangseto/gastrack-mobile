import Icon from '@react-native-vector-icons/lucide';
import {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {
  sendTestNotificationChannel,
  testNotificationChannelConnection,
  updateNotificationChannel,
} from '../../resource/NotificationChannel';
import {
  deleteWhatsAppSession,
  fetchWhatsAppQR,
  fetchWhatsAppStatus,
} from '../../resource/Whatsapp';

const KIRIMI_EMPTY = {
  user_code: '',
  secret: '',
  device_id: '',
  public_base_url: '',
};

const parseKirimi = apiKey => {
  try {
    const parsed = JSON.parse(apiKey || '{}');
    return {
      user_code: parsed.user_code || '',
      secret: parsed.secret || '',
      device_id: parsed.device_id || '',
      public_base_url: parsed.public_base_url || '',
    };
  } catch (e) {
    return {...KIRIMI_EMPTY};
  }
};

const NotificationChannelEdit = ({route}) => {
  const item = route?.params?.item || {};
  const code = item.code || '';
  const isDefault = code === 'default';
  const isKirimi = code === 'kirimi';

  const [form, setForm] = useState({
    name: item.name || '',
    description: item.description || '',
    api_key: item.api_key || '',
    sender: item.sender || '',
    status: item.status || 'Inactive',
  });
  const [kirimi, setKirimi] = useState(parseKirimi(item.api_key));
  const [saving, setSaving] = useState(false);

  // Koneksi WhatsApp (hanya channel default)
  const [qr, setQr] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [waLoading, setWaLoading] = useState(false);
  const [destroying, setDestroying] = useState(false);

  // Test channel
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testTo, setTestTo] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const qrTimer = useRef(null);

  const loadWhatsapp = async () => {
    setWaLoading(true);
    const status = await fetchWhatsAppStatus();
    if (status) {setWaStatus(status);}
    if (!status || !status.connected) {
      const qrData = await fetchWhatsAppQR();
      if (qrData) {
        setWaStatus(prev => ({...prev, ...qrData}));
        if (qrData.qr_base64) {setQr(qrData.qr_base64);}
      }
    } else {
      setQr(null);
    }
    setWaLoading(false);
  };

  useEffect(() => {
    if (isDefault && form.status === 'Active') {
      loadWhatsapp();
    }
    return () => {
      if (qrTimer.current) {clearTimeout(qrTimer.current);}
    };
    // Hanya saat layar dibuka — refresh manual tersedia lewat tombol.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDeleteSession = () => {
    Alert.alert(
      'Hapus Session WhatsApp',
      'Anda perlu scan QR lagi untuk menghubungkan WhatsApp. Lanjutkan?',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setDestroying(true);
            const ok = await deleteWhatsAppSession();
            setDestroying(false);
            if (ok) {
              setQr(null);
              setWaStatus(null);
              await loadWhatsapp();
            }
          },
        },
      ],
    );
  };

  const validationError = () => {
    if (!form.name.trim()) {return 'Nama channel wajib diisi.';}
    if (isKirimi) {
      if (!kirimi.user_code.trim() || !kirimi.secret.trim() || !kirimi.device_id.trim()) {
        return 'User Code, Secret Key, dan Device ID wajib diisi.';
      }
      return null;
    }
    if (!isDefault && !form.api_key.trim()) {
      return 'API Key wajib diisi.';
    }
    return null;
  };

  const save = async () => {
    const error = validationError();
    if (error) {
      Alert.alert('Data belum lengkap', error);
      return;
    }
    const payload = {
      id: item.id,
      name: form.name.trim(),
      description: form.description,
      status: form.status,
    };
    if (isKirimi) {
      const creds = {
        user_code: kirimi.user_code.trim(),
        secret: kirimi.secret.trim(),
        device_id: kirimi.device_id.trim(),
      };
      if (kirimi.public_base_url.trim()) {
        creds.public_base_url = kirimi.public_base_url.trim();
      }
      payload.api_key = JSON.stringify(creds);
    } else if (!isDefault) {
      payload.api_key = form.api_key.trim();
      payload.sender = form.sender.trim();
    }
    setSaving(true);
    const saved = await updateNotificationChannel(payload);
    setSaving(false);
    if (!saved) {return;}

    if (isDefault && form.status === 'Active') {
      // Backend memulai socket setelah channel Active — QR menyusul.
      if (qrTimer.current) {clearTimeout(qrTimer.current);}
      qrTimer.current = setTimeout(loadWhatsapp, 1500);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testNotificationChannelConnection(code);
    setTesting(false);
    setTestResult(res || {error: true, message: 'Gagal menghubungi server.'});
  };

  const sendTest = async () => {
    if (!testTo.trim()) {
      Alert.alert('Nomor tujuan wajib diisi', 'Isi nomor untuk pesan uji.');
      return;
    }
    setSendingTest(true);
    setSendResult(null);
    const res = await sendTestNotificationChannel({
      code,
      to: testTo.trim(),
      message: testMessage.trim() || undefined,
    });
    setSendingTest(false);
    setSendResult(res || {error: true, message: 'Gagal menghubungi server.'});
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={item.name || 'Channel'} />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Code read-only */}
          <View style={styles.readonlyBox}>
            <View style={styles.flex}>
              <Text style={styles.readonlyLabel}>Code</Text>
              <Text style={styles.readonlyValue}>{code || '-'}</Text>
            </View>
            <Icon name="lock" size={14} color="#B0B0B0" />
          </View>
          <Text style={styles.hint}>
            Code adalah kunci integrasi dan tidak dapat diubah.
          </Text>

          <InputText
            label="Nama Channel"
            required
            showError
            value={form.name}
            onChangeText={v => setForm({...form, name: v})}
            placeholder="Nama channel"
          />
          <InputText
            label="Deskripsi"
            value={form.description}
            onChangeText={v => setForm({...form, description: v})}
            placeholder="Deskripsi channel"
            multiline
            numberOfLines={3}
          />

          {/* Kredensial per channel */}
          {isDefault && (
            <>
              <Text style={styles.sectionTitle}>Koneksi WhatsApp (Baileys)</Text>
              {form.status !== 'Active' ? (
                <View style={styles.notice}>
                  <Icon name="info" size={14} color="#B45309" />
                  <Text style={styles.noticeText}>
                    Channel Inactive — aktifkan Status lalu simpan untuk
                    menghubungkan WhatsApp.
                  </Text>
                </View>
              ) : (
                <View style={styles.qrCard}>
                  <Text style={styles.qrState}>
                    {waStatus?.connected
                      ? 'WhatsApp terhubung.'
                      : waLoading
                      ? 'Memuat status WhatsApp...'
                      : waStatus?.qr_expired
                      ? 'QR sudah kedaluwarsa. Muat ulang QR.'
                      : 'Scan QR berikut dari WhatsApp di HP nomor pengirim.'}
                  </Text>
                  {qr && !waStatus?.connected ? (
                    <Image source={{uri: qr}} style={styles.qrImage} />
                  ) : null}
                  <View style={styles.qrActions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      disabled={waLoading}
                      onPress={loadWhatsapp}>
                      <Icon name="refresh-cw" size={14} color={color.primaryColor} />
                      <Text style={styles.secondaryBtnText}>
                        {waLoading ? 'Memuat...' : 'Muat QR / Cek Status'}
                      </Text>
                    </TouchableOpacity>
                    {waStatus?.connected && (
                      <TouchableOpacity
                        style={styles.dangerBtn}
                        disabled={destroying}
                        onPress={onDeleteSession}>
                        <Text style={styles.dangerBtnText}>
                          {destroying ? 'Menghapus...' : 'Hapus Session'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          {isKirimi ? (
            <>
              <Text style={styles.sectionTitle}>Kredensial Kirimi</Text>
              <InputText
                label="User Code"
                required
                showError
                value={kirimi.user_code}
                onChangeText={v => setKirimi({...kirimi, user_code: v})}
                placeholder="User code dari dashboard Kirimi"
                autoCapitalize="none"
              />
              <InputText
                label="Secret Key"
                required
                showError
                value={kirimi.secret}
                onChangeText={v => setKirimi({...kirimi, secret: v})}
                placeholder="Secret key API Kirimi"
                autoCapitalize="none"
                secureTextEntry
              />
              <InputText
                label="Device ID"
                required
                showError
                value={kirimi.device_id}
                onChangeText={v => setKirimi({...kirimi, device_id: v})}
                placeholder="ID device WhatsApp di dashboard Kirimi"
                autoCapitalize="none"
              />
              <InputText
                label="Public Base URL (opsional)"
                value={kirimi.public_base_url}
                onChangeText={v =>
                  setKirimi({...kirimi, public_base_url: v})
                }
                placeholder="https://domain-aplikasi"
                autoCapitalize="none"
                keyboardType="url"
              />
            </>
          ) : !isDefault ? (
            <>
              <InputText
                label="API Key"
                required
                showError
                value={form.api_key}
                onChangeText={v => setForm({...form, api_key: v})}
                placeholder="Kredensial API (mis. swk_live_… untuk SendWia)"
                autoCapitalize="none"
                multiline
                numberOfLines={2}
              />
              <InputText
                label="Sender (Account ID) — opsional"
                value={form.sender}
                onChangeText={v => setForm({...form, sender: v})}
                placeholder="ID akun pengirim acc_xxx"
                autoCapitalize="none"
              />
            </>
          ) : null}

          {/* Status channel = gate koneksi & prioritas kirim */}
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchLabel}>Status</Text>
              <Text style={styles.switchHint}>
                {form.status === 'Active'
                  ? 'Channel dipakai untuk mengirim notifikasi.'
                  : 'Channel tidak dipakai untuk mengirim notifikasi.'}
              </Text>
            </View>
            <Switch
              value={form.status === 'Active'}
              onValueChange={v =>
                setForm({...form, status: v ? 'Active' : 'Inactive'})
              }
              trackColor={{false: '#D1D5DB', true: color.primaryColor}}
              thumbColor={color.white}
            />
          </View>

          {!!item.documentation && (
            <>
              <Text style={styles.sectionTitle}>Petunjuk Pengisian</Text>
              <View style={styles.docBox}>
                <Text style={styles.docText}>{item.documentation}</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={save}
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabled]}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Menyimpan...' : 'Simpan Channel'}
            </Text>
          </TouchableOpacity>

          {/* Test channel */}
          <Text style={styles.sectionTitle}>Test Channel</Text>
          <TouchableOpacity
            onPress={testConnection}
            disabled={testing}
            style={[styles.secondaryBtnWide, testing && styles.disabled]}>
            <Icon name="plug-zap" size={15} color={color.primaryColor} />
            <Text style={styles.secondaryBtnText}>
              {testing ? 'Memeriksa...' : 'Test Koneksi'}
            </Text>
          </TouchableOpacity>
          {!!testResult?.message && (
            <Text
              style={[
                styles.resultText,
                testResult.error ? styles.resultError : styles.resultOk,
              ]}>
              {testResult.message}
            </Text>
          )}

          <InputText
            label="Nomor Tujuan"
            value={testTo}
            onChangeText={setTestTo}
            placeholder="628xxxxxxxxxx"
            keyboardType="phone-pad"
          />
          <InputText
            label="Pesan Uji (opsional)"
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Teks pesan uji"
          />
          <TouchableOpacity
            onPress={sendTest}
            disabled={sendingTest}
            style={[styles.secondaryBtnWide, sendingTest && styles.disabled]}>
            <Icon name="send" size={15} color={color.primaryColor} />
            <Text style={styles.secondaryBtnText}>
              {sendingTest ? 'Mengirim...' : 'Send Test Message'}
            </Text>
          </TouchableOpacity>
          {!!sendResult?.message && (
            <Text
              style={[
                styles.resultText,
                sendResult.error ? styles.resultError : styles.resultOk,
              ]}>
              {sendResult.message}
            </Text>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </View>
  );
};

export default NotificationChannelEdit;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: color.white},
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  flex: {flex: 1, minWidth: 0},
  readonlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    backgroundColor: '#F4F4F8',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readonlyLabel: {fontSize: 10, color: '#9A9A9A', fontWeight: '500'},
  readonlyValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '700',
    marginTop: 2,
  },
  hint: {
    fontSize: 10.5,
    color: '#9A9A9A',
    marginTop: 5,
    marginBottom: 14,
    lineHeight: 15,
  },
  sectionTitle: {
    color: color.primaryColor,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 11,
    marginBottom: 14,
  },
  noticeText: {flex: 1, fontSize: 11, lineHeight: 16, color: '#92400E'},
  qrCard: {
    backgroundColor: color.primaryLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  qrState: {
    fontSize: 11.5,
    color: '#4A3F6B',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 16,
  },
  qrImage: {width: 200, height: 200, resizeMode: 'contain'},
  qrActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secondaryBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: color.primaryLight,
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 6,
  },
  secondaryBtnText: {fontSize: 11, fontWeight: '600', color: color.primaryColor},
  dangerBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dangerBtnText: {fontSize: 11, fontWeight: '700', color: '#EF4444'},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.primaryLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  switchLabel: {fontSize: 13, fontWeight: '700', color: '#333'},
  switchHint: {fontSize: 10.5, color: '#8A8A97', marginTop: 2, lineHeight: 15},
  docBox: {
    backgroundColor: '#F8F7FC',
    borderWidth: 1,
    borderColor: '#EAE6F6',
    borderRadius: 12,
    padding: 11,
    marginBottom: 12,
  },
  docText: {fontSize: 10.5, lineHeight: 16, color: '#6B6480'},
  saveButton: {
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {color: color.white, fontSize: 15, fontWeight: 'bold'},
  disabled: {opacity: 0.7},
  resultText: {fontSize: 11, marginTop: 4, marginBottom: 10, lineHeight: 16},
  resultOk: {color: '#047857'},
  resultError: {color: '#B91C1C'},
  bottomSpace: {height: 30},
});
