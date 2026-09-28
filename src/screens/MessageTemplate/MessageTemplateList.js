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

// Android hanya read-only: tidak ada tambah/edit/hapus template di sini.
// Semua perubahan master template dilakukan dari Website (ERP).
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

  // Filter client-side: name, code, trigger_event, channel
  const filteredList = list.filter(item => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (item?.name || '').toLowerCase().includes(q) ||
      (item?.code || '').toLowerCase().includes(q) ||
      (item?.trigger_event || '').toLowerCase().includes(q) ||
      (item?.channel || '').toLowerCase().includes(q)
    );
  });

  const renderItem = (item, index) => {
    return (
      <Pressable
        onPress={() =>
          RootNavigation.navigate('MessageTemplateEdit', {item: item})
        }
        key={index}
        style={styles.card}>
        <View style={styles.avatar}>
          <Icon
            name="message-square-text"
            size={20}
            color={color.primaryColor}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item?.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item?.code}
            {item?.trigger_event ? ` • ${item.trigger_event}` : ''}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                item?.status === 'Active'
                  ? styles.statusDotActive
                  : styles.statusDotInactive,
              ]}
            />
            <Text
              style={styles.statusText}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item?.channel?.toUpperCase() || 'WA'} • {item?.status}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() =>
              RootNavigation.navigate('MessageTemplateEdit', {item: item})
            }
            style={styles.actionBtn}>
            <Icon name="pencil" size={16} color={color.primaryColor} />
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
      <Header title={`Template Pesan (${filteredList.length})`} />
      <View style={styles.container}>
        {/* Pencarian */}
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama / code / trigger..."
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
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: '700',
    color: '#1F1F1F',
    fontSize: 14,
  },
  sub: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
