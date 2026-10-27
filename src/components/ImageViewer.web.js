import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {getEndpoint} from '../storage';
import {normalizePhotoPath} from './ImageThumbnail';

// Versi WEB dari ImageViewer.
// Paket 'react-native-image-viewing' hanya menyediakan file .ios.js/.android.js
// (tidak ada varian web), sehingga di web dipakai <img> bawaan browser yang
// sudah mendukung zoom/pan native. Tampilan dibuat menyerupai versi native.
const ImageViewer = ({filename, onClose}) => {
  const normalized = normalizePhotoPath(filename);
  const url = normalized ? `${getEndpoint()}/${normalized}` : null;

  if (!url) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onClose && onClose()}
          accessibilityLabel="Tutup">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <img src={url} alt="" style={styles.image} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '92%',
    maxHeight: '82%',
    objectFit: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 22,
  },
});

export default ImageViewer;
