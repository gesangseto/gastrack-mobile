import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = `/api/v1/jastip/dashboard`;

// Ambil ringkasan statistik Jastip dari Backend.
// Resolve object: item_by_status, batch_by_status, picking_by_status,
// inbound_by_status, invoice_by_status, total_customer, total_sales.
export const fetchDashboard = async (useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(url)
      .then(result => {
        let data = result.data;
        if (data.error) {
          if (useAlert)
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: data.message,
            });
          return resolve(null);
        }
        return resolve(data.data || null);
      })
      .catch(e => {
        if (useAlert)
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e?.message || e,
          });
        return resolve(null);
      });
  });
};