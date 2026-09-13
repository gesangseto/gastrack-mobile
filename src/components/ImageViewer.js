import React from 'react';
import ImageViewing from 'react-native-image-viewing';
import {getEndpoint} from '../storage';
import {View} from 'react-native';

const ImageViewer = ({filename, onClose}) => {
  // Backend menyimpan foto di public/uploads/jastip (di-serve statis)
  const url = filename
    ? `${getEndpoint()}/${filename.replace(/^public\//, '')}`
    : null;

  return (
    <View>
      {url && (
        <ImageViewing
          images={[{uri: url}]}
          imageIndex={0}
          visible={true}
          onRequestClose={() => onClose && onClose()}
        />
      )}
    </View>
  );
};

export default ImageViewer;