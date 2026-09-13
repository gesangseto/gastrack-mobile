import Icon from '@react-native-vector-icons/lucide';
import {useEffect, useState} from 'react';
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
import * as RootNavigation from '../config/RootNavigation';
import {syncContactsIfNeeded} from '../helper/contactSync';
import Home from './Home/Home';
import Statistik from './Statistik/Statistik';

const TabView = () => {
  const [activeTab, setActiveTab] = useState({name: 'Home', param: null});
  const handleTabChange = (tabName, param = null) => {
    setActiveTab({name: tabName, param});
  };

  // Saat aplikasi pertama dibuka (setelah login): minta permission kontak,
  // jika disetujui sinkronkan kontak ke mst_customer (hanya sekali).
  useEffect(() => {
    syncContactsIfNeeded();
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar barStyle={'dark-content'} backgroundColor={color.white} />
      {activeTab.name === 'Home' && <Home param={activeTab.param} />}
      {activeTab.name === 'Statistik' && <Statistik param={activeTab.param} />}

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

          {/* Tombol Add (tengah) — buka form Item Registry */}
          <TouchableOpacity
            onPress={() => RootNavigation.navigate('ItemCreate')}
            style={styles.addButton}>
            <Icon name="plus" size={30} color={color.white} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTabChange('Statistik')}
            style={styles.tabButton}>
            <View style={activeTab.name == 'Statistik' ? styles.activeTab : null}>
              <View>
                <Icon name="chart-bar" size={24} color={color.primaryColor} />
              </View>
              {activeTab.name == 'Statistik' && (
                <Text style={{fontSize: 12, color: color.primaryColor}}>
                  Statistik
                </Text>
              )}
            </View>
          </TouchableOpacity>
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
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowColor: color.primaryColor,
    shadowOpacity: 0.4,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 12,
    elevation: 8,
  },
});