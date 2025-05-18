import {useEffect, useState} from 'react';
import {StatusBar, TouchableOpacity, Text, View} from 'react-native';
import ListViewItem from '../../compenents/ListViewItem';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {createItem, getListItem} from '../../resource/Item';
import {getProfile} from '../../storage';
import {createBatch} from '../../resource/Batch';

const BatchCreate = ({navigation, route}) => {
  const [formData, setFormData] = useState({
    items: [],
    seller_phone: getProfile()?.phone,
  });

  useEffect(() => {
    loadItems();
  }, []);
  const loadItems = async () => {
    let response = await getListItem({status: 'draft'});
    if (response) {
      setFormData({...formData, items: response});
    }
  };

  const save = async () => {
    let submit = await createBatch(formData);
    if (submit) RootNavigation.goBack();
  };
  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Tambah Batch" />
      <ListViewItem list={formData.items} />

      <TouchableOpacity
        onPress={() => save()}
        style={{
          marginTop: 20,
          marginBottom: 40,
          borderRadius: 20,
          backgroundColor: color.primaryColor,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          width: '80%',
        }}>
        <Text
          style={{
            color: color.white,
            fontSize: 16,
            fontWeight: 'bold',
          }}>
          Create Batch
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BatchCreate;
