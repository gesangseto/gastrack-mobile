import Icon from '@react-native-vector-icons/lucide';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';

const Header = ({title}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          RootNavigation.goBack();
        }}
        style={styles.backBtn}>
        <Icon name="arrow-left" size={25} color={color.white} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title ? title : 'No Title'}
      </Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? 140 : 90,
    backgroundColor: color.primaryColor,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 5,
  },
  backBtn: {
    padding: 10,
    marginLeft: -10,
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: color.white,
    marginLeft: 4,
  },
});