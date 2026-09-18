import Icon from '@react-native-vector-icons/lucide';
import {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import color from '../constant/color';

// Bar pencarian dengan pilihan tipe pencarian (dropdown).
// types: [{key, label, placeholder, keyboardType, icon}]
const SearchBar = ({
  value,
  onChangeText,
  onSubmit,
  type,
  types = [],
  onChangeType,
  loading = false,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const active = types.find(t => t.key === type) || types[0] || {};

  return (
    <>
      <View style={styles.wrap}>
        <Icon name="search" size={18} color="#9A9A9A" />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={active.placeholder}
          placeholderTextColor="#B0B0B0"
          keyboardType={active.keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator size="small" color={color.primaryColor} />
        ) : value ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon name="circle-x" size={16} color="#C4C4C4" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.typeBtn}
          activeOpacity={0.8}
          onPress={() => setPickerOpen(true)}>
          {active.icon ? (
            <Icon name={active.icon} size={13} color={color.primaryColor} />
          ) : null}
          <Text style={styles.typeText} numberOfLines={1}>
            {active.label}
          </Text>
          <Icon name="chevron-down" size={13} color={color.primaryColor} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPickerOpen(false)}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cari berdasarkan</Text>
            {types.map(t => {
              const selected = t.key === type;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.option, selected && styles.optionActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setPickerOpen(false);
                    if (!selected) onChangeType(t.key);
                  }}>
                  {t.icon ? (
                    <Icon
                      name={t.icon}
                      size={18}
                      color={selected ? color.primaryColor : '#8A8A8A'}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                    ]}>
                    {t.label}
                  </Text>
                  {selected ? (
                    <Icon name="check" size={18} color={color.primaryColor} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    backgroundColor: color.white,
    paddingLeft: 12,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 14,
    color: '#1F1F1F',
    backgroundColor: 'transparent',
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: color.primaryColor,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: color.white,
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: color.primaryLight,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  optionTextActive: {
    color: color.primaryColor,
    fontWeight: '700',
  },
});
