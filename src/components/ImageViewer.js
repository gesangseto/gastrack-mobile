import {Buffer} from 'buffer';
import React, {useEffect, useState} from 'react';
import ImageViewing from 'react-native-image-viewing';
import {getEndpoint} from '../storage';
import axios from 'axios';
import {View} from 'react-native';

const ImageViewer = ({filename, onClose}) => {
  const [base64, setBase64] = useState(null);
  const [visible, setVisible] = useState(false);
  const url = `${getEndpoint()}/api/v1/helper/image/normal?filename=${encodeURIComponent(
    filename,
  )}`;

  useEffect(() => {
    if (filename) {
      loadData();
    }
  }, [filename]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setVisible(false);
  };

  const loadData = () => {
    axios
      .get(url, {responseType: 'arraybuffer'})
      .then(response => {
        const base64String = Buffer.from(response.data, 'binary').toString(
          'base64',
        );
        setBase64(base64String);
        setVisible(true);
      })
      .catch(error => {
        console.error('Error loading image:', error);
      });
  };

  return (
    <View>
      {visible && base64 && (
        <ImageViewing
          images={[{uri: `data:image/png;base64,${base64}`}]}
          imageIndex={0}
          visible={visible}
          onRequestClose={() => handleClose()}
        />
      )}
    </View>
  );
};

export default ImageViewer;
