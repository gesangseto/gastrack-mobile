import {useEffect, useState} from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import InputText from '../../compenents/InputText';
import color from '../../constant/color';
import {getProfile, removeProfile} from '../../storage';
import Icon from '@react-native-vector-icons/lucide';

const Profile = ({navigation, route}) => {
  const [profile, setProfile] = useState({});
  useEffect(() => {
    if (getProfile()) setProfile(getProfile());
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
            height: Platform.OS === 'ios' ? 270 : 230,
            backgroundColor: color.primaryColor,
            paddingHorizontal: 30,
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: Platform.OS === 'ios' ? 40 : 5,
            }}>
            <View />
            <TouchableOpacity
              onPress={() => {
                removeProfile();
                RootNavigation.navigateReplace('LoginView');
              }}
              style={{
                borderRadius: 15,
                borderWidth: 1,
                borderColor: color.white,
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="log-out" size={25} color={color.white} />
            </TouchableOpacity>
          </View>
          {/* Pre Header */}
          <View
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignContent: 'center',
              gap: 20,
              flexDirection: 'row',
              marginTop: 10,
            }}>
            <View
              style={{
                justifyContent: 'center',
                alignContent: 'center',
                flexDirection: 'column',
              }}>
              <Image
                source={require('../../asset/icon/user.png')}
                style={{width: 80, height: 80, borderRadius: 20}}
              />
              {/* <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: color.white,
                textAlign: 'center',
                marginTop: 8,
              }}>
              4.5 <Icon name="star" size={15} color={color.white} />{' '}
            </Text> */}
            </View>
            <View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: color.white,
                }}>
                {profile?.account || 'account not set'}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#B1A3D2',
                  marginTop: 4,
                }}>
                {profile?.name}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: color.white,
                  marginTop: 4,
                }}>
                {profile?.phone}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: color.white,
                  marginTop: 4,
                  textDecorationLine: 'underline',
                }}>
                {profile?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Form data */}
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
            <View>
              <Text
                style={{
                  ...styles.title,
                }}>
                Settings
              </Text>
              <View style={{marginTop: 18}}>
                <InputText
                  label="Name"
                  // value={phone}
                  // onChangeText={setPhone}
                  placeholder="Masukkan nama anda"
                />
                <InputText
                  label="Email"
                  // value={phone}
                  // onChangeText={setPhone}
                  placeholder="Masukkan email anda"
                />
                <InputText
                  label="Account Name"
                  // value={phone}
                  // onChangeText={setPhone}
                  placeholder="Masukkan nama akun anda"
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Under Construction 😎',
                  'we are under construction and please wait...',
                );
              }}
              style={{
                marginTop: 10,
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
                Save Settings
              </Text>
            </TouchableOpacity>
            <View
              style={{
                paddingBottom: 50,
              }}></View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  title: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
});
