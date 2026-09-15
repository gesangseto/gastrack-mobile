import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {printBarcode} from '../helper/helper';
import {fetchCountries, fetchExchangeRate} from '../resource/Country';
import {fetchDashboard} from '../resource/Dashboard';
import {getSysConfig} from '../storage';
import ItemCard from './ItemCard';

const ListViewItem = props => {
  const {list, refresh} = props;
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Data untuk siklus harga di ItemCard (titik 2 & 3)
  const [session, setSession] = useState(null);
  const [config, setConfig] = useState(getSysConfig() || {});
  const [configSymbol, setConfigSymbol] = useState('');
  const [configRate, setConfigRate] = useState(1);

  useEffect(() => {
    // Session aktif → simbol & rate mata uang (titik 2)
    fetchDashboard(false).then(d => {
      setSession(d?.active_session || null);
    });
    // Sys_configuration → unit selling & mata uang (titik 1 & 3)
    const cfg = getSysConfig() || {};
    setConfig(cfg);
    fetchCountries().then(countries => {
      const c = (countries || []).find(
        x => x.currency_code === cfg.currency,
      );
      setConfigSymbol(c?.currency_symbol || cfg.currency || '');
    });
    // Rate mata uang sys_configuration bila bukan IDR (titik 3)
    if (cfg.currency && cfg.currency !== 'IDR') {
      fetchExchangeRate(cfg.currency).then(r => setConfigRate(r || 1));
    } else {
      setConfigRate(1);
    }
  }, []);

  const handlePressPrint = async item => {
    setIsLoading(item.id);
    await printBarcode(item);
    setIsLoading(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (refresh) {
      await refresh();
    }
    setRefreshing(false);
  };
  const handlePressEdit = async item => {
    RootNavigation.navigate('ItemCreate', {item: item});
  };

  const renderItem = (item, index) => {
    return (
      <ItemCard
        key={index}
        item={item}
        size={44}
        onPress={() => RootNavigation.navigate('ItemView', {item: item})}
        priceCycle
        session={session}
        config={config}
        configSymbol={configSymbol}
        configRate={configRate}
        right={
          <View style={styles.actions}>
            {item.status == 200 ? (
              <TouchableOpacity
                onPress={() => handlePressEdit(item)}
                style={styles.actionBtn}>
                <Icon name="pencil" size={16} color={color.warning} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => handlePressPrint(item)}
              disabled={isLoading ? true : false}
              style={styles.actionBtn}>
              {isLoading && isLoading == item?.id ? (
                <ActivityIndicator size="small" color={color.primaryColor} />
              ) : (
                <Icon name="printer" size={16} color={color.primaryColor} />
              )}
            </TouchableOpacity>
          </View>
        }
      />
    );
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        renderItem={({item, index}) => renderItem(item, index)}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[color.primaryColor]}
          />
        }
      />
    </View>
  );
};

export default ListViewItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
