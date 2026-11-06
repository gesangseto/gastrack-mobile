import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/lucide';
import color from '../constant/color';

/**
 * LoadingButton — tombol submit dengan status loading.
 *
 * Menutup kebutuhan yang sama di banyak form: cegah double-kirim, tampilkan
 * spinner, dan beri feedback visual bahwa request masih jalan.
 *
 * Cara pakai:
 *
 *   const [saving, setSaving] = useState(false);
 *
 *   const onSave = () => {
 *     if (saving) return;              // guard state (cukup untuk 99% kasus)
 *     setSaving(true);
 *     try {
 *       await createItem(form);
 *     } finally {
 *       setSaving(false);
 *     }
 *   };
 *
 *   <LoadingButton busy={saving} onPress={onSave} label="Save Item" />
 *
 * Untuk proteksi paling kuat terhadap double-tap dalam frame yang sama,
 * padrakan dengan hook `useSubmitGuard` (guard via useRef, sinkron):
 *
 *   const {busy, submit} = useSubmitGuard();
 *   const onSave = () => submit(async () => { await createItem(form); });
 *   <LoadingButton busy={busy} onPress={onSave} label="Save Item" />
 *
 * @param {Function} onPress       Handler saat ditekan.
 * @param {string}   label         Teks tombol saat idle.
 * @param {string}   busyLabel     Teks saat busy. Default: `${label}...`
 * @param {boolean}  busy          Status loading.
 * @param {boolean}  disabled      Nonaktif total (mis. form belum valid).
 * @param {string}   variant       'primary' | 'danger' | 'ghost' | 'outline'
 * @param {string}   size          'sm' | 'md' | 'lg'
 * @param {object}   style         Style tambahan untuk wrapper.
 * @param {object}   textStyle     Style tambahan untuk teks.
 * @param {string}   icon          Nama ikon Lucide (ditampilkan saat idle).
 * @param {string}   accessibilityLabel
 */
const LoadingButton = ({
  onPress,
  label,
  busyLabel,
  busy = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  icon,
  accessibilityLabel,
  testID,
  ...rest
}) => {
  // Effective disabled: busy juga menonaktifkan tombol — inilah lapis
  // kedua setelah guard di hook/state (mencegah user mengira belum kena).
  const isDisabled = busy || disabled;
  const heights = {sm: 36, md: 42, lg: 50};

  const bg =
    variant === 'danger'
      ? color.danger
      : variant === 'ghost'
        ? 'transparent'
        : variant === 'outline'
          ? color.white
          : color.primaryColor;

  const fg =
    variant === 'outline' || variant === 'ghost'
      ? color.primaryColor
      : color.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{disabled: isDisabled, busy}}
      testID={testID}
      style={[
        styles.base,
        {height: heights[size] || heights.md, backgroundColor: bg},
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {busy ? (
        <View style={styles.inner}>
          <ActivityIndicator size="small" color={fg} />
          <Text
            style={[
              styles.text,
              {color: fg},
              textStyle,
            ]}>
            {busyLabel || `${label}...`}
          </Text>
        </View>
      ) : (
        <View style={styles.inner}>
          {icon ? (
            <Icon name={icon} size={size === 'sm' ? 15 : 17} color={fg} />
          ) : null}
          <Text style={[styles.text, {color: fg}, textStyle]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  outline: {
    borderWidth: 1,
    borderColor: color.primaryColor,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default LoadingButton;