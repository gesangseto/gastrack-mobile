import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';

const InputTextArea = ({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  errorMessage,
  showError,
  numberOfLines = 4,
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={{color: 'red'}}>*</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          showError && required && !value && {borderColor: 'red'},
        ]}
        textAlignVertical="top"
        placeholderTextColor="#888"
      />
      {showError && required && !value && (
        <Text style={styles.errorText}>
          {errorMessage || `${label || 'Field'} wajib diisi`}
        </Text>
      )}
    </View>
  );
};

export default InputTextArea;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});
