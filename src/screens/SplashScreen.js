import Icon from '@react-native-vector-icons/lucide';
import React, {useEffect, useRef} from 'react';
import {Animated, Image, StatusBar, StyleSheet, Text, View} from 'react-native';
import color from '../constant/color';

/**
 * SplashScreen — layar pembuka brand.
 *
 * Ditampilkan oleh App.js selama bootstrap selesai, lalu digantikan
 * (fade-out) oleh halaman Login atau TabView. Tidak memakai navigasi
 * sendiri; durasi & transisi dikontrol dari App.js.
 */
const SplashScreen = ({onFinish}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Fade-in + scale-up logo
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Panggil onFinish setelah splash minimal ditampilkan
    const timer = setTimeout(onFinish, 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={color.primaryColor}
      />
      <Animated.View style={[styles.logoWrap, {opacity, transform: [{scale}]}]}>
        <View style={styles.logoBox}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>GasTrack</Text>
        <Text style={styles.subtitle}>Your Warehouse Partner</Text>
      </Animated.View>
      <View style={styles.footer}>
        <Icon name="loader" size={18} color="rgba(255,255,255,0.55)" />
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  screen: {
    // Overlay penuh: jangan ikut flex layout (dulu bareng NavigationContainer
    // jadi kebagi dua layar). Posisi absolut + zIndex biar selalu di atas.
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: '86%',
    height: '86%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: color.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 42,
  },
});