import Icon from '@react-native-vector-icons/lucide';
import {Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import color from '../constant/color';
import ImageThumbnail from './ImageThumbnail';

// Card item seragam untuk semua list item:
// - ListViewItem (list item + aksi edit/print)
// - BatchCreate (daftar item draft)
// - BatchView (item dalam batch + tombol hapus)
// - BatchItemPicker (pilih item + checkbox)
// Info yang ditampilkan: Photo, Nama, Phone, Price code (cost->selling), Status
const ItemCard = ({
  item,
  onPress,
  onRemove,
  selected,
  onToggle,
  right,
  size = 40,
}) => {
  const handlePress = onPress || (onToggle ? () => onToggle(item) : undefined);

  const cost = item?.cost_price;
  const selling = item?.selling_price;
  const priceCode = item?.price_code;
  const priceText = priceCode
    ? `${priceCode} (${cost ?? '-'} → ${selling ?? '-'})`
    : `${cost ?? '-'} → ${selling ?? '-'}`;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.card, selected && styles.cardSelected]}>
      <ImageThumbnail
        filename={item?.photo_thumbnail || item?.photo_path}
        size={size}
        radius={10}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item?.customer_name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item?.customer_phone}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price} numberOfLines={1}>
            {priceText}
          </Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText} numberOfLines={1}>
              {item?.status_name || item?.status}
            </Text>
          </View>
        </View>
      </View>
      {onRemove && (
        <TouchableOpacity
          onPress={() => onRemove(item)}
          style={styles.removeBtn}>
          <Icon name="x" size={16} color={color.danger} />
        </TouchableOpacity>
      )}
      {onToggle && (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Icon name="check" size={14} color={color.white} />}
        </View>
      )}
      {right}
    </Pressable>
  );
};

export default ItemCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    padding: 10,
    marginBottom: 8,
  },
  cardSelected: {
    borderColor: color.primaryColor,
    backgroundColor: color.primaryLighter,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontWeight: '700',
    color: '#1F1F1F',
    fontSize: 14,
  },
  sub: {
    color: '#9A9A9A',
    fontSize: 12,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  price: {
    color: color.primaryColor,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.success,
    marginRight: 4,
  },
  statusText: {
    color: '#9A9A9A',
    fontSize: 11,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D0D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
});