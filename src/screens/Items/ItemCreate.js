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
import UploadImage from '../../components/UploadImage';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {createItem, updateItem} from '../../resource/Item';
import {getEndpoint} from '../../storage';
import {getMimeType} from '../../helper/helper';

const ItemCreate = ({navigation, route}) => {
  const [formData, setFormData] = useState({
    id: null,
    item_name: null,
    customer_phone: null,
    quantity: null,
    cost_price: null,
    selling_price: null,
    photo: null,
  });
  useEffect(() => {
    if (route && route?.params && route?.params?.item) {
      let item = route?.params?.item;
      let param = {};
      param.id = item.id || null;
      param.customer_phone = item.customer_phone || null;
      param.item_name = item.product_name || item.item_name || null;
      param.quantity = item.quantity != null ? String(item.quantity) : null;
      param.cost_price =
        item.cost_price != null ? String(item.cost_price) : null;
      param.selling_price =
        item.selling_price != null ? String(item.selling_price) : null;
      param.photo = getImageObject(item.photo_path || item.photo);
      setFormData({...formData, ...param});
    }
  }, []);

  const getImageObject = filename => {
    if (!filename) return null;
    const time = new Date().getTime(); // 👈 cache buster
    // Backend menyimpan foto di public/uploads/jastip (di-serve statis)
    const url = `${getEndpoint()}/${filename.replace(/^public\//, '')}?t=${time}`;
    let photo = {
      uri: url,
      filename: filename,
      type: getMimeType(filename),
    };

    return photo;
  };
  const save = async () => {
    const form = new FormData();
    // Isi FormData dengan semua properti dari Params
    try {
      for (let key in formData) {
        const value = formData[key];
        // Jika value adalah file (misal gambar dari picker)
        if (value && typeof value === 'object' && value.uri) {
          if (value.uri.startsWith('http')) {
            // Foto lama dari server — kirim path-nya saja, jangan upload ulang
            form.append('photo_path', value.filename);
          } else {
            form.append(key, {
              uri: value.uri,
              name: value.name || 'file.jpg',
              type: value.type || 'image/jpeg',
            });
          }
        } else if (value !== null && value !== undefined && value !== '') {
          // Jika value bukan null
          form.append(key, value);
        }
      }
      let submit = null;
      if (formData.id) {
        submit = await updateItem(form);
      } else {
        submit = await createItem(form);
      }
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
      <Header title={formData.id ? 'Edit Item' : 'Create Item'} />
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
                value={formData.customer_phone}
                onChangeText={value =>
                  setFormData({...formData, customer_phone: value})
                }
                placeholder="Masukkan nomor telp customer"
              />
              <InputText
                label="Item Name"
                value={formData.item_name}
                onChangeText={value =>
                  setFormData({...formData, item_name: value})
                }
                placeholder="Masukkan nama barang"
              />
              <InputText
                label="Quantity"
                required={true}
                showError={true}
                keyboardType="numeric"
                value={formData.quantity}
                onChangeText={value =>
                  setFormData({...formData, quantity: value})
                }
                placeholder="Masukkan jumlah barang"
              />
              <InputText
                label="Cost Price"
                required={true}
                showError={true}
                keyboardType="numeric"
                value={formData.cost_price}
                onChangeText={value =>
                  setFormData({...formData, cost_price: value})
                }
                placeholder="Masukkan harga modal"
              />
              <InputText
                label="Selling Price"
                required={true}
                showError={true}
                keyboardType="numeric"
                value={formData.selling_price}
                onChangeText={value =>
                  setFormData({...formData, selling_price: value})
                }
                placeholder="Masukkan harga jual"
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
