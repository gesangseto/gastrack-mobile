import Icon from '@react-native-vector-icons/lucide';
import {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import color from '../../constant/color';
import {
  confirmStaging,
  discardStaging,
  getStagingList,
} from '../../resource/WaChat';

// Tab "Staging" — daftar item kandidat dari chat WhatsApp.
// Admin lengkapi 3 field (barang, qty, harga) lalu konfirmasi -> jadi item Draft.
const StagingTab = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null); // staging yang sedang dikonfirmasi
  const [form, setForm] = useState({
    item_name: '',
    quantity: '1',
    cost_code: '',
    selling_code: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getStagingList({status: 'pending'});
    setList(data || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openConfirm = row => {
    setEdit(row);
    setForm({
      item_name: row.item_name || '',
      quantity: String(row.quantity || 1),
      cost_code: row.cost_code || '',
      selling_code: row.selling_code || '',
    });
  };

  const submit = async () => {
    if (!form.item_name.trim()) {
      Alert.alert('Perhatian', 'Nama barang wajib diisi.');
      return;
    }
    if (!form.selling_code.trim()) {
      Alert.alert('Perhatian', 'Harga Jual wajib diisi.');
      return;
    }
    setSaving(true);
    const res = await confirmStaging({
      id: edit.id,
      item_name: form.item_name.trim(),
      quantity: Number(form.quantity) || 1,
      // Harga Beli opsional — kalau kosong, backend menyamakan dengan Harga Jual.
      cost_code: form.cost_code.trim() ? form.cost_code.trim().toUpperCase() : undefined,
      selling_code: form.selling_code.trim().toUpperCase(),
      customer_name: edit.customer_name || undefined,
    });
    setSaving(false);
    if (res) {
      setEdit(null);
      load();
    }
  };

  const discard = row => {
    Alert.alert(
      'Buang staging?',
      `Data dari ${row.customer_name || row.phone} akan dibuang (bukan titipan valid).`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Buang',
          style: 'destructive',
          onPress: async () => {
            const ok = await discardStaging(row.id, 'dibuang admin');
            if (ok) load();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Staging Item</Text>
        <Text style={styles.subtitle}>
          {list.length} item menunggu konfirmasi
        </Text>
      </View>

      {loading && !list.length ? (
        <ActivityIndicator style={styles.center} color={color.primaryColor} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.waTag}>
                  <Icon name="message-circle" size={12} color="#fff" />
                  <Text style={styles.waTagText}>WA</Text>
                </View>
                <Text style={styles.cardCustomer} numberOfLines={1}>
                  {item.customer_name || item.customer_name_db || item.phone}
                </Text>
              </View>
              <Text style={styles.cardPhone}>{item.phone || '-'}</Text>

              {item.raw_message ? (
                <View style={styles.rawBox}>
                  <Text style={styles.rawText} numberOfLines={3}>
                    “{item.raw_message}”
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  Barang: {item.item_name || '(belum diisi)'}
                </Text>
                <Text style={styles.meta}>Qty: {item.quantity || 1}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.discardBtn}
                  onPress={() => discard(item)}>
                  <Text style={styles.discardText}>Buang</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => openConfirm(item)}>
                  <Icon name="check" size={16} color="#fff" />
                  <Text style={styles.confirmText}>Konfirmasi</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Tidak ada item staging.{'\n'}Item dari chat WA akan muncul di sini.
            </Text>
          }
        />
      )}

      {/* Modal konfirmasi -> item Draft */}
      <Modal visible={!!edit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Konfirmasi Item</Text>
            <Text style={styles.modalNote}>
              Lengkapi data. Setelah dikonfirmasi, item masuk{' '}
              <Text style={styles.bold}>Item Registry (Draft)</Text>.
            </Text>

            <Text style={styles.label}>Customer</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={edit?.customer_name || edit?.phone || '-'}
              editable={false}
            />

            <Text style={styles.label}>Nama Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="cth: Tas hitam"
              value={form.item_name}
              onChangeText={t => setForm(f => ({...f, item_name: t}))}
              autoFocus
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={form.quantity}
              onChangeText={t => setForm(f => ({...f, quantity: t}))}
            />

            <View style={styles.priceRow}>
              <View style={styles.flex}>
                <Text style={styles.label}>Harga Jual *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ADB"
                  autoCapitalize="characters"
                  value={form.selling_code}
                  onChangeText={t => setForm(f => ({...f, selling_code: t}))}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>Harga Beli (opsional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="sama dgn jual"
                  autoCapitalize="characters"
                  value={form.cost_code}
                  onChangeText={t => setForm(f => ({...f, cost_code: t}))}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEdit(null)}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={submit}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Konfirmasi jadi Draft</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StagingTab;

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {marginTop: 40},
  bold: {fontWeight: '700'},
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  title: {fontSize: 18, fontWeight: '700', color: '#111'},
  subtitle: {fontSize: 13, color: '#64748B', marginTop: 2},
  content: {padding: 14, paddingBottom: 90},

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: 8},
  waTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  waTagText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  cardCustomer: {flex: 1, fontSize: 15, fontWeight: '700', color: '#111'},
  cardPhone: {fontSize: 12.5, color: '#64748B', marginTop: 3},
  rawBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  rawText: {fontSize: 12.5, color: '#475569', fontStyle: 'italic'},
  metaRow: {flexDirection: 'row', gap: 16, marginTop: 8},
  meta: {fontSize: 12.5, color: '#334155'},

  actions: {flexDirection: 'row', gap: 10, marginTop: 12},
  discardBtn: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardText: {color: '#EF4444', fontWeight: '600'},
  confirmBtn: {
    flex: 1.6,
    height: 42,
    borderRadius: 9,
    backgroundColor: color.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  confirmText: {color: '#fff', fontWeight: '700'},

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {fontSize: 17, fontWeight: '700', color: '#111'},
  modalNote: {fontSize: 12.5, color: '#64748B', marginTop: 4, marginBottom: 6},
  label: {fontSize: 12.5, fontWeight: '600', color: '#334155', marginTop: 10},
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 5,
    fontSize: 14,
    color: '#111',
  },
  inputDisabled: {backgroundColor: '#F8FAFC', color: '#64748B'},
  priceRow: {flexDirection: 'row', gap: 12},
  modalActions: {flexDirection: 'row', gap: 10, marginTop: 20},
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {color: '#64748B', fontWeight: '600'},
  saveBtn: {
    flex: 1.6,
    height: 46,
    borderRadius: 10,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {color: '#fff', fontWeight: '700'},

  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 50,
    fontSize: 14,
    lineHeight: 20,
  },
});
