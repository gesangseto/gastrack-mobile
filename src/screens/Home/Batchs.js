import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import color from '../../constant/color';
import {getListBatch} from '../../resource/Batch';
import * as RootNavigation from '../../config/RootNavigation';

const Batchs = props => {
  const {refresh} = props;
  const [list, setList] = useState([]);
  const handlePressAddBatch = () => {
    RootNavigation.navigate('BatchCreate');
  };
  const handlePressListBatch = () => {
    RootNavigation.navigate('BatchList', {list: list});
  };
  useEffect(() => {
    loadData();
  }, [refresh]);

  const loadData = async () => {
    let response = await getListBatch({status: ['on-progress', 'draft']});
    if (response) setList(response);
  };
  return (
    <View style={{marginTop: 15}}>
      <Text
        style={{
          ...styles.title1,
        }}>
        Batchs
      </Text>
      <View
        style={{
          marginTop: 10,
          backgroundColor: color.primaryColor,
          padding: 20,
          borderRadius: 30,
        }}>
        <Text style={styles.title}>List Batchs</Text>

        {/* <View style={{flexDirection: 'row', marginTop: 12}}>
          <Image
            source={{
              uri: 'https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg',
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: color.white,
            }}
          />

          <DoctorImage uri="https://t3.ftcdn.net/jpg/02/60/04/08/360_F_260040863_fYxB1SnrzgJ9AOkcT0hoe7IEFtsPiHAD.jpg" />

          <DoctorImage uri="https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg" />

          <DoctorImage uri="https://www.shutterstock.com/image-photo/young-asian-female-doctor-standing-600nw-2138546201.jpg" />
        </View> */}
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

export default Batchs;

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
