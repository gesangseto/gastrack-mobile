import Icon from '@react-native-vector-icons/lucide';
import moment from 'moment';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';

const ItemView = ({navigation, route}) => {
  let item = route.params?.item || {};
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
              <Icon name="circle-help" size={80} color={color.white} />

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
                {item?.customer_name || 'account not set'}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: color.white,
                  marginTop: 4,
                }}>
                {item?.customer_phone}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: color.white,
                  marginTop: 4,
                  textDecorationLine: 'underline',
                }}>
                {item?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Form data */}
        <View
          style={{
            flex: 1,
            backgroundColor: color.white,
            marginTop: -40,
            borderTopLeftRadius: 35,
            borderTopRightRadius: 35,
            padding: 30,
          }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <Text
                style={{
                  ...styles.title,
                }}>
                Detail
              </Text>
              <View style={{marginTop: 18}}>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Order Time</Text>
                  <Text style={styles.valueDetail}>
                    {moment(item?.created_at).format('YYYY-MM-DD HH:mm ')}
                  </Text>
                  <Text style={styles.titleDetail}>Last Update</Text>
                  <Text style={styles.valueDetail}>
                    {moment(item?.updated_at).format('YYYY-MM-DD HH:mm ')}
                  </Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Barcode</Text>
                  <Text style={styles.valueDetail}>{item?.barcode}</Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Item Name</Text>
                  <Text style={styles.valueDetail}>{item?.item_name}</Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Batch No</Text>
                  <Text style={styles.valueDetail}>
                    {item?.batch_no || '-'}
                  </Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Status</Text>
                  <Text style={styles.valueDetail}>{item?.status}</Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Location Transit</Text>
                  <Text style={styles.valueDetail}>
                    {item?.warehouse_name || '-'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default ItemView;

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
});
