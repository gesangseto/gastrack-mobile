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
import LoadingButton from '../../components/LoadingButton';
import useSubmitGuard from '../../hooks/useSubmitGuard';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListItem} from '../../resource/Item';
import {createBatch} from '../../resource/Batch';
import {useSessionStore} from '../../store/sessionStore';

const BatchCreate = ({navigation, route}) => {
  const [items, setItems] = useState([]);
  // Guard anti-duplikat: `busy` untuk tampilan, `submit` menolak request
  // kedua secara sinkron walau double-tap.
  const {busy: saving, submit} = useSubmitGuard();

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
    // Weight & Tujuan diisi saat kirim (Detail Batch)
    await submit(async () => {
      const created = await createBatch({items: items.map(i => ({id: i.id}))});
      if (created) RootNavigation.goBack();
    });
  };

  const renderItem = (item, index) => {
    return <ItemCard key={index} item={item} />;
  };

  const totalPcs = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Create Batch" />
      <View style={styles.container}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Item ({items.length} record · {totalPcs} pcs)
          </Text>
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

        <LoadingButton
          onPress={save}
          busy={saving}
          disabled={items.length === 0}
          label="Create Batch"
          busyLabel="Membuat..."
          icon="package"
          style={{marginTop: 10, marginBottom: 30, height: 50, borderRadius: 20}}
        />
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