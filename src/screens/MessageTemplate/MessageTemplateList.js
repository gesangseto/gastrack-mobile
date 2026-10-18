import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';

import {getListMessageTemplate} from '../../resource/MessageTemplate';

// `metadata` bisa datang sebagai object (sudah di-parse ORM) atau string JSON.
// Ambil nama controller untuk baris "Controller:" di kartu.
const getController = metadata => {
  if (!metadata) return '';
  try {
    const meta =
      typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    return meta?.controller || '';
  } catch (e) {
    return '';
  }
};

// Android hanya read-only: tidak ada tambah/edit/hapus template di sini.
// Semua perubahan master template dilakukan dari Website (ERP).
//
// Tampilan kartu = daftar trigger, satu kartu per template:
//   • Template     : nama template
//   • Code         : kode unik (dibuat dari Website/seeder)
//   • Trigger Event: event yang memicu pengiriman
//   • Kapan Dikirim: kondisi/aksi pemicu (kolom description)
//   • Controller   : controller backend yang memanggil trigger (metadata)
const MessageTemplateList = () => {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    let response = await getListMessageTemplate({}, true);
    if (response) {
      setList(response);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter client-side: name, code, trigger_event, description, controller.
  const filteredList = list.filter(item => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (item?.name || '').toLowerCase().includes(q) ||
      (item?.code || '').toLowerCase().includes(q) ||
      (item?.trigger_event || '').toLowerCase().includes(q) ||
      (item?.description || '').toLowerCase().includes(q) ||
      getController(item?.metadata).toLowerCase().includes(q)
    );
  });

  const renderItem = (item, index) => {
    const controller = getController(item?.metadata);
    const isActive = item?.status === 'Active';
    return (
      <Pressable
        onPress={() =>
          RootNavigation.navigate('MessageTemplateEdit', {item: item})
        }
        key={index}
        style={styles.card}>
        {/* Nomor urut + ikon */}
        <View style={styles.cardHead}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item?.name}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                isActive ? styles.statusDotActive : styles.statusDotInactive,
              ]}
            />
            <Text style={styles.statusText}>{item?.status}</Text>
          </View>
        </View>

        {/* Rincian trigger */}
        <View style={styles.detailWrap}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>• Code:</Text>
            <Text style={styles.detailValueMono}>{item?.code}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>• Trigger Event:</Text>
            <Text style={styles.detailValueMono}>{item?.trigger_event}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>• Kapan Dikirim:</Text>
            <Text style={styles.detailValue}>
              {item?.description || '-'}
            </Text>
          </View>
          {!!controller && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>• Controller:</Text>
              <Text style={styles.detailValue}>{controller}</Text>
            </View>
          )}
        </View>

        {/* Aksi: buka form edit (isi pesan bisa disesuaikan) */}
        <View style={styles.cardFoot}>
          <TouchableOpacity
            onPress={() =>
              RootNavigation.navigate('MessageTemplateEdit', {item: item})
            }
            style={styles.actionBtn}>
            <Icon name="pencil" size={14} color={color.primaryColor} />
            <Text style={styles.actionText}>Ubah isi pesan</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={`Message Template Triggers (${filteredList.length})`} />
      <View style={styles.container}>
        {/* Pencarian */}
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari template / code / trigger..."
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#B0B0B0"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Icon name="x" size={16} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        {filteredList.length === 0 && (
          <Text style={styles.emptyText}>
            {search ? 'Tidak ditemukan.' : 'Belum ada data template.'}
          </Text>
        )}
        <FlatList
          data={filteredList}
          renderItem={({item, index}) => renderItem(item, index)}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[color.primaryColor]}
            />
          }
        />
        {/* Android read-only: tidak ada tombol tambah template */}
      </View>
    </View>
  );
};

export default MessageTemplateList;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.white,
  },
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  listContent: {
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 10,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 14,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberText: {
    color: color.white,
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#1F1F1F',
    fontSize: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotActive: {
    backgroundColor: color.success,
  },
  statusDotInactive: {
    backgroundColor: '#C4C4C4',
  },
  statusText: {
    color: '#9A9A9A',
    fontSize: 11,
  },
  detailWrap: {
    borderTopWidth: 1,
    borderTopColor: '#F4F4F8',
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    lineHeight: 17,
  },
  detailValueMono: {
    flex: 1,
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '700',
    lineHeight: 17,
  },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F8',
    paddingTop: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: color.primaryLight,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: color.primaryColor,
  },
});
