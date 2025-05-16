import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {Platform} from 'react-native';
const Stack = createNativeStackNavigator();

import Details from '../screens/Details/Details';
import TabView from '../screens/TabView';
import Form from '../screens/Form/Form';
import LoginView from '../screens/LoginView';

const shouldShowCustomSplashScreen = () => {
  if (Platform.OS === 'android') {
    const androidVersion = Platform.Version;
    // Android 12 (API level 31) atau lebih tinggi
    if (androidVersion >= 31) {
      return false; // Jangan tampilkan splash screen kustom
    }
  }
  return true; // Tampilkan splash screen kustom untuk versi lain
};
const Router = () => {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, animation: 'slide_from_right'}}
      initialRouteName="LoginView">
      <Stack.Screen name="LoginView" component={LoginView} />
      <Stack.Screen name="TabView" component={TabView} />
      <Stack.Screen name="Details" component={Details} />
      <Stack.Screen name="Form" component={Form} />
    </Stack.Navigator>
  );
};
export default Router;
