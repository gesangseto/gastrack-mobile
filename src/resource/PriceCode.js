import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
let url = `/api/v1/master/price-code`;

// List price code dari mst_price_code (search = LIKE code/name/number)
export const getListPriceCode = async (property = {}, useAlert = true) => {
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