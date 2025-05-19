import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useState} from 'react';
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

    console.log(string.length);

    if (string.length == 10) {
    } else if (string.length == 13) {
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
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => onRefresh()} />
      }
      style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        marginTop: Platform.OS === 'ios' ? 0 : 30,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Search */}
      <View style={styles.container}>
        <TouchableOpacity style={styles.searchIconContainer}>
          <Icon name="search" size={24} color={color.primaryColor} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Search Barcode ..."
          value={searchString}
          onChangeText={text => setSearchString(text)}
          onSubmitEditing={handleSearch} // ← ini yang penting
          returnKeyType="search" // opsional, agar tombol di keyboard berubah jadi "Search"
        />
      </View>
      <Items refresh={refresh} />
      <Batchs refresh={refresh} />
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
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
