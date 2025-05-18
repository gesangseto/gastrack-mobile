import Icon from '@react-native-vector-icons/lucide';
import moment from 'moment';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import {useEffect, useState} from 'react';
import {cancelBatch, getListBatch} from '../../resource/Batch';
import ListViewItem from '../../compenents/ListViewItem';

const BatchView = ({navigation, route}) => {
  let item = route.params?.item || {};
  const [data, setData] = useState(null);
  const [list, setList] = useState([]);
  useEffect(() => {
    loadData();
  }, [item]);

  const loadData = async () => {
    let response = await getListBatch({batch_no: item.batch_no});
    if (response && response[0]) {
      setData(response[0]);
      setList(response[0].items);
    }
  };

  const handlePressDelete = async () => {
    let response = await cancelBatch({batch_no: item.batch_no});
    if (response) {
      RootNavigation.goBack();
    }
  };
  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View
          style={{
            width: '100%',
            height: Platform.OS === 'ios' ? 270 : 230,
            backgroundColor: color.primaryColor,
            paddingHorizontal: 30,
          }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: Platform.OS === 'ios' ? 50 : 5,
            }}>
            <TouchableOpacity
              onPress={() => {
                RootNavigation.goBack();
              }}
              style={{
                padding: 10,
                alignItems: 'left',
                justifyContent: 'center',
              }}>
              <Icon name="arrow-left" size={25} color={color.white} />
            </TouchableOpacity>
            <View />
          </View>
          {/* Pre Header */}
          <View
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignContent: 'center',
              gap: 20,
              flexDirection: 'row',
              marginTop: 10,
            }}>
            <View
              style={{
                justifyContent: 'center',
                alignContent: 'center',
                flexDirection: 'column',
              }}>
              {item?.status == 'draft' ? (
                <Icon name="file-clock" size={80} color={color.white} />
              ) : (
                <Icon name="plane" size={80} color={color.white} />
              )}

              {/* <Image
                source={require('../../asset/icon/user.png')}
                style={{width: 80, height: 80, borderRadius: 20}}
              /> */}
              {/* <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: color.white,
                textAlign: 'center',
                marginTop: 8,
              }}>
              4.5 <Icon name="star" size={15} color={color.white} />{' '}
            </Text> */}
            </View>
            <View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: color.white,
                }}>
                {data?.batch_no || 'account not set'}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: color.white,
                  marginTop: 4,
                }}>
                Quantity: {data?.total_quantity}, {data?.status}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: color.white,
                  marginTop: 4,
                }}>
                {moment(item?.created_at).format('YYYY-MM-DD HH:mm')}
              </Text>
            </View>
            {item?.status === 'draft' && (
              <View
                style={{
                  flex: 1,
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => handlePressDelete()}
                  style={{
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: color.danger,
                    height: 40,
                    width: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name="trash-2" size={25} color={color.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* <ListView /> */}
        <ListViewItem list={list} />
      </ScrollView>
    </View>
  );
};

export default BatchView;

const styles = StyleSheet.create({
  title: {
    color: color.primaryColor,
    fontSize: 20,
    fontWeight: '700',
  },
  containerDetail: {
    marginBottom: 12,
  },
  titleDetail: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  valueDetail: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
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
