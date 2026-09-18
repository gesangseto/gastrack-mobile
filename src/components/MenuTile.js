import Icon from '@react-native-vector-icons/lucide';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../constant/color';

// Kartu menu (hub) untuk tab Item / Batch.
const MenuTile = ({icon, iconBg, iconColor, title, desc, onPress, loading}) => (
  <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.tileIcon, {backgroundColor: iconBg}]}>
      <Icon name={icon} size={24} color={iconColor} />
    </View>
    <View style={{flex: 1}}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileDesc}>{desc}</Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={color.primaryColor} />
    ) : (
      <Icon name="chevron-right" size={20} color="#C4C4C4" />
    )}
  </TouchableOpacity>
);

export default MenuTile;

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  tileDesc: {
    fontSize: 11,
    color: '#8A8A8A',
    marginTop: 2,
  },
});
