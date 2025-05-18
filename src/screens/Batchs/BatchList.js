import {useEffect, useState} from 'react';
import {StatusBar, View} from 'react-native';
import ListViewBatch from '../../compenents/ListViewBatch';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListBatch} from '../../resource/Batch';

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
const BatchList = ({navigation, route}) => {
  const [list, setList] = useState([]);
  // const [list, setList] = useState(route.params?.list || []);
  useEffect(() => {
    loadData();
  }, []);

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
      <Header title={'List Batch'} />
      <ListViewBatch list={list} />
    </View>
  );
};

export default BatchList;
