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
    multiline,
    numberOfLines,
    minHeight,
    // Style dari pemanggil harus di-merge, bukan menimpa. Kalau tidak
    // destructured di sini, `{...rest}` menimpa seluruh array style di bawah.
    style,
    ...rest
  } = props;

  const [focused, setFocused] = useState(false);
  const hasError = showError && required && !value;
  // Tinggi minimum untuk field multiline. Tanpa ini wrapper `alignItems:
  // 'center'` membuat baris pertama terlihat di tengah dan isi panjang
  // terpotong (teks tampak setengah).
  const multilineMinHeight = minHeight || (numberOfLines || 6) * 22 + 16;

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
          // Multiline butuh alignItems 'flex-start' supaya isi panjang
          // tidak ter-center vertikal dan tergotong oleh wrapper.
          multiline && styles.inputWrapperMultiline,
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
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines || 6 : undefined}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            multiline && {minHeight: multilineMinHeight},
            // Terakhir: style dari pemanggil (e.g. lineHeight khusus).
            style,
          ]}
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
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
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
  inputWrapperMultiline: {
    // Wrapper untuk multiline: align ke atas, bukan center.
    alignItems: 'flex-start',
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
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1F1F1F',
    backgroundColor: 'transparent',
  },
  inputMultiline: {
    // Padding vertikal dikecilkan supaya tinggi baris konsisten dengan
    // perhitungan minHeight (lineHeight 22 per baris).
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  },
  rightIcon: {
    paddingRight: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
