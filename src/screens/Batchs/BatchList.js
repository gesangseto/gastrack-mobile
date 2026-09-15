import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {StatusBar, View} from 'react-native';
import ListViewBatch from '../../components/ListViewBatch';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListBatch} from '../../resource/Batch';

const BatchList = ({navigation, route}) => {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('List Batch');

  useFocusEffect(
    useCallback(() => {
      if (route.params?.list) {
        setList(route.params.list);
        if (route.params?.title) {
          setTitle(route.params.title);
        }
      } else {
        loadData();
      }
      // route stabil seumur hidup screen; loadData sengaja tidak dijadikan dep
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const loadData = async () => {
    let response = await getListBatch({status: ['Shipping', 'Draft']});
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
      <ListViewBatch list={list} refresh={() => loadData()} />
    </View>
  );
};

export default BatchList;
