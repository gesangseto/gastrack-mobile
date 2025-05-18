import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import color from '../../constant/color';
import * as RootNavigation from '../../config/RootNavigation';
import {getListItem} from '../../resource/Item';

const Items = props => {
  const {refresh} = props;
  const [list, setList] = useState([]);
  const handlePressAddItem = () => {
    RootNavigation.navigate('ItemCreate');
  };
  const handlePressListItem = () => {
    RootNavigation.navigate('ItemList', {list: list});
  };
  useEffect(() => {
    loadData();
  }, [refresh]);

  const loadData = async () => {
    let getdata = await getListItem({});
    if (getdata) setList(getdata);
  };

  return (
    <View style={{marginTop: 15}}>
      <Text
        style={{
          ...styles.title1,
        }}>
        Items
      </Text>
      <View
        style={{
          marginTop: 15,
          backgroundColor: color.primaryColor,
          padding: 20,
          borderRadius: 30,
        }}>
        <Text style={styles.title}>List Items</Text>
        <View
          style={{
            flexDirection: 'row',
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              backgroundColor: '#6D55B2',
              borderRadius: 20,
            }}
            onPress={() => handlePressListItem()}>
            <Text style={{...styles.title, fontSize: 14}}>
              . . . {list.length} Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePressAddItem()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              backgroundColor: color.white,
              borderRadius: 15,
            }}>
            <Text
              style={{
                ...styles.title,
                fontSize: 14,
                color: color.primaryColor,
              }}>
              Tambah Item
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Items;

const styles = StyleSheet.create({
  title1: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    color: color.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

const DoctorImage = ({uri}) => {
  return (
    <Image
      source={{
        uri,
      }}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: color.white,
        marginLeft: -10,
      }}
    />
  );
};
