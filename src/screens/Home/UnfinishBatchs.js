import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import color from '../../constant/color';
import {getListBatch, getListUnfinishBatch} from '../../resource/Batch';
import * as RootNavigation from '../../config/RootNavigation';

const UnfinishBatchs = props => {
  const {refresh} = props;
  const [list, setList] = useState([]);
  const handlePressAddBatch = () => {
    RootNavigation.navigate('BatchCreate');
  };

  const handlePressListBatch = () => {
    RootNavigation.navigate('BatchList', {list: list, title: 'Unfinish'});
  };

  useEffect(() => {
    loadData();
  }, [refresh]);

  const loadData = async () => {
    let response = await getListUnfinishBatch({});
    if (response) setList(response);
  };
  return (
    <View style={{marginTop: 15}}>
      <Text
        style={{
          ...styles.title1,
        }}>
        Unfinish Batchs
      </Text>
      <View
        style={{
          marginTop: 10,
          backgroundColor: color.primaryColor,
          padding: 20,
          borderRadius: 30,
        }}>
        <Text style={styles.title}>List Unfinish Batchs</Text>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <TouchableOpacity
            onPress={() => handlePressListBatch()}
            style={{
              paddingVertical: 5,
              paddingHorizontal: 12,
              backgroundColor: '#6D55B2',
              borderRadius: 20,
            }}>
            <Text style={{...styles.title, fontSize: 14}}>
              . . . {list.length} Batchs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePressAddBatch()}
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
              Tambah Batch
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default UnfinishBatchs;

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
