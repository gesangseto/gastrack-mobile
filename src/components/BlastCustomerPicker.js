import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LoadingButton from './LoadingButton';
import color from '../constant/color';

/**
 * BlastCustomerPicker — checklist customer untuk blast tagihan WhatsApp.
 *
 * Alur:
 *   1. Buka modal → daftar customer yang punya sisa tagihan (belum lunas).
 *   2. User centang customer (atau "Pilih Semua").
 *   3. Tombol Blast TIDAK bisa dipakai selama belum ada satu pun customer
 *      terpilih (disabled).
 *   4. Setelah ada yang dicentang, tombol Blast aktif.
 *
 * Komponen ini sepenuhnya presentational: tidak memanggil API. Callback
 * `onConfirm(customerIds)` menerima daftar id terpilih supaya pemanggil
 * (PaymentTab) yang memutuskan kapan request dikirim.
 *
 * @param {boolean}   visible     Tampilkan modal?
 * @param {Array}    customers   Customer kandidat (harus punya `id`).
 *                               Field `customer_name` / `customer_phone` /
 *                               `remaining_amount` dipakai untuk tampilan.
 * @param {boolean}   busy        Request sedang berjalan — tombol nonaktif.
 * @param {Function}  onClose     Tutup modal.
 * @param {Function}  onConfirm   Dipanggil dengan array id customer terpilih.
 */
const BlastCustomerPicker = ({
  visible,
  customers = [],
  busy = false,
  onClose,
  onConfirm,
}) => {
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState('');

  // Kunci unik customer. Catatan: ringkasan tagihan dari backend TIDAK
  // punya field `id` — hanya `customer_id`. Kalau kita memakai `c.id`, semua
  // row jadi `undefined` dan bertabrakan di Set sehingga "Pilih Semua" hanya
  // mencentang satu customer. Karena itu selalu resolve ke customer_id.
  const getKey = c => String(c.customer_id ?? c.id ?? '');

  // Bersihkan pilihan setiap modal dibuka ulang — pilihan lama tidak boleh
  // terbawa ke session berikutnya.
  useEffect(() => {
    if (visible) {
      setSelected(new Set());
      setQuery('');
    }
  }, [visible]);

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return customers;
    return customers.filter(c =>
      `${c.customer_name || ''} ${c.customer_phone || ''}`
        .toLowerCase()
        .includes(kw),
    );
  }, [customers, query]);

  const toggle = key => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every(c => selected.has(getKey(c)));

  // Toggle "Pilih Semua".
  //
  // PENTING: penentuan aksi (check vs uncheck) harus dibaca dari `prev`
  // di dalam updater, BUKAN dari `allFilteredSelected` yang dihitung di
  // luar. Kalau kita memakai nilai luar, beberapa klik beruntun bisa membaca
  // state lama karena React membatch update — akibatnya "Pilih Semua" hanya
  // mencentang sebagian customer.
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected =
        filtered.length > 0 && filtered.every(c => next.has(getKey(c)));
      filtered.forEach(c => {
        const key = getKey(c);
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  // Tombol Blast hanya aktif bila ada minimal satu customer terpilih.
  const canSubmit = selected.size > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;
    // Kirim customer_id asli (angka) — backend memvalidasi tiap elemen
    // customer_ids harus numerik. Key internal kita string, jadi konversi
    // dulu dengan mencocokkan kembali ke row asal.
    const customerIds = customers
      .filter(c => selected.has(getKey(c)))
      .map(c => Number(c.customer_id ?? c.id))
      .filter(Number.isFinite);
    if (customerIds.length === 0) return;
    onConfirm(customerIds);
  };

  const rupiah = v => 'Rp ' + Number(v || 0).toLocaleString('id-ID');

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="none"
      onRequestClose={busy ? undefined : onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{flex: 1}}>
              <Text style={styles.title}>Blast Tagihan WhatsApp</Text>
              <Text style={styles.subtitle}>
                {selected.size > 0
                  ? `${selected.size} dari ${customers.length} customer dipilih`
                  : 'Centang customer yang akan dikirimi tagihan'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={busy}
              hitSlop={{top: 8, right: 8, bottom: 8, left: 8}}>
              <Icon name="x" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Pencarian */}
          <View style={styles.searchWrap}>
            <Icon name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.search}
              placeholder="Cari nama / no. HP..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Icon name="x" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Pilih Semua */}
          {filtered.length > 0 && (
            <TouchableOpacity
              style={styles.checkAllRow}
              onPress={toggleAll}
              disabled={busy}
              activeOpacity={0.75}>
              <View
                style={[
                  styles.checkbox,
                  allFilteredSelected && styles.checkboxChecked,
                ]}>
                {allFilteredSelected ? (
                  <Icon name="check" size={13} color={color.white} />
                ) : null}
              </View>
              <Text style={styles.checkAllText}>
                Pilih Semua ({filtered.length})
              </Text>
            </TouchableOpacity>
          )}

          {/* Daftar customer */}
          <FlatList
            data={filtered}
            keyExtractor={item => getKey(item)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) => {
              const checked = selected.has(getKey(item));
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    checked && styles.rowChecked,
                  ]}
                  onPress={() => toggle(getKey(item))}
                  disabled={busy}
                  activeOpacity={0.75}>
                  <View
                    style={[
                      styles.checkbox,
                      checked && styles.checkboxChecked,
                    ]}>
                    {checked ? (
                      <Icon name="check" size={13} color={color.white} />
                    ) : null}
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.rowName}>
                      {item.customer_name || '-'}
                    </Text>
                    <Text style={styles.rowPhone}>
                      {item.customer_phone || '-'}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>
                    {rupiah(item.remaining_amount)}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {customers.length === 0
                  ? 'Tidak ada customer yang perlu ditagih'
                  : 'Customer tidak ditemukan'}
              </Text>
            }
          />

          {/* Aksi */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={busy}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <View style={{flex: 1.4}}>
              <LoadingButton
                onPress={submit}
                busy={busy}
                // Disabled tanpa pilihan — inilah syarat "tombol blast nonaktif
                // sampai user mencentang minimal satu customer".
                disabled={selected.size === 0}
                label={
                  selected.size > 0
                    ? `Kirim ke ${selected.size} Customer`
                    : 'Blast Tagihan'
                }
                busyLabel="Mengirim..."
                icon="send"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '85%',
    minHeight: '55%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  search: {
    flex: 1,
    fontSize: 13,
    color: '#1F1F1F',
    outlineStyle: 'none',
  },
  checkAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: color.primaryLight,
    borderRadius: 10,
    marginBottom: 8,
  },
  checkAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: color.primaryColor,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.white,
  },
  checkboxChecked: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    marginBottom: 6,
  },
  rowChecked: {
    backgroundColor: color.primaryLight,
    borderColor: color.primaryColor,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  rowPhone: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  rowAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: color.danger,
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    paddingVertical: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
});

export default BlastCustomerPicker;