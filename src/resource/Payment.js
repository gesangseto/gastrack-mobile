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

// Ringkasan tagihan semua customer (tab Pending/Paid).
// property: { session_id? } — filter item per session (menu payment per session).
// Resolve array: [{customer_id, customer_name, customer_phone, grand_total,
//   total_paid, remaining_amount, payment_status, total_items, total_quantity,
//   payment_count}]
export const getPaymentSummaryList = async (property = {}, useAlert = true) => {
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
      .get(`${paymentUrl}/summary?${query_string}`)
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
// property: { customer_id?, status?, search?, session_id? } — session_id
// memfilter hanya payment dari customer yang punya item di session tersebut.
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

// Ringkasan tagihan satu customer (dipakai di PaymentCreate & detail tagihan).
// sessionId opsional — filter item per session.
// Resolve object summary atau null.
export const getPaymentSummary = async (customerId, sessionId, useAlert = true) => {
  const qs = new URLSearchParams();
  qs.append('customer_id', customerId);
  if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
    qs.append('session_id', sessionId);
  }
  return new Promise(resolve => {
    $axios
      .get(`${paymentUrl}?${qs.toString()}`)
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

// Daftar item yang dipesan customer (detail tagihan).
// Resolve array: [{id, product_id, barcode, product_name, quantity,
//   selling_price, status, status_name, payment_status, session_id}]
export const getPaymentItems = async (customerId, sessionId, useAlert = true) => {
  const qs = new URLSearchParams();
  qs.append('customer_id', customerId);
  if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
    qs.append('session_id', sessionId);
  }
  return new Promise(resolve => {
    $axios
      .get(`${paymentUrl}/items?${qs.toString()}`)
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

// Buat payment baru (PUT) — pembayaran bertahap per customer.
// Params: { customer_id, session_id, amount, payment_method, payment_date?, reference_number?, notes?, created_by? }
// session_id = session tempat pembayaran dicatat (untuk filter riwayat per session).
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

// Kirim tagihan via WhatsApp (POST) — render template REQUEST_PAYMENT.
// Params: { customer_id, session_id }
// Resolve: { message, rows: [{ customer_id, phone, message }] }
export const sendInvoice = async (params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(`${paymentUrl}/send-invoice`, params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          // Always surface backend error message, even if useAlert=false
          // (caller can show its own toast)
          return resolve({error: true, message: data.message});
        }
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Tagihan terkirim via WhatsApp',
        });
        return resolve(data.data?.[0] || true);
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve({error: true, message: e.message});
      });
  });
};

// Blast tagihan via WhatsApp (POST) — kirim tagihan ke SEMUA customer yang
// belum lunas pada session terpilih (batch dari send-invoice per customer).
// Endpoint: POST /api/v1/jastip/payment/send-invoice-blast
// Params: { session_id }
// Resolve: { error: false, message, rows: [{ customer_id, customer_name,
//   phone, status: 'sent'|'failed'|'skipped', message }] }
//   atau { error: true, message } saat backend error / request gagal.
// Catatan wire format: controller mengisi data.rows, tapi response helper
// backend (app/configuration/response.js) memindahkan rows ke field `data`
// — karenanya baca `data.rows || data.data` (sendInvoice existing juga
// memakai data.data?.[0]).
// Sukses TIDAK di-toast di sini (berbeda dengan sendInvoice) — caller
// menampilkan ringkasan hasil blast (X terkirim / Y gagal / Z dilewati).
export const sendInvoiceBlast = async (params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(`${paymentUrl}/send-invoice-blast`, params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          return resolve({error: true, message: data.message});
        }
        return resolve({
          error: false,
          message: data.message,
          rows: data.rows || data.data || [],
        });
      })
      .catch(e => {
        notifyError(e.message, useAlert);
        return resolve({error: true, message: e.message});
      });
  });
};
