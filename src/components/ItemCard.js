import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../constant/color';
import {PRICE_UNIT_LIST} from '../constant/priceUnit';
import ImageThumbnail from './ImageThumbnail';

// Card item seragam untuk semua list item:
// - ListViewItem (list item + aksi edit/print)
// - BatchCreate (daftar item draft)
// - BatchView (item dalam batch + tombol hapus)
// - BatchItemPicker (pilih item + checkbox)
// Info yang ditampilkan: Photo, Nama, Phone, Price code (cost->selling), Status
//
// Mode priceCycle (dipakai List Item): bagian bawah harga bisa diklik dan
// berputar 3 titik data dari cyclePrice():
//   1. kode harga + unit: "Code: BCD (000) -> FED (000)"
//   2. mata uang cost: "USD: 123 -> 417"
//   3. mata uang selling: "IDR: 160023 -> 543000"
// Klik ke-4 → kembali ke titik 1.
const ItemCard = ({
  item,
  onPress,
  onRemove,
  selected,
  onToggle,
  right,
  size = 40,
  priceCycle = false,
  session = null,
  config = null,
  configSymbol = '',
  configRate = 1,
}) => {
  const [showNumbers, setShowNumbers] = useState(false);
  const [priceView, setPriceView] = useState(-1); // -1 = belum diklik
  // Reset toggle saat item berubah (list di-refresh / item diganti)
  useEffect(() => {
    setShowNumbers(false);
    setPriceView(-1);
  }, [item?.id]);

  const handlePress = onPress || (onToggle ? () => onToggle(item) : undefined);

  const cost = item?.cost_price;
  const selling = item?.selling_price;
  const costCode = item?.cost_code;
  const sellingCode = item?.selling_code;
  const hasCode = !!(costCode || sellingCode);

  // Format angka: digenapkan ke atas + titik ribuan (1.000.000)
  const fmtAngka = v => {
    if (v == null || v === '') return '-';
    const n = Math.ceil(Number(v));
    if (isNaN(n)) return '-';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // ===== Mode siklus harga (List Item) =====
  // Klik area harga → tampilkan 3 titik data dari cyclePrice() bergantian:
  //   1. kode harga + unit: "Code: BCD (000) -> FED (000)"
  //   2. mata uang cost: "USD: 123 -> 417"
  //   3. mata uang selling: "IDR: 160023 -> 543000"
  // Klik ke-4 → kembali ke titik 1.
  const canCycle = priceCycle && !!session && !!configSymbol;

  // Data 3 titik harga yang diputar saat price diklik
  const cyclePrice = () => {
    let cost_angka = null;
    let sell_angka = null;
    if (item.cost_unit !== 'none')
      cost_angka = PRICE_UNIT_LIST.find(it => it.value == item.cost_unit);
    if (item.selling_unit !== 'none')
      sell_angka = PRICE_UNIT_LIST.find(it => it.value == item.selling_unit);

    let cost = `${item.cost_code}${
      cost_angka ? ` (${cost_angka.multiplier})` : ``
    }`;
    let sell = `${item.selling_code}${
      sell_angka ? ` (${sell_angka.multiplier})` : ``
    }`;

    // exchange_rate = 1 unit cost_currency = X IDR (fallback 1 agar tidak NaN)
    const rate = Number(item.exchange_rate) || 1;

    return [
      `Code: ${cost} -> ${sell}`,
      `${item.foreign_currency}: ${fmtAngka(item.foreign_cost)} -> ${fmtAngka(
        item.foreign_price,
      )}`,
      `${item.local_currency}: ${fmtAngka(item.local_cost)} -> ${fmtAngka(
        item.local_price,
      )}`,
    ];
  };

  // Klik price → titik berikutnya (1 → 2 → 3 → kembali ke 1)
  const handleCyclePrice = () => {
    setPriceView(v => (v + 1) % 3);
  };

  // Default tampil cost_code → selling_code; tap icon eye → tampil angka
  const defaultPrice = hasCode
    ? showNumbers
      ? `${fmtAngka(cost)} → ${fmtAngka(selling)}`
      : `${costCode ?? '-'} → ${sellingCode ?? '-'}`
    : `${fmtAngka(cost)} → ${fmtAngka(selling)}`;

  // priceView = -1 → belum diklik (tampil default); >= 0 → titik cyclePrice
  const priceText =
    canCycle && priceView >= 0 ? cyclePrice()[priceView] : defaultPrice;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.boxImage}>
        <ImageThumbnail
          filename={item?.photo_thumbnail || item?.photo_path}
          size={size}
          radius={10}
        />
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text
            style={[styles.statusText, {maxWidth: size - 10}]}
            numberOfLines={1}>
            {item?.status_name || item?.status}
          </Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item?.customer_name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item?.customer_phone}
        </Text>
        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <TouchableOpacity
              onPress={handleCyclePrice}
              style={styles.priceTouch}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.price} numberOfLines={1}>
                {priceText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.boxImage}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText} numberOfLines={1}>
            {item?.quantity} pcs
          </Text>
        </View>
        <View style={styles.statusRow}>
          {onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(item)}
              style={styles.removeBtn}>
              <Icon name="x" size={16} color={color.danger} />
            </TouchableOpacity>
          )}
          {onToggle && (
            <View
              style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Icon name="check" size={14} color={color.white} />}
            </View>
          )}
          {right}
        </View>
      </View>
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
    marginRight: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  priceTouch: {
    flexShrink: 1,
  },
  qtyBadge: {
    backgroundColor: color.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  qtyBadgeText: {
    color: color.primaryColor,
    fontSize: 11,
    fontWeight: '700',
  },
  boxImage: {
    alignItems: 'center',
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
