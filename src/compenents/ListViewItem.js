import Icon from '@react-native-vector-icons/lucide';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../constant/color';
import * as RootNavigation from '../config/RootNavigation';
import ThermalPrinterModule from 'react-native-thermal-printer';

const printTest =
  '[C]<img>https://via.placeholder.com/300.jpg</img>\n' +
  '[L]\n' +
  "[C]<u><font size='big'>ORDER N°045</font></u>\n" +
  '[L]\n' +
  '[C]================================\n' +
  '[L]\n' +
  '[L]<b>BEAUTIFUL SHIRT</b>[R]9.99e\n' +
  '[L]  + Size : S\n' +
  '[L]\n' +
  '[L]<b>AWESOME HAT</b>[R]24.99e\n' +
  '[L]  + Size : 57/58\n' +
  '[L]\n' +
  '[C]--------------------------------\n' +
  '[R]TOTAL PRICE :[R]34.98e\n' +
  '[R]TAX :[R]4.23e\n' +
  '[L]\n' +
  '[C]================================\n' +
  '[L]\n' +
  "[L]<font size='tall'>Customer :</font>\n" +
  '[L]Raymond DUPONT\n' +
  '[L]5 rue des girafes\n' +
  '[L]31547 PERPETES\n' +
  '[L]Tel : +33801201456\n' +
  '[L]\n' +
  "[C]<barcode type='ean13' height='10'>831254784551</barcode>\n" +
  "[C]<qrcode size='20'>http://www.developpeur-web.dantsu.com/</qrcode>\n" +
  '[L]\n' +
  '[L]\n' +
  '[L]\n' +
  '[L]\n' +
  '[L]\n';
const ListViewItem = props => {
  const {list, refresh} = props;
  const handlePressPrint = async () => {
    // inside async function
    try {
      await ThermalPrinterModule.printBluetooth({
        payload: printTest,
        printerNbrCharactersPerLine: 38,
      });
    } catch (err) {
      //error handling
      console.log(err);
    }
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.white,
        marginTop: -40,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        padding: 30,
      }}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {list?.map((item, index) => (
          <Pressable
            onPress={() => RootNavigation.navigate('ItemView', {item: item})}
            key={index}
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'row',
              marginTop: 15,
              paddingVertical: 10,
              paddingHorizontal: 10,
              backgroundColor: color.white,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowOffset: {height: 0.2, width: 0.2},
              elevation: 1,
              borderRadius: 20,
            }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
              }}>
              <Icon name="circle-help" size={55} color={color.primaryColor} />

              {/* <Image
              source={{uri: item?.profilePhoto}}
              style={{width: 55, height: 55, borderRadius: 15}}
            /> */}
              <View>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: color.black,
                    fontSize: 14,
                    letterSpacing: 0.5,
                  }}>
                  {item?.customer_name}
                </Text>
                <Text
                  style={{
                    fontWeight: '400',
                    color: 'gray',
                    fontSize: 12,
                    marginTop: 4,
                  }}>
                  {item?.item_name}
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: 'gray',
                    fontSize: 14,
                    marginTop: 4,
                  }}>
                  {item?.barcode}
                </Text>
              </View>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => handlePressPrint()}
                style={{
                  padding: 12,
                  borderRadius: 15,
                  backgroundColor: color.primaryLight,
                  height: 50,
                  width: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="printer" size={24} color={color.primaryColor} />
              </TouchableOpacity>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default ListViewItem;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});
