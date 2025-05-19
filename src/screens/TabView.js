import Icon from '@react-native-vector-icons/lucide';
import {useState} from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../constant/color';
import Home from './Home/Home';
import Profile from './Profile/Profile';
import Scanner from './Scanner/Scanner';

const TabView = () => {
  const [activeTab, setActiveTab] = useState({name: 'Home', param: null});
  const handleTabChange = (tabName, param = null) => {
    setActiveTab({name: tabName, param});
  };
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar barStyle={'dark-content'} backgroundColor={color.white} />
      {activeTab.name === 'Home' && <Home param={activeTab.param} />}
      {activeTab.name === 'Profile' && <Profile param={activeTab.param} />}
      {activeTab.name === 'Scanner' && (
        <Scanner
          param={activeTab.param}
          goToTab={handleTabChange} // <- ini penting
        />
      )}

      <View style={{position: 'absolute', bottom: 0, left: 0, right: 0}}>
        <View style={styles.wrapper}>
          <TouchableOpacity
            onPress={() => handleTabChange('Home')}
            style={styles.tabButton}>
            <View style={activeTab.name == 'Home' ? styles.activeTab : null}>
              <View>
                <Icon name="house" size={24} color={color.primaryColor} />
              </View>
              {activeTab.name == 'Home' && (
                <Text style={{fontSize: 12, color: color.primaryColor}}>
                  Home
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('Scanner')}
            style={styles.tabButton}>
            <View style={activeTab.name == 'Scanner' ? styles.activeTab : null}>
              <View>
                <Icon
                  name="scan-barcode"
                  size={24}
                  color={color.primaryColor}
                />
              </View>
              {activeTab.name == 'Scanner' && (
                <Text style={{fontSize: 12, color: color.primaryColor}}>
                  Scan
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange('Profile')}
            style={styles.tabButton}>
            <View style={activeTab.name == 'Profile' ? styles.activeTab : null}>
              <View>
                <Icon name="user" size={24} color={color.primaryColor} />
              </View>
              {activeTab.name == 'Profile' && (
                <Text style={{fontSize: 12, color: color.primaryColor}}>
                  Profile
                </Text>
              )}
            </View>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => handleTabChange('Home')}>
            <View>
              <Icon name="mail" size={24} color={color.primaryColor} />
            </View>
            <View
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
              }}>
              <View
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 10,
                  alignContent: 'center',
                  backgroundColor: color.secondaryColor,
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: color.white,
                    textAlign: 'center',
                  }}>
                  2
                </Text>
              </View>
            </View>
          </TouchableOpacity> */}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TabView;

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    padding: 4,
    height: Platform.OS === 'ios' ? 80 : 70,
    backgroundColor: '#fff',

    paddingBottom: Platform.OS === 'ios' ? 17 : 5,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  activeTab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: color.primaryLight,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
  tabButton: {
    minWidth: 100,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
