import React, {useRef} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

// Versi WEB dari UploadImage.
// react-native-image-picker tidak tersedia di browser → pakai <input type="file">.
// Objek hasil dibuat menyerupai shape picker native ({uri, name, type, filename})
// supaya kode pengirim FormData di ItemCreate tetap bekerja tanpa perubahan.
const UploadImage = ({label, image, setImage, required, showError}) => {
  const inputRef = useRef(null);

  const handleFile = file => {
    if (!file) return;
    const uri = URL.createObjectURL(file);
    setImage({
      uri,
      name: file.name,
      filename: file.name,
      type: file.type || 'image/jpeg',
    });
  };

  const pickImage = () => {
    if (inputRef.current) inputRef.current.click();
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={{color: 'red'}}>*</Text>}
        </Text>
      )}
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        {image ? (
          <Image
            key={image.uri}
            source={{uri: image.uri}}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.uploadText}>Pilih Gambar</Text>
        )}
      </TouchableOpacity>
      {showError && required && !image && (
        <Text style={styles.errorText}>Gambar wajib diunggah</Text>
      )}
      {/* input file tersembunyi — pengganti native image picker di web */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{display: 'none'}}
        onChange={e => handleFile(e.target.files && e.target.files[0])}
      />
    </View>
  );
};

export default UploadImage;

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  uploadText: {
    color: '#888',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});
