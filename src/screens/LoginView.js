import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useRef, useState} from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {loginSeller} from '../resource/Login';
import {getProfile, setProfile} from '../storage';

const LoginView = ({navigation, route}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const passwordInputRef = useRef(null); // ← Ref untuk password input

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
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View
          style={{
            width: '100%',
            height: Platform.OS === 'ios' ? 300 : 180,
            backgroundColor: color.primaryColor,
            paddingHorizontal: 30,
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: Platform.OS === 'ios' ? 85 : 5,
            }}>
            <View />
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

          {/* Logo + Title */}
          <View
            style={{
              flexDirection: 'row',
              gap: 20,
              marginTop: 10,
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
                style={{fontSize: 22, fontWeight: '700', color: color.white}}>
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
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '500',
                  color: '#B1A3D2',
                  marginTop: 4,
                }}>
                Your Warehouse Partner
              </Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.container}>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Nomor Telepon"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            style={styles.input}
            textAlign="center"
            onSubmitEditing={() => passwordInputRef.current?.focus()} // ← pindah ke password
          />
          <TextInput
            ref={passwordInputRef} // ← set ref
            value={password}
            onChangeText={setPassword}
            placeholder="Kata Sandi"
            secureTextEntry
            style={styles.input}
            textAlign="center"
            onSubmitEditing={handleLogin} // ← ini yang penting
          />
        </View>

        {/* Button */}
        <View style={{alignItems: 'center', marginTop: 20, padding: 40}}>
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text
              style={{color: color.white, fontSize: 16, fontWeight: 'bold'}}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: color.primaryColor,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
});
