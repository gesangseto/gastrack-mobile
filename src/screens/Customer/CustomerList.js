import Icon from '@react-native-vector-icons/lucide';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {getListCustomer} from '../../resource/Customer';

const CustomerList = ({navigation, route}) => {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('List Customer');

  useFocusEffect(
    useCallback(() => {
      if (route.params?.list) {
        setList(route.params.list);
        if (route.params?.title) {
          setTitle(route.params.title);
        }
      } else {
        loadData();
      }
      // route stabil seumur hidup screen; loadData sengaja tidak dijadikan dep
      // agar useFocusEffect tidak re-run tiap render (mencegah loop loadData)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const loadData = async () => {
    let response = await getListCustomer({}, true);
    if (response) {
      setList(response);
    }
  };

  const renderItem = (item, index) => {
    return (
      <Pressable
        onPress={() =>
          RootNavigation.navigate('CustomerEdit', {item: item})
        }
        key={index}
        style={styles.card}>
        <View style={styles.avatar}>
          <Icon name="user-round" size={20} color={color.primaryColor} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item?.name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item?.phone}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                item?.status === 'Active'
                  ? styles.statusDotActive
                  : styles.statusDotInactive,
              ]}
            />
            <Text
              style={styles.statusText}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item?.status}
              {item?.email ? ` • ${item.email}` : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            RootNavigation.navigate('CustomerEdit', {item: item})
          }
          style={styles.actionBtn}>
          <Icon name="pencil" size={16} color={color.warning} />
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={`${title} (${list.length})`} />
      <View style={styles.container}>
        <FlatList
          data={list}
          renderItem={({item, index}) => renderItem(item, index)}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        />
      </View>
    </View>
  );
};

export default CustomerList;

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
  avatar: {
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
  name: {
    fontWeight: '700',
    color: '#1F1F1F',
    fontSize: 14,
  },
  sub: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusDotActive: {
    backgroundColor: color.success,
  },
  statusDotInactive: {
    backgroundColor: '#C4C4C4',
  },
  statusText: {
    color: '#9A9A9A',
    fontSize: 11,
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