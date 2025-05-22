import {useEffect, useState, useCallback} from 'react';
import {StatusBar, View} from 'react-native';
import ListViewBatch from '../../components/ListViewBatch';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListBatch} from '../../resource/Batch';
import {useFocusEffect} from '@react-navigation/native';

const BatchList = ({navigation, route}) => {
  const [list, setList] = useState([]);

  useFocusEffect(
    useCallback(() => {
      // kode yang dijalankan saat screen difokuskan kembali
      loadData();
    }, []),
  );

  const loadData = async () => {
    let response = await getListBatch({status: ['on-delivery', 'draft']});
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
      <Header title={`List Batch (${list.length})`} />
      <ListViewBatch list={list} refresh={() => loadData()} />
    </View>
  );
};

export default BatchList;
