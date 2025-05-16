import {NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Router from './src/config/Router';
import {navigationRef} from './src/config/RootNavigation';
import 'react-native-get-random-values';
const Stack = createNativeStackNavigator();
import {PermissionsAndroid, Platform} from 'react-native';

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
      <Toast />
    </NavigationContainer>
  );
}
