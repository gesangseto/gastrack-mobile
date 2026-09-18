import {useEffect, useState} from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ItemCard from '../../components/ItemCard';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListItem} from '../../resource/Item';
import {createBatch} from '../../resource/Batch';
import {useSessionStore} from '../../store/sessionStore';

const BatchCreate = ({navigation, route}) => {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    let response = await getListItem({status: 200}, false);
    if (response) {
      setItems(response);
    }
  };

  const save = async () => {
    if (items.length === 0) {
      return;
    }
    // Guard: wajib ada session aktif sebelum membuat batch
    const session = await useSessionStore.getState().ensureActiveSession();
    if (!session) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tidak ada session aktif. Mulai session terlebih dahulu.',
      });
      return;
    }
    setSaving(true);
    // Weight & Tujuan diisi saat kirim (Detail Batch)
    let submit = await createBatch({items: items.map(i => ({id: i.id}))});
    setSaving(false);
    if (submit) RootNavigation.goBack();
  };

  const renderItem = (item, index) => {
    return <ItemCard key={index} item={item} />;
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Create Batch" />
      <View style={styles.container}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Item ({items.length})</Text>
        </View>
        <FlatList
          data={items}
          renderItem={({item, index}) => renderItem(item, index)}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Tidak ada item draft yang tersedia
            </Text>
          }
        />

        <TouchableOpacity
          onPress={() => save()}
          disabled={saving || items.length === 0}
          style={[
            styles.saveButton,
            (saving || items.length === 0) && styles.btnDisabled,
          ]}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Membuat...' : 'Create Batch'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BatchCreate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  empty: {
    textAlign: 'center',
    color: '#9A9A9A',
    marginTop: 30,
    fontSize: 13,
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnDisabled: {
    backgroundColor: '#C4C4C4',
  },
  saveButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});