import {StatusBar, StyleSheet, View} from 'react-native';
import ListViewItem from '../../compenents/ListViewItem';
import color from '../../constant/color';
import Header from '../../layouts/Header';

const ItemList = ({navigation, route}) => {
  const list = route.params?.list || [];

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={'List Item'} />
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
