import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

// Endpoint backend (module payment per-customer):
// - GET  /api/v1/jastip/payment/summary      → ringkasan tagihan semua customer
// - GET  /api/v1/jastip/payment/history      → riwayat payment
// - GET  /api/v1/jastip/payment?customer_id  → ringkasan tagihan satu customer
// - PUT  /api/v1/jastip/payment              → buat payment baru
const paymentUrl = '/api/v1/jastip/payment';

const notifyError = (message, useAlert) => {
  if (useAlert) {
    Toast.show({type: 'error', text1: 'Error', text2: message});
  }
};

// ===== Module payment baru (pembayaran bertahap per customer) =====

// Ringkasan tagihan semua customer (tab Tagihan).
// Resolve array: [{customer_id, customer_name, customer_phone, grand_total,
//   total_paid, remaining_amount, payment_status, total_items, total_quantity,
//   payment_count}]
export const getPaymentSummaryList = async (useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .get(`${paymentUrl}/summary`)
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

// Riwayat payment (tab Riwayat).
// property: { customer_id?, status?, search? }
export const getPaymentHistory = async (property = {}, useAlert = true) => {
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
      .get(`${paymentUrl}/history?${query_string}`)
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

// Ringkasan tagihan satu customer (dipakai di PaymentCreate).
// Resolve object summary atau null.
export const getPaymentSummary = async (customerId, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .get(`${paymentUrl}?customer_id=${customerId}`)
      .then(result => {
        let data = result.data;
        if (data.error) {
          notifyError(data.message, useAlert);
          return resolve(false);
        }
        return resolve(data.data?.[0] || null);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve(false);
      });
  });
};

// Buat payment baru (PUT) — pembayaran bertahap per customer.
// Params: { customer_id, amount, payment_method, payment_date?, reference_number?, notes?, created_by? }
export const createPayment = async (Params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .put(paymentUrl, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          notifyError(data.message, useAlert);
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Payment berhasil disimpan',
        });
        return resolve(data.data?.[0] || true);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve(false);
      });
  });
};
