// Unit pengali kode harga (harus sinkron dengan backend price-code-unit.js)
// multiplier ditampilkan sebagai '0' sebanyak unit:
// none → (kosong), tens → 0, hundreds → 00, thousands → 000, dst.
export const PRICE_UNIT_LIST = [
  {value: 'none', label: 'None', multiplier: ''},
  {value: 'tens', label: 'Tens', multiplier: '0'},
  {value: 'hundreds', label: 'Hundreds', multiplier: '00'},
  {value: 'thousands', label: 'Thousands', multiplier: '000'},
  {value: 'ten_thousands', label: 'Ten Thousands', multiplier: '0000'},
  {value: 'hundred_thousands', label: 'Hundred Thousands', multiplier: '00000'},
  {value: 'million', label: 'Million', multiplier: '000000'},
  {value: 'billion', label: 'Billion', multiplier: '000000000'},
];
