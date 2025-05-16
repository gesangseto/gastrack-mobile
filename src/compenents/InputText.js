import React from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';

const InputText = (props = {}) => {
  const {
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
  } = props;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor="#888"
      />
    </View>
  );
};

export default InputText;

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
