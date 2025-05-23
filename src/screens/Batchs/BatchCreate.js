import {useEffect, useState} from 'react';
import {
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import ListViewItem from '../../components/ListViewItem';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {createItem, getListItem} from '../../resource/Item';
import {getProfile} from '../../storage';
import {createBatch} from '../../resource/Batch';
import DropDownPicker from 'react-native-dropdown-picker';
import {getListMstWarehouse} from '../../resource/MstWarehouse';
const BatchCreate = ({navigation, route}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [list, setList] = useState([]);

  const [formData, setFormData] = useState({
    items: [],
    warehouse_id: null,
    seller_phone: getProfile()?.phone,
  });

  useEffect(() => {
    loadItems();
    loadWarehouse();
  }, []);
  const loadItems = async () => {
    let response = await getListItem({status: 'draft'});
    if (response) {
      setFormData({...formData, items: response});
    }
  };
  const loadWarehouse = async () => {
    let response = await getListMstWarehouse({status: 'active'});
    if (response) {
      let arr = [];
      for (const it of response) {
        arr.push({value: it.id, label: it.address, ...it});
      }
      setList(arr);
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
      <DropDownPicker
        open={open}
        value={formData.warehouse_id}
        items={list}
        setOpen={setOpen}
        onSelectItem={item => {
          setFormData({...formData, warehouse_id: item.value});
        }}
        setItems={setList}
        placeholder={'Pilih tujuan'}
      />
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
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
    backgroundColor: '#fff',
    paddingRight: 30,
  },
});
