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
import {syncContactsIfNeeded} from '../helper/contactSync';
import BatchTab from './Batchs/BatchTab';
import Home from './Home/Home';
import ItemTab from './Items/ItemTab';
import PaymentTab from './Payment/PaymentTab';
import SettingsView from './Settings/SettingsView';

// Urutan bottom navigation: Home • Batch • Item • Payment • Setting
const TAB_ITEMS = [
  {name: 'Home', icon: 'house', label: 'Home'},
  {name: 'Batch', icon: 'layers', label: 'Batch'},
  {name: 'Item', icon: 'package', label: 'Item'},
  {name: 'Payment', icon: 'wallet', label: 'Payment'},
  {name: 'Setting', icon: 'settings', label: 'Setting'},
];

const TabView = () => {
  const [activeTab, setActiveTab] = useState('Home');

  // Saat aplikasi pertama dibuka (setelah login): minta permission kontak,
  // jika disetujui sinkronkan kontak ke mst_customer (hanya sekali).
  useEffect(() => {
    syncContactsIfNeeded();
  }, []);

  const renderTabButton = item => {
    const active = activeTab === item.name;
    return (
      <TouchableOpacity
        key={item.name}
        onPress={() => setActiveTab(item.name)}
        style={styles.tabButton}>
        <View style={[styles.tabInner, active && styles.activeTab]}>
          <Icon
            name={item.icon}
            size={22}
            color={active ? color.primaryColor : '#9A9A9A'}
          />
          <Text
            style={[styles.tabLabel, active && styles.tabLabelActive]}
            numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar barStyle={'dark-content'} backgroundColor={color.white} />
      {activeTab === 'Home' && <Home />}
      {activeTab === 'Batch' && <BatchTab />}
      {activeTab === 'Item' && <ItemTab />}
      {activeTab === 'Payment' && <PaymentTab />}
      {activeTab === 'Setting' && <SettingsView inline />}

      <View style={{position: 'absolute', bottom: 0, left: 0, right: 0}}>
        <View style={styles.wrapper}>{TAB_ITEMS.map(renderTabButton)}</View>
      </View>
    </SafeAreaView>
  );
};

export default TabView;

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingTop: 4,
    height: Platform.OS === 'ios' ? 80 : 70,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 17 : 5,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 16,
    width: '100%',
  },
  activeTab: {
    backgroundColor: color.primaryLight,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9A9A9A',
    marginTop: 2,
  },
  tabLabelActive: {
    color: color.primaryColor,
  },
});
