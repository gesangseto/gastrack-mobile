import {StatusBar, StyleSheet, View} from 'react-native';
import ListViewItem from '../../compenents/ListViewItem';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListItem} from '../../resource/Item';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';

const ItemList = ({navigation, route}) => {
  const [list, setList] = useState([]);
  useFocusEffect(
    useCallback(() => {
      // kode yang dijalankan saat screen difokuskan kembali
      loadData();
    }, []),
  );

  const loadData = async () => {
    let response = await getListItem({status: ['draft']});
    if (response) {
      setList(response);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={'List Item'} />
      <ListViewItem list={list} />
    </View>
  );
};

export default ItemList;

const styles = StyleSheet.create({
  title: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
});
