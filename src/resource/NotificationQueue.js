import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

const url = '/api/v1/notification/queue';

const buildQuery = (property = {}) => {
  const clean = {};
  Object.keys(property).forEach(key => {
    const value = property[key];
    if (value !== undefined && value !== null && value !== '') {
      clean[key] = value;
    }
  });
  return new URLSearchParams(clean).toString();
};

// Daftar antrean pesan WhatsApp (monitoring, read-only).
// Query: status, channel_code, customer_id, session_id, search, page, limit
export const getListNotificationQueue = async (
  property = {},
  useAlert = true,
) => {
  return new Promise(resolve => {
    $axios
      .get(`${url}?${buildQuery(property)}`)
      .then(result => {
        const data = result.data;
        if (data.error) {
          if (useAlert) {
            Toast.show({type: 'error', text1: 'Error', text2: data.message});
          }
          return resolve(false);
        }
        return resolve({rows: data.data || [], total: data.grand_total || 0});
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};

// Jumlah pesan per status untuk chip statistik.
export const getNotificationQueueSummary = async (useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(`${url}/summary`)
      .then(result => {
        const data = result.data;
        if (data.error) {
          if (useAlert) {
            Toast.show({type: 'error', text1: 'Error', text2: data.message});
          }
          return resolve(false);
        }
        return resolve(data.data || []);
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};
