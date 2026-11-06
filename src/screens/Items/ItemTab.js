import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from '@react-native-vector-icons/lucide';
import InputText from '../../components/InputText';
import ListViewItem from '../../components/ListViewItem';
import MenuTile from '../../components/MenuTile';
import SegmentedTabs from '../../components/SegmentedTabs';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {useItemStore} from '../../store/itemStore';
import {useSessionStore} from '../../store/sessionStore';

// Tab "Item" — Tambah Item + filter status + pencarian.
//
// Status item (mst_epc_status):
//   200 Draft       → belum masuk batch
//   201 Manifest    → sudah masuk batch (batch masih Draft)
//   202 In-Transit  → batch sudah dikirim, barang belum tiba di warehouse
//
// Data item (status 200/201/202) dari session AKTIF dimuat saat screen aktif
// dan disimpan di Zustand store. Klik tab hanya mem-filter data store (tanpa request ulang).
const ITEM_TABS = [
  {key: 'Draft', label: 'Draft', status: 200},
  {key: 'OnBatch', label: 'On Batch', status: 201},
  {key: 'OnShipping', label: 'On Shipping', status: 202},
];

const ItemTab = () => {
  const [activeTab, setActiveTab] = useState('Draft');
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');

  const list = useItemStore(s => s.list);
  const loading = useItemStore(s => s.loading);
  const fetchItems = useItemStore(s => s.fetchItems);
  const clearItems = useItemStore(s => s.clearItems);

  const activeSession = useSessionStore(s => s.activeSession);
  const ensureActiveSession = useSessionStore(s => s.ensureActiveSession);

  const current = ITEM_TABS.find(t => t.key === activeTab) || ITEM_TABS[0];

  // Debounce ketikan agar filter tidak dijalankan per karakter.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim().toLowerCase()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Muat item status 200/201/202 dari session AKTIF saat screen Item aktif.
  // Tanpa session aktif → list dikosongkan (jangan tampilkan item session lain).
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const session = await ensureActiveSession();
        if (session) {
          fetchItems(session.id, false);
        } else {
          clearItems();
        }
      })();
    }, [fetchItems, ensureActiveSession, clearItems]),
  );

  // Pull-to-refresh: muat ulang item dari session aktif.
  const handleRefresh = async () => {
    const session = await ensureActiveSession();
    if (session) {
      fetchItems(session.id, true);
    } else {
      clearItems();
    }
  };

  // Filter client-side: tab status + pencarian customer (nama / no. HP).
  const matchesSearch = item =>
    !keyword ||
    (item.customer_name || '').toLowerCase().includes(keyword) ||
    (item.customer_phone || '').toLowerCase().includes(keyword);

  const filteredList = list.filter(
    item => Number(item.status) === current.status && matchesSearch(item),
  );

  // Ringkasan tab per status: jumlah record (baris item) + total pcs.
  // 1 baris item = 1 input admin berisi `quantity` pcs (bukan item_batch).
  const summaryOf = status => {
    const rows = list.filter(item => Number(item.status) === status);
    return {
      records: rows.length,
      pcs: rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    };
  };

  const tabs = ITEM_TABS.map(t => {
    const s = summaryOf(t.status);
    return {
      key: t.key,
      label: t.label,
      qtyText: `${s.records} rec · ${s.pcs} pcs`,
    };
  });

  // Guard: "Tambah Item" hanya boleh jika ada session aktif.
  const handleAddItem = async () => {
    const session = await useSessionStore.getState().ensureActiveSession();
    if (!session) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tidak ada session aktif. Mulai session terlebih dahulu.',
      });
      return;
    }
    RootNavigation.navigate('ItemCreate');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item</Text>
      <Text style={styles.subtitle}>Kelola item titipan customer</Text>

      <MenuTile
        icon="plus"
        iconBg={color.primaryLight}
        iconColor={color.primaryColor}
        title="Tambah Item"
        desc="Catat item titipan baru"
        onPress={handleAddItem}
      />

      <SegmentedTabs items={tabs} value={activeTab} onChange={setActiveTab} />

      <View style={styles.searchWrap}>
        <InputText
          value={query}
          onChangeText={setQuery}
          placeholder="Cari customer..."
          rightIcon={<Icon name="search" size={18} color="#9CA3AF" />}
        />
      </View>

      <View style={styles.listWrap}>
        {loading && filteredList.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={color.primaryColor}
            style={styles.loading}
          />
        ) : (
          <ListViewItem
            list={filteredList}
            refresh={handleRefresh}
            inline
            emptyText={
              !activeSession
                ? 'Tidak ada session aktif. Mulai session terlebih dahulu.'
                : keyword
                  ? `Tidak ada item untuk pencarian "${query.trim()}"`
                  : 'Belum ada item'
            }
          />
        )}
      </View>
    </View>
  );
};

export default ItemTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 74,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  subtitle: {
    fontSize: 12,
    color: '#9A9A9A',
    marginTop: 2,
    marginBottom: 14,
  },
  searchWrap: {
    marginBottom: 12,
  },
  listWrap: {
    flex: 1,
  },
  loading: {
    marginTop: 24,
  },
});
