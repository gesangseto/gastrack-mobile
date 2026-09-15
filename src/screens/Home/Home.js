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
import {getItemByPhone, getItemWithoutBatch} from '../../resource/Item';
import {getProfile, getSysConfig} from '../../storage';
import {useHomeStore} from '../../store/homeStore';

const Home = ({param}) => {
  const [searchString, setSearchString] = useState('');
  const [profile, setProfile] = useState({});
  const searchInputRef = useRef(null);

  // Zustand store
  const items = useHomeStore(s => s.items);
  const batches = useHomeStore(s => s.batches);
  const unfinish = useHomeStore(s => s.unfinish);
  const refreshing = useHomeStore(s => s.refreshing);
  const offline = useHomeStore(s => s.offline);
  const hasCache = useHomeStore(s => s.hasCache);
  const lastUpdated = useHomeStore(s => s.lastUpdated);
  const fetchHome = useHomeStore(s => s.fetchHome);
  const initFromCache = useHomeStore(s => s.initFromCache);
  // Session jastip aktif (dari dashboard)
  const activeSession = useHomeStore(s => s.dashboard?.active_session);
  const sessionSummary = useHomeStore(s => s.dashboard?.session_summary);

  useEffect(() => {
    setProfile(getProfile() || {});
    // Tampilkan data cache terakhir secepatnya (tanpa nunggu network)
    initFromCache();
  }, [initFromCache]);

  const handleSearch = useCallback(
    async (data = null) => {
      let string = searchString;
      if (data) {string = data;}

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
    },
    [searchString],
  );

  useEffect(() => {
    if (param?.data) {
      setSearchString(param?.data);
      handleSearch(param?.data);
    }
  }, [param, handleSearch]);

  useFocusEffect(
    useCallback(() => {
      fetchHome(false);
    }, [fetchHome]),
  );

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

  const onRefresh = () => {
    fetchHome(true);
  };

  const greetingName = profile?.full_name || profile?.username || 'Pengguna';
  const phonePrefix = getSysConfig()?.country_code || '+62';

  const formatLastUpdated = ts => {
    if (!ts) {return '';}
    const d = new Date(ts);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            colors={[color.primaryColor]}
            tintColor={color.primaryColor}
          />
        }
        contentContainerStyle={styles.scrollViewContent}
        style={{width: '100%', marginTop: Platform.OS === 'ios' ? 0 : 10}}
        showsVerticalScrollIndicator={false}>
        {/* Session banner */}
        {activeSession ? (
          <TouchableOpacity
            style={styles.sessionBanner}
            onPress={() => RootNavigation.navigate('SessionView')}>
            <View style={styles.sessionBannerIcon}>
              <Icon name="play" size={18} color={color.white} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sessionBannerTitle}>
                Session aktif: {activeSession.session_no}
              </Text>
              <Text style={styles.sessionBannerSub}>
                {sessionSummary?.items_without_batch > 0
                  ? `${sessionSummary.items_without_batch} item belum batch`
                  : 'Semua item sudah batch'}
                {' • '}
                {sessionSummary?.batches_not_shipping > 0
                  ? `${sessionSummary.batches_not_shipping} batch belum kirim`
                  : 'Semua batch sudah kirim'}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={color.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.sessionBannerEmpty}
            onPress={() => RootNavigation.navigate('SessionView')}>
            <View style={styles.sessionBannerIconEmpty}>
              <Icon name="calendar-plus" size={18} color={color.primaryColor} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sessionBannerTitleEmpty}>
                Belum ada session aktif
              </Text>
              <Text style={styles.sessionBannerSubEmpty}>
                Buka session untuk mulai mencatat item titipan
              </Text>
            </View>
            <View style={styles.sessionBannerCta}>
              <Text style={styles.sessionBannerCtaText}>Mulai</Text>
            </View>
          </TouchableOpacity>
        )}

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
              <Text style={styles.statValue}>{items}</Text>
              <Text style={styles.statLabel}>Item</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{batches}</Text>
              <Text style={styles.statLabel}>Batch</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{unfinish}</Text>
              <Text style={styles.statLabel}>Belum Selesai</Text>
            </View>
          </View>
          {/* Status data: offline / last updated */}
          <View style={styles.statusRow}>
            {offline ? (
              <View style={styles.offlineBadge}>
                <Icon name="wifi-off" size={12} color="#FFD166" />
                <Text style={styles.offlineText}>
                  Offline — data terakhir {formatLastUpdated(lastUpdated)}
                </Text>
              </View>
            ) : hasCache ? (
              <Text style={styles.updatedText}>
                Update {formatLastUpdated(lastUpdated)}
              </Text>
            ) : null}
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
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primaryColor,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  sessionBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sessionBannerTitle: {
    color: color.white,
    fontSize: 13,
    fontWeight: '700',
  },
  sessionBannerSub: {
    color: '#C9BCE8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sessionBannerEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    padding: 14,
    marginTop: 16,
  },
  sessionBannerIconEmpty: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sessionBannerTitleEmpty: {
    color: '#1F1F1F',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionBannerSubEmpty: {
    color: '#6B6B6B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  sessionBannerCta: {
    backgroundColor: color.primaryColor,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sessionBannerCtaText: {
    color: color.white,
    fontSize: 12,
    fontWeight: '700',
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
  statusRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,209,102,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  offlineText: {
    color: '#FFD166',
    fontSize: 11,
    fontWeight: '600',
  },
  updatedText: {
    color: '#C9BCE8',
    fontSize: 11,
    fontWeight: '500',
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
