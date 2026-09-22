import {NavigationContainer} from '@react-navigation/native';
import Toast, {
  ErrorToast,
  InfoToast,
  SuccessToast,
} from 'react-native-toast-message';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Router from './src/config/Router';
import {navigationRef} from './src/config/RootNavigation';
import 'react-native-get-random-values';
const Stack = createNativeStackNavigator();
import {PermissionsAndroid, Platform} from 'react-native';

// ErrorUtils.setGlobalHandler(error => {
//   console.log('💥 Uncaught Error:', error);
//   // misal:
//   if (__DEV__) {
//     alert(`Error: ${error.message}`);
//   }
// });

// Konfigurasi Toast: teks panjang TIDAK dipotong (numberOfLines=0 = tanpa
// batas baris), melainkan wrap ke baris baru agar pesan tetap terbaca utuh.
const toastConfig = {
  success: props => (
    <SuccessToast {...props} text1NumberOfLines={0} text2NumberOfLines={0} />
  ),
  error: props => (
    <ErrorToast {...props} text1NumberOfLines={0} text2NumberOfLines={0} />
  ),
  info: props => (
    <InfoToast {...props} text1NumberOfLines={0} text2NumberOfLines={0} />
  ),
};

export default function App() {
  async function requestPermission() {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
    }
  }
  return (
    <NavigationContainer ref={navigationRef}>
      <Router />
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
}
