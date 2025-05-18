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
import moment from 'moment';

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
const ListViewBatch = props => {
  const {list} = props;

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
  const handlePressSubmit = async item => {
    // inside async function
    try {
      let response = await shippingBatch(item);
      if (response) {
        await loadData();
      }
    } catch (err) {
      //error handling
      console.log(err);
    }
  };

  return (
    <View style={styles.containerList1}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {list?.map((item, index) => (
          <Pressable
            onPress={() => RootNavigation.navigate('BatchView', {item: item})}
            key={index}
            style={styles.containerList2}>
            <View style={styles.leftIcon}>
              {item?.status == 'draft' ? (
                <Icon name="file-clock" size={55} color={color.warning} />
              ) : (
                <Icon name="plane" size={55} color={color.primaryColor} />
              )}
              <View>
                <Text style={styles.h1}>{item?.batch_no}</Text>
                <Text style={styles.h3}>
                  Quantity: {item?.total_quantity}, {item?.status}
                </Text>
                <Text style={styles.h2}>
                  {moment(item?.created_at).format('YY-MM-DD HH:mm')}
                </Text>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 5,
              }}>
              {item?.status === 'draft' && (
                <TouchableOpacity
                  onPress={() => handlePressSubmit(item)}
                  style={styles.rightIcon}>
                  <Icon name="send" size={24} color={color.primaryColor} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => handlePressPrint()}
                style={styles.rightIcon}>
                <Icon name="printer" size={24} color={color.primaryColor} />
              </TouchableOpacity>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default ListViewBatch;

const styles = StyleSheet.create({
  containerList1: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
  },
  containerList2: {
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
  },
  leftIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  rightIcon: {
    padding: 12,
    borderRadius: 15,
    backgroundColor: color.primaryLight,
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    fontWeight: 'bold',
    color: color.black,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  h2: {
    fontWeight: 'bold',
    color: 'gray',
    fontSize: 14,
    marginTop: 4,
  },
  h3: {
    fontWeight: '400',
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
});
