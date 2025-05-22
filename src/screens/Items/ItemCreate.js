import {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import InputTextArea from '../../components/InputTextArea';
import UploadImage from '../../components/UploadImage';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {createItem} from '../../resource/Item';
import {getProfile} from '../../storage';

const ItemCreate = ({navigation, route}) => {
  const [formData, setFormData] = useState({
    item_name: null,
    phone: null,
    name: null,
    address: null,
    photo: null,
    seller_phone: getProfile()?.phone,
  });
  useEffect(() => {}, []);

  const save = async () => {
    const form = new FormData();
    // Isi FormData dengan semua properti dari Params
    try {
      for (let key in formData) {
        const value = formData[key];
        // Jika value adalah file (misal gambar dari picker)
        if (value && typeof value === 'object' && value.uri) {
          form.append(key, {
            uri: value.uri,
            name: value.name || 'file.jpg',
            type: value.type || 'image/jpeg',
          });
        } else {
          form.append(key, value);
        }
      }
      let submit = await createItem(form);
      if (submit) RootNavigation.goBack();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Tambah Item" />
      <View
        style={{
          flex: 1,
          backgroundColor: color.white,
          marginTop: -40,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          padding: 30,
        }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View>
            <View style={{marginTop: 18}}>
              <InputText
                label="Phone No."
                required={true}
                showError={true}
                value={formData.phone}
                onChangeText={value => setFormData({...formData, phone: value})}
                placeholder="Masukkan nomor telp customer"
              />
              <InputText
                label="Name"
                value={formData.name}
                onChangeText={value => setFormData({...formData, name: value})}
                placeholder="Masukkan nama customer"
              />
              <InputText
                label="Item Name"
                value={formData.item_name}
                onChangeText={value =>
                  setFormData({...formData, item_name: value})
                }
                placeholder="Masukkan nama barang"
              />
              <InputTextArea
                label="Alamat"
                value={formData.address}
                onChangeText={value =>
                  setFormData({...formData, address: value})
                }
                placeholder="Biarkan kosong maka menggunakan alamat terakhir"
              />
              <UploadImage
                label="Foto Barang"
                image={formData.photo}
                setImage={image => {
                  setFormData({...formData, photo: image});
                }}
                //   required
                //   showError={submitted}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => save()}
            style={{
              marginTop: 10,
              borderRadius: 20,
              backgroundColor: color.primaryColor,
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}>
            <Text
              style={{
                color: color.white,
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              Save Item
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default ItemCreate;

const styles = StyleSheet.create({
  title: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
});
