import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
import * as RootNavigation from '../../config/RootNavigation';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../../constant/color';
import Batchs from './Batchs';
import Items from './Items';
import Toast from 'react-native-toast-message';
import {getListBatch} from '../../resource/Batch';
import {getListItem} from '../../resource/Item';
import UnfinishBatchs from './UnfinishBatchs';

const Home = ({param}) => {
  const [searchString, setSearchString] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (param?.data) {
      console.log(param?.data);

      setSearchString(param?.data);
      handleSearch(param?.data);
    }
  }, [param]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, []),
  );

  const handleSearch = async (data = null) => {
    let string = searchString;
    if (data) string = data;

    console.log(string);

    if (string.length == 10) {
      let find = await getListBatch({batch_no: string}, true);
      if (find) {
        RootNavigation.navigate('BatchView', {item: find[0]});
      }
    } else if (string.length == 13) {
      let find = await getListItem({batch_no: string}, true);
      if (find) {
        RootNavigation.navigate('ItemView', {item: find[0]});
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Invalid barcode`,
      });
    }
  };
  const onRefresh = () => {
    setRefresh(prev => !prev); // trigger useEffect di Items
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.containerSearch}>
        <TouchableOpacity style={styles.searchIconContainer}>
          <Icon name="search" size={24} color={color.primaryColor} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Search Barcode ..."
          value={searchString}
          onChangeText={text => setSearchString(text)}
          onSubmitEditing={() => handleSearch()} // ← ini yang penting
          returnKeyType="search" // opsional, agar tombol di keyboard berubah jadi "Search"
        />
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => onRefresh()}
          />
        }
        contentContainerStyle={styles.scrollViewContent}
        style={{width: '100%', marginTop: Platform.OS === 'ios' ? 0 : 10}}
        showsVerticalScrollIndicator={false}>
        <Items refresh={refresh} />
        <Batchs refresh={refresh} />
        <UnfinishBatchs refresh={refresh} />
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderColor: color.primaryLighter,
  },
  scrollViewContent: {
    flexGrow: 1, // agar isi ScrollView bisa mengisi sisa layar jika kontennya sedikit
    paddingBottom: 80, // sesuaikan dengan tinggi TabView/tab bar kamu
  },
  containerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: color.primaryLighter,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 42,
  },
});
