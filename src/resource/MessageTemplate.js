import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = `/api/v1/configuration/message-template`;
let urlVar = `/api/v1/configuration/template-variable`;

// List message template (mst_message_template)
// Query: status, channel, trigger_event, search, page, limit
export const getListMessageTemplate = async (property = {}, useAlert = true) => {
  var query_string = new URLSearchParams(property).toString();
  return new Promise(resolve => {
    $axios
      .get(`${url}?${query_string}`)
      .then(result => {
        let data = result.data;
        if (data.error && useAlert) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message,
          });
          return resolve(false);
        }
        return resolve(data.data);
      })
      .catch(e => {
        if (useAlert)
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });
        return resolve(false);
      });
  });
};

// Detail satu template
export const getMessageTemplate = async (id, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .get(`${url}?id=${id}`)
      .then(result => {
        let data = result.data;
        if (data.error && useAlert) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message,
          });
          return resolve(false);
        }
        return resolve(data.data[0]);
      })
      .catch(e => {
        if (useAlert)
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });
        return resolve(false);
      });
  });
};

// Tambah template baru. Wajib: code, name, content_template.
// code harus unik. Body: { code, name, channel, content_template, description,
//   subject, content_type, trigger_event, recipient_type, status }
export const createMessageTemplate = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .put(url, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          Toast.show({
            type: 'error',
            text1: 'Gagal Simpan',
            text2: data.message,
          });
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Template pesan disimpan',
        });
        return resolve(data.data[0]);
      })
      .catch(e => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message,
        });
        return resolve(false);
      });
  });
};

// Update template. Wajib: id. Body sama seperti create.
export const updateMessageTemplate = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .post(url, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          Toast.show({
            type: 'error',
            text1: 'Gagal Update',
            text2: data.message,
          });
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Template pesan diperbarui',
        });
        return resolve(data.data[0]);
      })
      .catch(e => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message,
        });
        return resolve(false);
      });
  });
};

// Hapus template (soft delete). Backend hanya bisa hapus kalau status='Inactive'.
export const deleteMessageTemplate = async (id) => {
  return new Promise(resolve => {
    $axios
      .delete(url, {data: {id: id}})
      .then(result => {
        let data = result.data;
        if (data.error) {
          Toast.show({
            type: 'error',
            text1: 'Gagal Hapus',
            text2: data.message,
          });
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Template pesan dihapus',
        });
        return resolve(true);
      })
      .catch(e => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message,
        });
        return resolve(false);
      });
  });
};

// List variabel template (mst_template_variable) — untuk dropdown {{var}} di form edit.
export const getListTemplateVariable = async (property = {}, useAlert = true) => {
  var query_string = new URLSearchParams(property).toString();
  return new Promise(resolve => {
    $axios
      .get(`${urlVar}?${query_string}`)
      .then(result => {
        let data = result.data;
        if (data.error && useAlert) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message,
          });
          return resolve(false);
        }
        return resolve(data.data);
      })
      .catch(e => {
        if (useAlert)
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });
        return resolve(false);
      });
  });
};
