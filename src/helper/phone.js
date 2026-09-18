// Keep Android customer field values identical to Backend lib/customer-format.js.
const MAX_PHONE_LENGTH = 18; // mst_customer.phone / phone_alt STRING(18)
const MAX_TEXT_LENGTH = 255; // name / email / address / pic STRING(255)

export const normalizePhone = raw => {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // Buang semua karakter non-digit (spasi, strip, kurung, titik, plus)
  let digits = str.replace(/\D/g, '');

  // Awalan internasional 00 -> hilangkan leading zero
  if (digits.startsWith('00')) digits = digits.replace(/^0+/, '');
  if (!digits) return null;

  let canonical;
  if (digits.startsWith('62')) {
    canonical = digits;
  } else if (digits.startsWith('0')) {
    canonical = `62${digits.slice(1)}`;
  } else if (digits.startsWith('8')) {
    // Nomor seluler lokal tanpa awalan 0/+62
    canonical = `62${digits}`;
  } else {
    // Nomor non-Indonesia / tidak dikenali: pertahankan
    canonical = digits;
  }

  return `+${canonical}`.slice(0, MAX_PHONE_LENGTH) || null;
};

export const normalizeEmail = raw => {
  if (raw === undefined || raw === null) return null;
  const email = String(raw).trim().toLowerCase().slice(0, MAX_TEXT_LENGTH);
  return email || null;
};

/** Rapikan spasi berlebih dan potong ke panjang kolom. */
export const normalizeText = raw => {
  if (raw === undefined || raw === null) return null;
  const text = String(raw).replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
  return text || null;
};

export const isValidLocalPhone = raw => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
};
