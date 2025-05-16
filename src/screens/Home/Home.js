import Icon from '@react-native-vector-icons/lucide';
import {useState} from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../../constant/color';
import Batchs from './Batchs';
import Items from './Items';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <ScrollView
      style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        marginTop: Platform.OS === 'ios' ? 0 : 30,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Search */}
      <View style={styles.container}>
        <TouchableOpacity style={styles.searchIconContainer}>
          <Icon name="search" size={24} color={color.primaryColor} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Search Barcode ..."
          value={searchTerm}
          onChangeText={text => setSearchTerm(text)}
        />
      </View>
      <Items />
      <Batchs />
      {/* <HeadLine /> */}
      {/* <Category /> */}
      {/* <Doctor /> */}
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: color.primaryLighter,
  },
  searchIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 42,
  },
});
