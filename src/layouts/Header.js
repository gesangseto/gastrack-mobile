import Icon from '@react-native-vector-icons/lucide';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';

const Header = ({title}) => {
  return (
    <View
      style={{
        width: '100%',
        height: Platform.OS === 'ios' ? 140 : 90,
        backgroundColor: color.primaryColor,
        paddingHorizontal: 15,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: Platform.OS === 'ios' ? 50 : 5,
        }}>
        <View />
        <View style={{flex: 1}}>
          <TouchableOpacity
            onPress={() => {
              RootNavigation.goBack();
            }}
            style={{
              padding: 10,
              alignItems: 'left',
              justifyContent: 'center',
            }}>
            <Icon name="arrow-left" size={25} color={color.white} />
          </TouchableOpacity>
        </View>
        <View style={{flex: 1}}>
          <Text
            style={{
              padding: 10,
              fontSize: 18,
              fontWeight: '700',
              color: color.white,
              textAlign: 'right',
            }}>
            {title ? title : 'No Title'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  title: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
});
