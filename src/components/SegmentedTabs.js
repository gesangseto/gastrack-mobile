import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import color from '../constant/color';

// Tab segmen (pill) untuk filter status.
// items: [{key, label, qty, qtyLabel?, qtyText?}]
// - qty      : angka ringkasan group tsb (suffix default "record")
// - qtyLabel : suffix pengganti, mis. "pcs" / "batch"
// - qtyText  : teks ringkasan bebas (mis. "3 batch · 25 pcs")
const SegmentedTabs = ({items, value, onChange, style}) => (
  <View style={[styles.wrap, style]}>
    {items.map(item => {
      const active = item.key === value;
      const qtyText =
        item.qtyText != null
          ? item.qtyText
          : item.qty !== undefined && item.qty !== null
            ? `${item.qty} ${item.qtyLabel || 'record'}`
            : null;
      return (
        <TouchableOpacity
          key={item.key}
          style={[styles.tab, active && styles.tabActive]}
          activeOpacity={0.85}
          onPress={() => onChange(item.key)}>
          <Text
            style={[styles.tabLabel, active && styles.tabLabelActive]}
            numberOfLines={1}>
            {item.label}
          </Text>
          {qtyText !== null && (
            <Text
              style={[styles.tabQty, active && styles.tabQtyActive]}
              numberOfLines={1}>
              {qtyText}
            </Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

export default SegmentedTabs;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: color.primaryLight,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: color.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  tabLabelActive: {
    color: color.primaryColor,
    fontWeight: '700',
  },
  tabQty: {
    fontSize: 9,
    fontWeight: '600',
    color: '#A9A9B2',
    marginTop: 0,
  },
  tabQtyActive: {
    color: color.primaryColor,
  },
});
