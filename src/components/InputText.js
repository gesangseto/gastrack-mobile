import React from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';

const InputText = React.forwardRef((props = {}, ref) => {
  const {
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    required,
    errorMessage,
    showError,
    prefix,
    ...rest
  } = props;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={{color: 'red'}}>*</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          showError && required && !value && {borderColor: 'red'},
        ]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          style={styles.input}
          placeholderTextColor="#888"
          {...rest}
        />
      </View>
      {showError && required && !value && (
        <Text style={styles.errorText}>
          {errorMessage || `${label || 'Field'} wajib diisi`}
        </Text>
      )}
    </View>
  );
});

export default InputText;

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 6,
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 10,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  prefix: {
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});