import React from 'react';
import {Image} from 'react-native';
import {getEndpoint} from '../storage';
import Icon from '@react-native-vector-icons/lucide';
import color from '../constant/color';

// Normalisasi path foto dari berbagai format yang pernah tersimpan:
// - public\uploads\jastip\item-11-thumb.png (backslash + prefix public)
// - D:\Syncthing\...\public\uploads\jastip\item-10-thumb.png (path absolut Windows)
// - /uploads/jastip/item-9-thumb.png (leading slash)
// - uploads/jastip/item-18-thumb.jpg (sudah benar)
export const normalizePhotoPath = filename => {
  if (!filename) return null;
  let f = String(filename).replace(/\\/g, '/');
  const idx = f.indexOf('public/');
  if (idx >= 0) f = f.slice(idx + 'public/'.length);
  f = f.replace(/^public\//, '').replace(/^\//, '');
  return f;
};

const ImageThumbnail = ({filename, size = 75, radius = 10}) => {
  const normalized = normalizePhotoPath(filename);
  if (!normalized) {
    return (
      <Icon name="circle-help" size={size} color={color.primaryLighter} />
    );
  }
  // Backend menyimpan foto di public/uploads/jastip (di-serve statis)
  const url = `${getEndpoint()}/${normalized}`;

  return (
    <Image
      source={{uri: url}}
      style={{width: size, height: size, borderRadius: radius}}
    />
  );
};
export default ImageThumbnail;