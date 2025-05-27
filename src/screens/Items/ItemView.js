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
import {cancelItem} from '../../resource/Item';
import ImageThumbnail from '../../components/ImageThumbnail';
import {useState} from 'react';
import ImageViewer from '../../components/ImageViewer';

const ItemView = ({navigation, route}) => {
  let item = route.params?.item || {};
  const [visibleImageViewer, setVisibleImageViewer] = useState(false);

  const handlePressDelete = async () => {
    let response = await cancelItem({barcode: item.barcode});
    if (response) {
      RootNavigation.goBack();
    }
  };
  const handlePressEdit = async item => {
    RootNavigation.navigate('ItemCreate', {item: item});
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
            height: Platform.OS === 'ios' ? 270 : 175,
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
          {visibleImageViewer && (
            <ImageViewer
              filename={item?.photo}
              onClose={() => setVisibleImageViewer(false)}
            />
          )}
          {/* Pre Header */}
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity
              onPress={() => setVisibleImageViewer(true)}
              style={{
                justifyContent: 'center',
                alignContent: 'center',
                flexDirection: 'column',
                marginRight: 5,
              }}>
              <ImageThumbnail filename={item?.photo} />
            </TouchableOpacity>

            <View style={{width: 175}}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: color.white,
                }}>
                {item?.customer_name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: color.white,
                  marginTop: 4,
                }}>
                {item?.customer_phone}
              </Text>
              <Text
                numberOfLines={3}
                ellipsizeMode="tail"
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: color.white,
                  marginTop: 4,
                }}>
                {item?.customer_address}
              </Text>
            </View>
            {item?.status === 'draft' && (
              <View
                style={{
                  flexDirection: 'row',
                }}>
                <TouchableOpacity
                  onPress={() => handlePressEdit(item)}
                  style={styles.iconRight}>
                  <Icon name="pencil" size={15} color={color.warning} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handlePressDelete()}
                  style={styles.iconRight}>
                  <Icon name="trash-2" size={15} color={color.danger} />
                </TouchableOpacity>
              </View>
            )}
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
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Destination Address</Text>
                  <Text style={styles.valueDetail}>
                    {item?.customer_destination_address || '-'}
                  </Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Destination Phone</Text>
                  <Text style={styles.valueDetail}>
                    {item?.customer_destination_phone || '-'}
                  </Text>
                </View>
                <View style={styles.containerDetail}>
                  <Text style={styles.titleDetail}>Destination PIC</Text>
                  <Text style={styles.valueDetail}>
                    {item?.customer_destination_name || '-'}
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
  iconRight: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.brokenWhite,
    height: 30,
    width: 30,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
