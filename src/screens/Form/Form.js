import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../../constant/color';
import DetailsContent from './DetailsContent';
import DetailsHeader from './DetailsHeader';
import DetailsProfile from './DetailsProfile';

const Form = ({navigation, route}) => {
  const {doctor} = route.params;
  console.log(doctor);
  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <View
        style={{
          width: '100%',
          height: Platform.OS === 'ios' ? 320 : 280,
          backgroundColor: color.primaryColor,
          paddingHorizontal: 30,
        }}>
        <DetailsHeader />
        <DetailsProfile doctor={doctor} />
      </View>

      <View
        style={{
          flex: 1,
          backgroundColor: color.white,
          marginTop: -40,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          padding: 30,
        }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DetailsContent />
          <View
            style={{
              paddingBottom: 200,
            }}></View>
        </ScrollView>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 30,
          left: 40,
          right: 40,
        }}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Under Construction 😎',
              'we are under construction and please wait...',
            );
          }}
          style={{
            borderRadius: 20,
            backgroundColor: color.primaryColor,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
          <Text
            style={{
              color: color.white,
              fontSize: 16,
              fontWeight: 'bold',
            }}>
            Book Appointment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Form;

const styles = StyleSheet.create({});
