import React from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';

const UploadImage = ({label, image, setImage, required, showError}) => {
  const requestCameraAndLaunch = async () => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    const result = await request(permission);

    switch (result) {
      case RESULTS.GRANTED:
        launchCamera({mediaType: 'photo', quality: 0.5}, response => {
          if (!response.didCancel && !response.errorCode) {
            setImage(response.assets[0]);
          } else if (response.errorCode) {
            Alert.alert('Error', response.errorMessage || 'Gagal membuka kamera');
          }
        });
        break;

      case RESULTS.BLOCKED:
        Alert.alert(
          'Izin Kamera Diblokir',
          'Izin kamera diblokir. Silakan aktifkan di Pengaturan.',
          [{text: 'Buka Pengaturan', onPress: openSettings}, {text: 'Batal'}],
        );
        break;

      case RESULTS.DENIED:
        Alert.alert(
          'Izin Kamera Ditolak',
          'Anda perlu memberikan izin kamera untuk mengambil foto.',
        );
        break;

      default:
        Alert.alert('Error', 'Kamera tidak tersedia di perangkat ini');
        break;
    }
  };

  const pickImage = () => {
    Alert.alert('Pilih Sumber Gambar', '', [
      {
        text: 'Kamera',
        onPress: requestCameraAndLaunch,
      },
      {
        text: 'Galeri',
        onPress: () =>
          launchImageLibrary({mediaType: 'photo', quality: 0.5}, response => {
            if (!response.didCancel && !response.errorCode) {
              setImage(response.assets[0]);
            }
          }),
      },
      {text: 'Batal', style: 'cancel'},
    ]);
  };

  const handlePilihImage = image => {
    let uri = image.uri;
    if (Platform.OS === 'ios' && uri.startsWith('file://')) {
      uri = decodeURI(uri);
    }
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
