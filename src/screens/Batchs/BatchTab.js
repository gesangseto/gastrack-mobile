import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Toast from 'react-native-toast-message';
import ListViewBatch from '../../components/ListViewBatch';
import MenuTile from '../../components/MenuTile';
import SegmentedTabs from '../../components/SegmentedTabs';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {useBatchStore} from '../../store/batchStore';
import {useSessionStore} from '../../store/sessionStore';

// Tab "Batch" — Tambah Batch + filter status batch.
// Data batch (Draft + Shipping) dari session AKTIF dimuat saat screen aktif dan
// disimpan di Zustand store. Klik tab hanya mem-filter data store (tanpa request ulang).
const BATCH_TABS = [
  {key: 'Draft', label: 'Draft'},
  {key: 'Shipping', label: 'Shipping'},
];

const BatchTab = () => {
  const [activeTab, setActiveTab] = useState('Draft');

  const list = useBatchStore(s => s.list);
  const loading = useBatchStore(s => s.loading);
  const fetchBatches = useBatchStore(s => s.fetchBatches);
  const clearBatches = useBatchStore(s => s.clearBatches);

  const activeSession = useSessionStore(s => s.activeSession);
  const ensureActiveSession = useSessionStore(s => s.ensureActiveSession);

  // Muat batch Draft + Shipping dari session AKTIF saat screen Batch aktif.
  // Tanpa session aktif → list dikosongkan (jangan tampilkan batch session lain).
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const session = await ensureActiveSession();
        if (session) {
          fetchBatches(session.id, false);
        } else {
          clearBatches();
        }
      })();
    }, [fetchBatches, ensureActiveSession, clearBatches]),
  );

  // Pull-to-refresh: muat ulang batch dari session aktif.
  const handleRefresh = async () => {
    const session = await ensureActiveSession();
    if (session) {
      fetchBatches(session.id, true);
    } else {
      clearBatches();
    }
  };

  // Filter client-side: tab Draft → status Draft, tab Shipping → status Shipping.
  const filteredList = list.filter(b => b.status === activeTab);

  // Jumlah batch per status (badge tab) — dihitung dari data store.
  // Ini quantity Batch (jumlah batch), bukan total quantity item di dalamnya.
  const qtyOf = status =>
    list.filter(b => b.status === status).length;

  const tabs = BATCH_TABS.map(t => ({
    key: t.key,
    label: t.label,
    qty: qtyOf(t.key),
  }));

  // Guard: "Tambah Batch" hanya boleh jika ada session aktif.
  const handleAddBatch = async () => {
    const session = await useSessionStore.getState().ensureActiveSession();
    if (!session) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tidak ada session aktif. Mulai session terlebih dahulu.',
      });
      return;
    }
    RootNavigation.navigate('BatchCreate');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Batch</Text>
      <Text style={styles.subtitle}>Kelola batch pengiriman</Text>

      <MenuTile
        icon="plus"
        iconBg={color.primaryLight}
        iconColor={color.primaryColor}
        title="Tambah Batch"
        desc="Buat batch baru dari item jastip"
        onPress={handleAddBatch}
      />

      <SegmentedTabs items={tabs} value={activeTab} onChange={setActiveTab} />

      <View style={styles.listWrap}>
        {loading && filteredList.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={color.primaryColor}
            style={styles.loading}
          />
        ) : (
          <ListViewBatch
            list={filteredList}
            refresh={handleRefresh}
            inline
            emptyText={
              !activeSession
                ? 'Tidak ada session aktif. Mulai session terlebih dahulu.'
                : activeTab === 'Draft'
                  ? 'Belum ada batch draft'
                  : 'Belum ada batch yang dikirim'
            }
          />
        )}
      </View>
    </View>
  );
};

export default BatchTab;

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
  listWrap: {
    flex: 1,
  },
  loading: {
    marginTop: 24,
  },
});
