import React, {useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import axios from 'axios';
import {getEndpoint} from '../storage';
import {Buffer} from 'buffer';

const Thumbnail = ({filename}) => {
  const [base64, setBase64] = useState(null);
  const url = `${getEndpoint()}/api/v1/helper/image/thumbnail?filename=${encodeURIComponent(
    filename,
  )}`;

  useEffect(() => {
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
  }, [filename]);

  if (!base64) {
    return <View style={{width: 50, height: 50, backgroundColor: '#eee'}} />;
  }

  return (
    <Image
      source={{uri: `data:image/png;base64,${base64}`}}
      style={{width: 50, height: 50}}
    />
  );
};
export default Thumbnail;
