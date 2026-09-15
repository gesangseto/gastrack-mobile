import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
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
// berputar 3 titik:
//   1. kode harga + unit (nol): "BCD (000) → FED (000)"
//   2. konversi ke mata uang session jastip: "(P) 123 → (P) 417"
//   3. konversi ke mata uang sys_configuration: "(Rp) 160023 → (Rp) 543000"
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
  const [priceView, setPriceView] = useState(0);
  // Reset toggle saat item berubah (list di-refresh / item diganti)
  useEffect(() => {
    setShowNumbers(false);
    setPriceView(0);
  }, [item?.id]);

  const handlePress = onPress || (onToggle ? () => onToggle(item) : undefined);

  const cost = item?.cost_price;
  const selling = item?.selling_price;
  const costCode = item?.cost_code;
  const sellingCode = item?.selling_code;
  const hasCode = !!(costCode || sellingCode);

  // ===== Mode siklus harga (List Item) =====
  const unitZeros = unit => {
    const u = PRICE_UNIT_LIST.find(x => x.value === unit);
    return u ? u.multiplier : '';
  };
  const rate = Number(session?.currency) || 1;
  const sessionSymbol = session?.symbol_currency || '';
  const costUnitZ = unitZeros(session?.price_code_unit);
  const sellingUnitZ = unitZeros(config?.price_unit_code);
  const canCycle = priceCycle && !!session && !!configSymbol;

  // Titik 1: kode harga + unit (nol) — "code(unit)"
  const codeText = `${costCode ?? '-'}${costUnitZ ? ` (${costUnitZ})` : ''} → ${sellingCode ?? '-'}${sellingUnitZ ? ` (${sellingUnitZ})` : ''}`;
  // Titik 2: konversi ke mata uang session jastip (cost sudah dalam mata uang
  // session; selling_price dalam IDR → dibagi rate session)
  const sessionText = `(${sessionSymbol}) ${cost ?? '-'} → (${sessionSymbol}) ${Math.round((selling ?? 0) / rate)}`;
  // Titik 3: konversi ke mata uang sys_configuration (cost_price_idr sudah IDR;
  // selling_price sudah IDR; dibagi configRate bila mata uang bukan IDR)
  const costIdr = item?.cost_price_idr ?? Math.round((cost ?? 0) * rate);
  const configText = `(${configSymbol}) ${Math.round(costIdr / configRate)} → (${configSymbol}) ${Math.round((selling ?? 0) / configRate)}`;

  const cycleViews = [codeText, sessionText, configText];
  const cyclePrice = () => setPriceView(v => (v + 1) % cycleViews.length);

  // Default tampil cost_code → selling_code; tap icon eye → tampil angka
  const priceText = canCycle
    ? cycleViews[priceView % cycleViews.length]
    : hasCode
      ? showNumbers
        ? `${cost ?? '-'} → ${selling ?? '-'}`
        : `${costCode ?? '-'} → ${sellingCode ?? '-'}`
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
          <View style={styles.priceRow}>
            {canCycle ? (
              <TouchableOpacity
                onPress={cyclePrice}
                style={styles.priceTouch}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={styles.price} numberOfLines={1}>
                  {priceText}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.price} numberOfLines={1}>
                  {priceText}
                </Text>
                {hasCode && (
                  <TouchableOpacity
                    onPress={() => setShowNumbers(v => !v)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Icon
                      name={showNumbers ? 'eye-off' : 'eye'}
                      size={14}
                      color={color.primaryColor}
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
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
