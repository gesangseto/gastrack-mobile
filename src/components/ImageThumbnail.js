import React from 'react';
import {Image} from 'react-native';
import {getEndpoint} from '../storage';
import Icon from '@react-native-vector-icons/lucide';
import color from '../constant/color';

const ImageThumbnail = ({filename}) => {
  if (!filename) {
    return <Icon name="circle-help" size={55} color={color.primaryLighter} />;
  }
  // Backend menyimpan foto di public/uploads/jastip (di-serve statis)
  const url = `${getEndpoint()}/${filename.replace(/^public\//, '')}`;

  return (
    <Image
      source={{uri: url}}
      style={{width: 75, height: 75, borderRadius: 10}}
    />
  );
};
export default ImageThumbnail;