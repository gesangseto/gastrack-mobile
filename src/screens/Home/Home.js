import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useEffect, useRef, useState} from 'react';
import * as RootNavigation from '../../config/RootNavigation';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../../constant/color';
import Toast from 'react-native-toast-message';
import {getListBatch, getListUnfinishBatch} from '../../resource/Batch';
import {getItemByPhone, getItemWithoutBatch, getListItem} from '../../resource/Item';
import {getProfile, getSysConfig} from '../../storage';

const Home = ({param}) => {
  const [searchString, setSearchString] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState({items: 0, batchs: 0, unfinish: 0});
  const searchInputRef = useRef(null);

  useEffect(() => {
    setProfile(getProfile() || {});
  }, []);

  useEffect(() => {
    if (param?.data) {
      console.log(param?.data);

      setSearchString(param?.data);
      handleSearch(param?.data);
    }
  }, [param]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, []),
  );

  const handleSearch = async (data = null) => {
    let string = searchString;
    if (data) string = data;

    console.log(string);

    const digits = String(string || '').replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nomor HP tidak valid (9-15 digit)',
      });
      return;
    }
    let find = await getItemByPhone(string, true);
    if (find && find.length > 0) {
      RootNavigation.navigate('ItemList', {
        list: find,
        title: `Item ${find[0]?.customer_name || ''}`.trim(),
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Item tidak ditemukan untuk nomor HP tersebut',
      });
    }
  };

  const openItemWithoutBatch = async () => {
    let find = await getItemWithoutBatch(true);
    if (find && find.length > 0) {
      RootNavigation.navigate('ItemList', {
        list: find,
        title: 'Item Belum Batch',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tidak ada item yang belum dibuatkan batch',
      });
    }
  };

  const loadStats = async () => {
    let items = await getListItem({}, false);
    let batchs = await getListBatch({status: ['Shipping', 'Draft']}, false);
    let unfinish = await getListUnfinishBatch({}, false);
    setStats({
      items: items ? items.length : 0,
      batchs: batchs ? batchs.length : 0,
      unfinish: unfinish ? unfinish.length : 0,
    });
  };

  const onRefresh = () => {
    loadStats();
  };

  const greetingName = profile?.full_name || profile?.username || 'Pengguna';
  const phonePrefix = getSysConfig()?.country_code || '+62';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {greetingName}!</Text>
          <Text style={styles.subGreeting}>
            Jasa Titip Belanja — kami yang urus
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => RootNavigation.navigate('SettingsView')}>
            <Icon name="settings" size={20} color={color.primaryColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search by phone — fixed di bawah header */}
      <View style={styles.containerSearch}>
        <TouchableOpacity style={styles.searchIconContainer}>
          <Icon name="search" size={24} color={color.primaryColor} />
        </TouchableOpacity>
        <Text style={styles.searchPrefix}>{phonePrefix}</Text>
        <TextInput
          ref={searchInputRef}
          style={styles.textInput}
          placeholder="No. HP ..."
          value={searchString}
          onChangeText={text => setSearchString(text)}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
          keyboardType="phone-pad"
        />
        {searchString.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchString('');
              searchInputRef.current?.focus();
            }}>
            <Icon name="x" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => onRefresh()}
          />
        }
        contentContainerStyle={styles.scrollViewContent}
        style={{width: '100%', marginTop: Platform.OS === 'ios' ? 0 : 10}}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="shopping-bag" size={28} color={color.white} />
          </View>
          <Text style={styles.heroTitle}>Titip Belanja? Gas!</Text>
          <Text style={styles.heroSubtitle}>
            Catat barang titipan, buat batch, dan lacak sampai barang sampai.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.items}</Text>
              <Text style={styles.statLabel}>Item</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.batchs}</Text>
              <Text style={styles.statLabel}>Batch</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.unfinish}</Text>
              <Text style={styles.statLabel}>Belum Selesai</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => RootNavigation.navigate('BatchList')}>
            <View style={styles.quickActionIcon}>
              <Icon name="layers" size={24} color={color.white} />
            </View>
            <Text style={styles.quickActionLabel}>List Batch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => RootNavigation.navigate('BatchCreate')}>
            <View
              style={[
                styles.quickActionIcon,
                {backgroundColor: color.secondaryColor},
              ]}>
              <Icon name="package" size={24} color={color.white} />
            </View>
            <Text style={styles.quickActionLabel}>Buat Batch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={openItemWithoutBatch}>
            <View
              style={[styles.quickActionIcon, {backgroundColor: '#6D55B2'}]}>
              <Icon name="list" size={24} color={color.white} />
            </View>
            <Text style={styles.quickActionLabel}>List Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => RootNavigation.navigate('CustomerList')}>
            <View
              style={[styles.quickActionIcon, {backgroundColor: '#2E8B57'}]}>
              <Icon name="users" size={24} color={color.white} />
            </View>
            <Text style={styles.quickActionLabel}>List Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderColor: color.primaryLighter,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 10 : 15,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  subGreeting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9A9A9A',
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  hero: {
    marginTop: 18,
    backgroundColor: color.primaryColor,
    padding: 22,
    borderRadius: 30,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: color.white,
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#C9BCE8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: color.white,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: '#C9BCE8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
    marginTop: 8,
    textAlign: 'center',
  },
  containerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginTop: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  searchPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  clearButton: {
    padding: 6,
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 42,
  },
});
