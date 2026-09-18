import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

// Endpoint backend:
// - GET  /api/v1/jastip/item-stock/payment   → daftar item belum bayar
// - POST /api/v1/jastip/item-stock/payment   → tandai lunas langsung (opsi 2)
// - PUT  /api/v1/cash-flow/invoice           → buat invoice (opsi 1)
// - POST /api/v1/cash-flow/invoice/payment   → bayar invoice (opsi 1)
const stockUrl = '/api/v1/jastip/item-stock/payment';
const invoiceUrl = '/api/v1/cash-flow/invoice';

const notifyError = (message, useAlert) => {
  if (useAlert) {
    Toast.show({type: 'error', text1: 'Error', text2: message});
  }
};

// Daftar item yang belum dibayar (payment_status belum 1 & belum dispatch/sold).
// property: { customer_id?, search? }
export const getPaymentItems = async (property = {}, useAlert = true) => {
  const qs = new URLSearchParams();
  Object.keys(property).forEach(key => {
    const val = property[key];
    if (val !== undefined && val !== null && val !== '') {
      qs.append(key, val);
    }
  });
  const query_string = qs.toString();
  return new Promise(resolve => {
    $axios
      .get(`${stockUrl}?${query_string}`)
      .then(result => {
        let data = result.data;
        if (data.error) {
          notifyError(data.message, useAlert);
          return resolve(false);
        }
        return resolve(data.data || []);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve(false);
      });
  });
};

// Opsi 1a: buat invoice (status Waiting) dari item payment_status null
// milik satu customer. Mengembalikan header invoice ({id, ...}) agar bisa
// langsung dibayar.
export const createInvoice = async (Params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .put(invoiceUrl, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          notifyError(data.message, useAlert);
          return resolve(false);
        }
        return resolve(data.data || false);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve(false);
      });
  });
};

// Opsi 1b: bayar invoice → item terkait menjadi Paid (payment_status=1).
export const payInvoice = async (Params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(`${invoiceUrl}/payment`, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          notifyError(data.message, useAlert);
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Invoice berhasil dibayar',
        });
        return resolve(true);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve(false);
      });
  });
};

// Opsi 2: tandai lunas langsung tanpa invoice (payment_status=1).
export const markPaid = async (items = [], useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(stockUrl, {items})
      .then(result => {
        let data = result.data;
        if (data.error) {
          notifyError(data.message, useAlert);
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Item ditandai lunas',
        });
        return resolve(true);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve(false);
      });
  });
};
