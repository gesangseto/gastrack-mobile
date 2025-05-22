import React, {useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import axios from 'axios';
import {getEndpoint} from '../storage';
import {Buffer} from 'buffer';
import Icon from '@react-native-vector-icons/lucide';
import color from '../constant/color';

const ImageThumbnail = ({filename}) => {
  const [base64, setBase64] = useState(null);
  const url = `${getEndpoint()}/api/v1/helper/image/thumbnail?filename=${encodeURIComponent(
    filename,
  )}`;

  useEffect(() => {
    if (filename) {
      loadData();
    }
  }, [filename]);

  const loadData = () => {
    axios
      .get(url, {responseType: 'arraybuffer'})
      .then(response => {
        const base64String = Buffer.from(response.data, 'binary').toString(
          'base64',
        );
        setBase64(base64String);
      })
      .catch(error => {
        console.error('Error loading image:', error);
      });
  };
  if (!base64) {
    return <Icon name="circle-help" size={55} color={color.primaryLighter} />;
  }

  return (
    <Image
      source={{uri: `data:image/png;base64,${base64}`}}
      style={{width: 75, height: 75, borderRadius: 10}}
    />
  );
};
export default ImageThumbnail;
