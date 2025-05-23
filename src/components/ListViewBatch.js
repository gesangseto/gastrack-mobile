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
import {shippingBatch} from '../resource/Batch';

const ListViewBatch = props => {
  const {list, refresh} = props;
  const [isLoading, setIsLoading] = useState(null);
  const handlePressPrint = async item => {
    setIsLoading(item.id);
    await printBarcode(item);
    setIsLoading(null);
  };
  const handlePressSubmit = async item => {
    try {
      let response = await shippingBatch(item);
      if (response && refresh) {
        refresh();
      }
    } catch (err) {
      //error handling
      console.log(err);
    }
  };

  const renderIncon = (item, index) => {
    if (item?.status == 'draft') {
      return <Icon name="file-clock" size={55} color={color.warning} />;
    } else if (item?.status == 'on-progress') {
      return <Icon name="plane" size={55} color={color.primaryColor} />;
    } else {
      return <Icon name="baggage-claim" size={55} color={color.success} />;
    }
  };
  const renderItem = (item, index) => {
    return (
      <Pressable
        onPress={() => RootNavigation.navigate('BatchView', {item: item})}
        key={index}
        style={styles.containerList2}>
        <View style={styles.leftIcon}>
          {renderIncon(item, index)}
          <View>
            <Text style={styles.h1}>{item?.batch_no}</Text>
            <Text style={styles.h3}>
              Quantity: {item?.total_quantity}, {item?.status}
            </Text>
            <Text style={styles.h2}>
              {moment(item?.created_at).format('YY-MM-DD HH:mm')}
            </Text>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 5,
          }}>
          {item?.status === 'draft' && (
            <TouchableOpacity
              onPress={() => handlePressSubmit(item)}
              style={styles.rightIcon}>
              <Icon name="send" size={24} color={color.primaryColor} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => handlePressPrint(item)}
            disabled={isLoading ? true : false}
            style={styles.rightIcon}>
            {isLoading && isLoading == item?.id ? (
              <ActivityIndicator size="small" color={color.primaryColor} />
            ) : (
              <Icon name="printer" size={24} color={color.primaryColor} />
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };
  return (
    <View style={styles.containerList1}>
      <FlatList
        data={list}
        renderItem={({item, index}) => renderItem(item, index)}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default ListViewBatch;

const styles = StyleSheet.create({
  containerList1: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
  },
  containerList2: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: color.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {height: 0.2, width: 0.2},
    elevation: 1,
    borderRadius: 20,
  },
  leftIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  rightIcon: {
    padding: 12,
    borderRadius: 15,
    backgroundColor: color.primaryLight,
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    fontWeight: 'bold',
    color: color.black,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  h2: {
    fontWeight: 'bold',
    color: 'gray',
    fontSize: 14,
    marginTop: 4,
  },
  h3: {
    fontWeight: '400',
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
});
