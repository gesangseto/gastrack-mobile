import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

// Resource Chat WhatsApp & Item Staging.
//
// Alur: chat WA masuk -> admin buka tab Chat -> pilih percakapan ->
// tap "Buat Item" -> item masuk STAGING -> lengkapi di tab Staging ->
// konfirmasi -> jadi item_stock (Draft).
const chatUrl = '/api/v1/helper/wa/chat';
const stagingUrl = '/api/v1/jastip/staging';

const fail = (e, useAlert, fallback) => {
  if (useAlert) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: e?.response?.data?.message || e.message || fallback,
    });
  }
  return false;
};

// ===== Chat WhatsApp =====

// Daftar percakapan (+ unread). param: { search?, limit? }
export const getWaChats = async (param = {}, useAlert = false) => {
  const qs = new URLSearchParams(param).toString();
  return new Promise(resolve => {
    $axios
      .get(`${chatUrl}${qs ? `?${qs}` : ''}`)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(useAlert ? fail(new Error(data.message), true) : []);
        return resolve(data.data || []);
      })
      .catch(e => resolve(useAlert ? fail(e, true) : []));
  });
};

// Isi satu thread. param: { jid, limit?, before? }
export const getWaMessages = async (jid, param = {}, useAlert = false) => {
  const qs = new URLSearchParams({ jid, ...param }).toString();
  return new Promise(resolve => {
    $axios
      .get(`${chatUrl}/messages?${qs}`)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(useAlert ? fail(new Error(data.message), true) : []);
        return resolve(data.data || []);
      })
      .catch(e => resolve(useAlert ? fail(e, true) : []));
  });
};

// Total pesan belum dibaca (badge tab).
export const getWaUnread = async () => {
  return new Promise(resolve => {
    $axios
      .get(`${chatUrl}/unread`)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(0);
        return resolve(data.data?.[0]?.unread || 0);
      })
      .catch(() => resolve(0));
  });
};

// Tandai sudah dibaca.
export const markWaRead = async (jid) => {
  return new Promise(resolve => {
    $axios
      .post(`${chatUrl}/read`, { jid })
      .then(result => resolve(!result.data.error))
      .catch(() => resolve(false));
  });
};

// Balas pesan.
export const sendWaReply = async (jid, message, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(`${chatUrl}/reply`, { jid, message })
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(fail(new Error(data.message), useAlert));
        if (useAlert) Toast.show({ type: 'success', text1: 'Terkirim', text2: data.message });
        return resolve(true);
      })
      .catch(e => resolve(fail(e, useAlert)));
  });
};

// Data customer dari jid (untuk form item: nomor HP sudah terisi).
export const getWaChatCustomer = async (jid, useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(`${chatUrl}/customer?jid=${encodeURIComponent(jid)}`)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(useAlert ? fail(new Error(data.message), true) : false);
        return resolve(data.data?.[0] || false);
      })
      .catch(e => resolve(useAlert ? fail(e, true) : false));
  });
};

// ===== Item Staging =====

// List staging. param: { status?, search?, limit? }
export const getStagingList = async (param = {}, useAlert = false) => {
  const qs = new URLSearchParams({ status: 'pending', ...param }).toString();
  return new Promise(resolve => {
    $axios
      .get(`${stagingUrl}?${qs}`)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(useAlert ? fail(new Error(data.message), true) : []);
        return resolve(data.data || []);
      })
      .catch(e => resolve(useAlert ? fail(e, true) : []));
  });
};

// Jumlah staging per status (badge).
export const getStagingSummary = async () => {
  return new Promise(resolve => {
    $axios
      .get(`${stagingUrl}/summary`)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve({ pending: 0 });
        const map = {};
        (data.data || []).forEach(r => {
          map[r.status] = Number(r.total) || 0;
        });
        return resolve(map);
      })
      .catch(() => resolve({ pending: 0 }));
  });
};

// Buat staging dari chat WA. param: { jid, wa_message_id?, raw_message?, customer_name?, item_name? }
export const createStaging = async (param, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(stagingUrl, param)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(fail(new Error(data.message), useAlert));
        if (useAlert) Toast.show({ type: 'success', text1: 'Masuk Staging', text2: data.message });
        return resolve(data.data?.[0] || true);
      })
      .catch(e => resolve(fail(e, useAlert)));
  });
};

// Konfirmasi staging -> jadi item_stock Draft.
export const confirmStaging = async (param, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(`${stagingUrl}/confirm`, param)
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(fail(new Error(data.message), useAlert));
        if (useAlert) Toast.show({ type: 'success', text1: 'Berhasil', text2: data.message });
        return resolve(data.data?.[0] || true);
      })
      .catch(e => resolve(fail(e, useAlert)));
  });
};

// Buang staging (bukan titipan).
export const discardStaging = async (id, reason, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(`${stagingUrl}/discard`, { id, reason })
      .then(result => {
        const data = result.data;
        if (data.error) return resolve(fail(new Error(data.message), useAlert));
        if (useAlert) Toast.show({ type: 'success', text1: 'Dibuang', text2: data.message });
        return resolve(true);
      })
      .catch(e => resolve(fail(e, useAlert)));
  });
};
