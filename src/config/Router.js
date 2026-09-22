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
import BatchItemPicker from '../screens/Batchs/BatchItemPicker';
import SettingsView from '../screens/Settings/SettingsView';
import ProfileView from '../screens/Settings/ProfileView';
import LocalSettingView from '../screens/Settings/LocalSettingView';
import AppSettingView from '../screens/Settings/AppSettingView';
import AboutView from '../screens/Settings/AboutView';
import CustomerList from '../screens/Customer/CustomerList';
import CustomerEdit from '../screens/Customer/CustomerEdit';
import PriceCodeList from '../screens/PriceCode/PriceCodeList';
import PriceCodeEdit from '../screens/PriceCode/PriceCodeEdit';
import SessionView from '../screens/Session/SessionView';
import PaymentCreate from '../screens/Payment/PaymentCreate';
import PaymentCustomerDetail from '../screens/Payment/PaymentCustomerDetail';

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
      <Stack.Screen name="BatchItemPicker" component={BatchItemPicker} />
      <Stack.Screen name="SettingsView" component={SettingsView} />
      <Stack.Screen name="ProfileView" component={ProfileView} />
      <Stack.Screen name="LocalSettingView" component={LocalSettingView} />
      <Stack.Screen name="AppSettingView" component={AppSettingView} />
      <Stack.Screen name="AboutView" component={AboutView} />
      <Stack.Screen name="CustomerList" component={CustomerList} />
      <Stack.Screen name="CustomerEdit" component={CustomerEdit} />
      <Stack.Screen name="PriceCodeList" component={PriceCodeList} />
      <Stack.Screen name="PriceCodeEdit" component={PriceCodeEdit} />
      <Stack.Screen name="SessionView" component={SessionView} />
      <Stack.Screen name="PaymentCreate" component={PaymentCreate} />
      <Stack.Screen
        name="PaymentCustomerDetail"
        component={PaymentCustomerDetail}
      />
      <Stack.Screen name="Form" component={Form} />
    </Stack.Navigator>
  );
};
export default Router;
