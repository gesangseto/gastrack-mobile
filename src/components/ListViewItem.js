import Icon from '@react-native-vector-icons/lucide';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {printBarcode} from '../helper/helper';
import ItemCard from './ItemCard';

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
      <ItemCard
        key={index}
        item={item}
        size={44}
        onPress={() => RootNavigation.navigate('ItemView', {item: item})}
        right={
          <View style={styles.actions}>
            {item.status == 200 ? (
              <TouchableOpacity
                onPress={() => handlePressEdit(item)}
                style={styles.actionBtn}>
                <Icon name="pencil" size={16} color={color.warning} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => handlePressPrint(item)}
              disabled={isLoading ? true : false}
              style={styles.actionBtn}>
              {isLoading && isLoading == item?.id ? (
                <ActivityIndicator size="small" color={color.primaryColor} />
              ) : (
                <Icon name="printer" size={16} color={color.primaryColor} />
              )}
            </TouchableOpacity>
          </View>
        }
      />
    );
  };
  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});