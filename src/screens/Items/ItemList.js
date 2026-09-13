import {StatusBar, StyleSheet, View} from 'react-native';
import ListViewItem from '../../components/ListViewItem';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListItem} from '../../resource/Item';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';

const ItemList = ({navigation, route}) => {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('List Item');

  useFocusEffect(
    useCallback(() => {
      // Jika dikirim list via route params (mis. hasil cari by phone), pakai itu
      if (route.params?.list) {
        setList(route.params.list);
        if (route.params?.title) {
          setTitle(route.params.title);
        }
      } else {
        loadData();
      }
    }, []),
  );

  const loadData = async () => {
    let response = await getListItem({status: [200]});
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
      <Header title={`${title} (${list.length})`} />
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