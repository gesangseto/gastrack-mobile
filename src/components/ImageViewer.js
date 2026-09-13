import React from 'react';
import ImageViewing from 'react-native-image-viewing';
import {getEndpoint} from '../storage';
import {View} from 'react-native';
import {normalizePhotoPath} from './ImageThumbnail';

const ImageViewer = ({filename, onClose}) => {
  // Backend menyimpan foto di public/uploads/jastip (di-serve statis)
  const normalized = normalizePhotoPath(filename);
  const url = normalized ? `${getEndpoint()}/${normalized}` : null;

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