import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

// Versi WEB dari Scanner.
// Kamera/barcode native (@pushpendersingh/react-native-scanner) tidak tersedia
// di browser, sehingga halaman ini hanya menampilkan pemberitahuan.
export default function Scanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner tidak tersedia</Text>
      <Text style={styles.subtitle}>
        Fitur pemindaian barcode hanya tersedia di aplikasi Android.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});
