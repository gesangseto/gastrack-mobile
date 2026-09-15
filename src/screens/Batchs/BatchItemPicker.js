import {useEffect, useState} from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ItemCard from '../../components/ItemCard';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListItem} from '../../resource/Item';

// Pilih item (status 200, belum masuk batch) untuk ditambahkan ke batch.
// Kembali ke BatchView dengan route.params.selected = [{id, ...}]
const BatchItemPicker = ({navigation, route}) => {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    let response = await getListItem({status: 200, batch_id: null}, false);
    if (response) {
      setList(response);
    }
    setLoading(false);
  };

  const toggle = item => {
    setSelected(prev => {
      const next = {...prev};
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }
      return next;
    });
  };

  const handleAdd = () => {
    const items = Object.values(selected);
    if (items.length === 0) {
      return;
    }
    // Navigate ke BatchView yang sudah ada di stack: React Navigation otomatis
    // pop BatchItemPicker + set params sekaligus. merge:true SANGAT PENTING —
    // tanpa itu params BatchView (item) akan DIGANTI total, item.id hilang,
    // dan loadData() memanggil API tanpa id → daftar item batch jadi kosong.
    RootNavigation.navigate({
      name: 'BatchView',
      params: {pickedItems: items},
      merge: true,
    });
  };

  const renderItem = (item, index) => {
    const isSelected = !!selected[item.id];
    return (
      <ItemCard
        key={index}
        item={item}
        selected={isSelected}
        onToggle={() => toggle(item)}
      />
    );
  };

  const count = Object.keys(selected).length;

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={`Pilih Item (${count})`} />
      <View style={styles.container}>
        <FlatList
          data={list}
          renderItem={({item, index}) => renderItem(item, index)}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading
                ? 'Memuat...'
                : 'Tidak ada item tersedia (semua sudah masuk batch)'}
            </Text>
          }
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={count === 0}
          style={[styles.addButton, count === 0 && styles.addButtonDisabled]}>
          <Text style={styles.addButtonText}>
            Tambah ke Batch ({count})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BatchItemPicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  empty: {
    textAlign: 'center',
    color: '#9A9A9A',
    marginTop: 40,
    fontSize: 13,
  },
  addButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  addButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  addButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});