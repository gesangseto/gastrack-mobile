import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../constant/color';
import {loginSeller} from '../resource/Login';
import {getProfile, setProfile} from '../storage';
import * as RootNavigation from '../config/RootNavigation';
const LoginView = ({navigation, route}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    let response = await loginSeller({phone: phone, password: password});
    if (response) {
      setProfile(response);
      return RootNavigation.navigateReplace('TabView');
    }
  };
  useEffect(() => {
    const checkLogin = async () => {
      const profile = await getProfile();
      if (profile) {
        RootNavigation.navigateReplace('TabView');
      }
    };
    checkLogin();
  }, []);
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 60 : 20,
          }}>
          <View></View>
          <View>
            <TouchableOpacity
              style={{
                borderRadius: 15,
                borderWidth: 1,
                borderColor: color.white,
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="circle-help" size={25} color={color.white} />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignContent: 'center',
            gap: 20,
            flexDirection: 'row',
            marginTop: 30,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignContent: 'center',
              flexDirection: 'column',
            }}>
            <Icon name="baggage-claim" size={80} color={color.white} />
          </View>
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: color.white,
              }}>
              GasTrack
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#B1A3D2',
                marginTop: 4,
              }}>
              By Gesang Aji Seto
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Nomor Telepon"
          keyboardType="phone-pad"
          style={styles.input}
          textAlign="center"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Kata Sandi"
          secureTextEntry
          style={styles.input}
          textAlign="center"
        />
      </View>
      <View style={{paddingBottom: 200}}></View>

      <View style={{position: 'absolute', bottom: 30, left: 40, right: 40}}>
        <TouchableOpacity
          onPress={() => handleLogin()}
          style={styles.loginButton}>
          <Text style={{color: color.white, fontSize: 16, fontWeight: 'bold'}}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default LoginView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
  },
  input: {
    width: '100%',
    height: 50,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  loginButton: {
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
