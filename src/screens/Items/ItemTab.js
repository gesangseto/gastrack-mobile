import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Toast from 'react-native-toast-message';
import ListViewItem from '../../components/ListViewItem';
import MenuTile from '../../components/MenuTile';
import SearchBar from '../../components/SearchBar';
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
// Data item (status 200/201/202) dimuat SEKALI saat screen aktif dan disimpan
// di Zustand store. Klik tab hanya mem-filter data store (tanpa request ulang).
const ITEM_TABS = [
  {key: 'Draft', label: 'Draft', status: 200},
  {key: 'OnBatch', label: 'On Batch', status: 201},
  {key: 'OnShipping', label: 'On Shipping', status: 202},
];

// Tipe pencarian → filter client-side pada data store:
// - phone   : cocokkan nomor HP customer
// - name    : cocokkan nama customer
// - barcode : cocokkan barcode item
const SEARCH_TYPES = [
  {
    key: 'phone',
    label: 'No Hp',
    placeholder: 'Cari nomor HP customer...',
    keyboardType: 'phone-pad',
    icon: 'phone',
  },
  {
    key: 'name',
    label: 'Nama Cust',
    placeholder: 'Cari nama customer...',
    icon: 'user',
  },
  {
    key: 'barcode',
    label: 'Barcode',
    placeholder: 'Scan / ketik barcode...',
    icon: 'scan-barcode',
  },
];

const ItemTab = () => {
  const [activeTab, setActiveTab] = useState('Draft');
  const [searchType, setSearchType] = useState('phone');
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');

  const list = useItemStore(s => s.list);
  const loading = useItemStore(s => s.loading);
  const fetchItems = useItemStore(s => s.fetchItems);

  const current = ITEM_TABS.find(t => t.key === activeTab) || ITEM_TABS[0];

  // Debounce ketikan agar filter tidak dijalankan per karakter.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Muat item status 200/201/202 sekali saat screen Item aktif.
  useFocusEffect(
    useCallback(() => {
      fetchItems(false);
    }, [fetchItems]),
  );

  // Filter client-side: tab status + kata kunci pencarian.
  const matchesSearch = item => {
    if (!keyword) return true;
    const k = keyword.toLowerCase();
    if (searchType === 'phone') {
      return (item.customer_phone || '').toLowerCase().includes(k);
    }
    if (searchType === 'name') {
      return (item.customer_name || '').toLowerCase().includes(k);
    }
    // barcode
    return (item.barcode || '').toLowerCase().includes(k);
  };

  const filteredList = list.filter(
    item => Number(item.status) === current.status && matchesSearch(item),
  );

  // Jumlah item per status (badge tab) — dihitung dari data store.
  // Ini quantity Item (jumlah item), bukan total quantity pcs.
  const qtyOf = status =>
    list.filter(item => Number(item.status) === status).length;

  const tabs = ITEM_TABS.map(t => ({
    key: t.key,
    label: t.label,
    qty: qtyOf(t.status),
  }));

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
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => setKeyword(query.trim())}
          type={searchType}
          types={SEARCH_TYPES}
          onChangeType={setSearchType}
          loading={loading}
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
            refresh={() => fetchItems(true)}
            inline
            emptyText={
              keyword
                ? `Tidak ada item untuk pencarian "${keyword}"`
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