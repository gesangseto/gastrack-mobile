import Icon from '@react-native-vector-icons/lucide';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../config/RootNavigation';
import color from '../constant/color';
import {printBarcode} from '../helper/helper';
import {getEndpoint} from '../storage';
import Thumbnail from './Thumbnail';

const ListViewItem = props => {
  const {list, refresh} = props;
  const [isLoading, setIsLoading] = useState(false);
  const handlePressPrint = async item => {
    setIsLoading(true);
    await printBarcode(item);
    setIsLoading(false);
  };

  return (
    <View style={styles.containerList1}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        {list?.map((item, index) => {
          let imageUrl = null;
          if (item?.photo)
            imageUrl = `${getEndpoint()}/api/v1/helper/image/thumbnail?filename=${
              item?.photo
            }`;
          return (
            <Pressable
              onPress={() => RootNavigation.navigate('ItemView', {item: item})}
              key={index}
              style={styles.containerList2}>
              <View style={styles.leftIcon}>
                <Thumbnail filename={item?.photo} />

                <View>
                  <Text style={styles.h2}>{item?.customer_name}</Text>
                  <Text style={styles.h3}>{item?.item_name}</Text>
                  <Text style={styles.h2}>{item?.barcode}</Text>
                  <Text style={styles.h2}>{item?.photo}</Text>
                </View>
              </View>
              <View>
                <TouchableOpacity
                  onPress={() => handlePressPrint(item)}
                  disabled={isLoading ? true : false}
                  style={styles.rightIcon}>
                  {isLoading && isLoading == item?.id ? (
                    <ActivityIndicator
                      size="small"
                      color={color.primaryColor}
                    />
                  ) : (
                    <Icon name="printer" size={24} color={color.primaryColor} />
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ListViewItem;

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
