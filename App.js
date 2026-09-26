import {NavigationContainer} from '@react-navigation/native';
import Toast, {
  ErrorToast,
  InfoToast,
  SuccessToast,
} from 'react-native-toast-message';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useState} from 'react';
import SplashScreen from './src/screens/SplashScreen';
import Router from './src/config/Router';
import {navigationRef} from './src/config/RootNavigation';
import 'react-native-get-random-values';
const Stack = createNativeStackNavigator();

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
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* Splash ditampilkan saat app baru dibuka (cold start), lalu
          diturunkan setelah bootstrap; navigasi dirender di bawahnya. */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <NavigationContainer ref={navigationRef}>
        <Router />
        <Toast config={toastConfig} />
      </NavigationContainer>
    </>
  );
}