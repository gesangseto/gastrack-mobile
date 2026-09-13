import Icon from '@react-native-vector-icons/lucide';
import moment from 'moment';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {printBarcode} from '../helper/helper';

const ListViewBatch = props => {
  const {list, refresh} = props;
  const [isLoading, setIsLoading] = useState(null);
  const handlePressPrint = async item => {
    setIsLoading(item.id);
    await printBarcode(item);
    setIsLoading(null);
  };
  const handlePressSubmit = async item => {
    // Shipment butuh shipment_number + shipment_price → isi di BatchView
    RootNavigation.navigate('BatchView', {item: item});
  };

  const renderIcon = (item, index) => {
    if (item?.status == 'Draft') {
      return <Icon name="file-clock" size={22} color={color.warning} />;
    } else if (item?.status == 'Shipping') {
      return <Icon name="plane" size={22} color={color.primaryColor} />;
    } else {
      return <Icon name="baggage-claim" size={22} color={color.success} />;
    }
  };
  const renderItem = (item, index) => {
    return (
      <Pressable
        onPress={() => RootNavigation.navigate('BatchView', {item: item})}
        key={index}
        style={styles.card}>
        <View style={styles.iconBox}>{renderIcon(item, index)}</View>
        <View style={styles.info}>
          <Text style={styles.batchNo} numberOfLines={1}>
            {item?.batch_no}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            Quantity: {item?.quantity} • {item?.status}
          </Text>
          <Text style={styles.date}>
            {moment(item?.created_date).format('YY-MM-DD HH:mm')}
          </Text>
        </View>
        <View style={styles.actions}>
          {item?.status === 'Draft' && (
            <TouchableOpacity
              onPress={() => handlePressSubmit(item)}
              style={styles.actionBtn}>
              <Icon name="send" size={16} color={color.primaryColor} />
            </TouchableOpacity>
          )}
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
      </Pressable>
    );
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        renderItem={({item, index}) => renderItem(item, index)}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
      />
    </View>
  );
};

export default ListViewBatch;

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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 12,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  batchNo: {
    fontWeight: '700',
    color: '#1F1F1F',
    fontSize: 14,
  },
  sub: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 2,
  },
  date: {
    color: '#C4C4C4',
    fontSize: 11,
    marginTop: 2,
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