import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import InputText from './InputText';
import color from '../constant/color';
import {getListPriceCode} from '../resource/PriceCode';

/**
 * Input kode harga (alphabet only) dengan autocomplete dari mst_price_code.
 * Ketuk saran untuk menambahkan kode ke nilai saat ini (misal "A" + "D" + "B" = "ADB").
 */
const PriceCodeInput = React.forwardRef(
  (
    {
      label,
      value,
      onChangeText,
      required,
      showError,
      placeholder,
      returnKeyType,
      onSubmitEditing,
    },
    ref,
  ) => {
    const [priceCodes, setPriceCodes] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      loadPriceCodes();
    }, []);

    const loadPriceCodes = async () => {
      let result = await getListPriceCode({status: 'Active'}, false);
      if (result) setPriceCodes(result);
    };

    const handleChange = text => {
      // Hanya terima alphabet, otomatis uppercase
      const letters = text.replace(/[^a-zA-Z]/g, '').toUpperCase();
      onChangeText(letters);
      setShowSuggestions(letters.length > 0);
    };

    const appendCode = pc => {
      onChangeText((value || '') + (pc.code || '').toUpperCase());
    };

    return (
      <View>
        <InputText
          ref={ref}
          label={label}
          required={required}
          showError={showError}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          autoCapitalize="characters"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {showSuggestions && (
          <View style={styles.suggestionBox}>
            {priceCodes.length === 0 ? (
              <Text style={styles.suggestionHint}>Belum ada price code</Text>
            ) : (
              priceCodes.map((pc, index) => (
                <TouchableOpacity
                  key={pc.id || index}
                  style={[
                    styles.suggestionItem,
                    index < priceCodes.length - 1 &&
                      styles.suggestionItemBorder,
                  ]}
                  onPress={() => appendCode(pc)}>
                  <Text style={styles.suggestionName}>
                    {pc.code} — {pc.name}
                  </Text>
                  <Text style={styles.suggestionPhone}>= {pc.number}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    );
  },
);

export default PriceCodeInput;

const styles = StyleSheet.create({
  suggestionBox: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.primaryLighter,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionHint: {
    fontSize: 13,
    color: '#9A9A9A',
    paddingVertical: 14,
    textAlign: 'center',
  },
  suggestionItem: {
    paddingVertical: 12,
  },
  suggestionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.primaryLighter,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  suggestionPhone: {
    fontSize: 13,
    fontWeight: '500',
    color: color.primaryColor,
    marginTop: 2,
  },
});