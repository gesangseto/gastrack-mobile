import {NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Router from './src/config/Router';
import {navigationRef} from './src/config/RootNavigation';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Router />
      <Toast />
    </NavigationContainer>
  );
}
