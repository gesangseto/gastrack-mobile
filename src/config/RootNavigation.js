// RootNavigation.js

import * as React from 'react';
import {StackActions} from '@react-navigation/native';

export const navigationRef = React.createRef();

export function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

export function navigateReplace(name, param) {
  try {
    navigationRef.current.dispatch(StackActions.replace(name, param));
  } catch (error) {
    console.log(error);
  }
}
