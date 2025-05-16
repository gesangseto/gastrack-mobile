import Icon from '@react-native-vector-icons/lucide';
import {useEffect, useState} from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../compenents/InputText';
import InputTextArea from '../../compenents/InputTextArea';
import UploadImage from '../../compenents/UploadImage';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {createItem} from '../../resource/Item';
import {getProfile} from '../../storage';
import Header from '../../layouts/Header';
const doctors = [
  {
    id: 1,
    name: 'Dr. jane cooper',
    position: 'Pediatrician',
    profilePhoto:
      'https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg',
  },
  {
    id: 2,
    name: 'Lily Taylor',
    position: 'Ophthalmologist',
    profilePhoto:
      'https://www.shutterstock.com/image-photo/profile-photo-attractive-family-doc-600nw-1724693776.jpg',
  },
  {
    id: 3,
    name: 'Max Parker',
    position: 'Endocrinologist',
    profilePhoto:
      'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg',
  },
  {
    id: 4,
    name: 'John Doe',
    position: 'Pediatrician',
    profilePhoto:
      'https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg',
  },
  {
    id: 5,
    name: 'John Doe',
    position: 'Pediatrician',
    profilePhoto:
      'https://www.shutterstock.com/image-photo/healthcare-medical-staff-concept-portrait-600nw-2281024823.jpg',
  },
];
const ItemList = ({navigation, route}) => {
  const list = route.params?.list || [];

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header />
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
                <Image
                  source={{uri: item?.profilePhoto}}
                  style={{width: 55, height: 55, borderRadius: 15}}
                />
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
                  style={{
                    padding: 12,
                    borderRadius: 15,
                    backgroundColor: color.primaryLight,
                    height: 50,
                    width: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon
                    name="phone-call"
                    size={24}
                    color={color.primaryColor}
                  />
                </TouchableOpacity>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
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
