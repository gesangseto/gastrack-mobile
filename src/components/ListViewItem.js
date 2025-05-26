import Icon from '@react-native-vector-icons/lucide';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {printBarcode} from '../helper/helper';
import ImageThumbnail from './ImageThumbnail';

const ListViewItem = props => {
  const {list, refresh} = props;
  const [isLoading, setIsLoading] = useState(false);
  const handlePressPrint = async item => {
    setIsLoading(true);
    await printBarcode(item);
    setIsLoading(false);
  };
  const handlePressEdit = async item => {
    RootNavigation.navigate('ItemCreate', {item: item});
  };

  const renderItem = (item, index) => {
    return (
      <Pressable
        onPress={() => RootNavigation.navigate('ItemView', {item: item})}
        key={index}
        style={styles.containerList2}>
        <View style={styles.leftIcon}>
          <ImageThumbnail filename={item?.photo} />

          <View>
            <Text style={styles.h2}>{item?.barcode}</Text>
            <Text style={styles.h3}>{item?.customer_name}</Text>
            <Text style={styles.h3}>{item?.item_name}</Text>
            <Text style={styles.h3}>{item?.status}</Text>
          </View>
        </View>
        <View style={{flexDirection: 'row'}}>
          {item.status == 'draft' ? (
            <TouchableOpacity
              onPress={() => handlePressEdit(item)}
              style={styles.rightIcon}>
              <Icon name="pencil" size={24} color={color.warning} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => handlePressPrint(item)}
            disabled={isLoading ? true : false}
            style={styles.rightIcon}>
            {isLoading && isLoading == item?.id ? (
              <ActivityIndicator size="small" color={color.primaryColor} />
            ) : (
              <Icon name="printer" size={24} color={color.primaryColor} />
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };
  return (
    <View style={styles.containerList1}>
      <FlatList
        data={list}
        renderItem={({item, index}) => renderItem(item, index)}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
      />
    </View>
  );
};

export default ListViewItem;

const styles = StyleSheet.create({
  containerList1: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  containerList2: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: color.brokenWhite,
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
    marginHorizontal: 5,
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
