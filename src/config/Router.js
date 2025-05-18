import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {Platform} from 'react-native';
const Stack = createNativeStackNavigator();

import Details from '../screens/Details/Details';
import TabView from '../screens/TabView';
import Form from '../screens/Form/Form';
import LoginView from '../screens/LoginView';
import ItemCreate from '../screens/Items/ItemCreate';
import ItemView from '../screens/Items/ItemView';
import ItemList from '../screens/Items/ItemList';
import BatchCreate from '../screens/Batchs/BatchCreate';
import BatchList from '../screens/Batchs/BatchList';
import BatchView from '../screens/Batchs/BatchView';

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
      <Stack.Screen name="ItemCreate" component={ItemCreate} />
      <Stack.Screen name="ItemList" component={ItemList} />
      <Stack.Screen name="ItemView" component={ItemView} />
      <Stack.Screen name="BatchCreate" component={BatchCreate} />
      <Stack.Screen name="BatchList" component={BatchList} />
      <Stack.Screen name="BatchView" component={BatchView} />
      <Stack.Screen name="Form" component={Form} />
    </Stack.Navigator>
  );
};
export default Router;
