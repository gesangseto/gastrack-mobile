import React, {useState} from 'react';
import {
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import color from '../constant/color';

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
    suffix,
    rightIcon,
    onPressRightIcon,
    onFocus,
    onBlur,
    ...rest
  } = props;

  const [focused, setFocused] = useState(false);
  const hasError = showError && required && !value;

  const handleFocus = e => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = e => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          hasError && styles.inputWrapperError,
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
          placeholderTextColor="#B0B0B0"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {suffix ? <View style={styles.suffix}>{suffix}</View> : null}
        {rightIcon ? (
          <TouchableOpacity
            onPress={onPressRightIcon}
            style={styles.rightIcon}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {hasError && (
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
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
    fontSize: 11,
    color: '#9A9A9A',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  required: {
    color: '#E5484D',
  },
  errorText: {
    color: '#E5484D',
    fontSize: 11,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  inputWrapperFocused: {
    borderColor: color.primaryColor,
  },
  inputWrapperError: {
    borderColor: '#E5484D',
  },
  prefix: {
    paddingLeft: 12,
    paddingRight: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  suffix: {
    paddingRight: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1F1F1F',
    backgroundColor: 'transparent',
  },
  rightIcon: {
    paddingRight: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
