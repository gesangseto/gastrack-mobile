// Keep Android customer phone values identical to Backend Master/customer.
export const normalizePhone = raw => {
  if (!raw) return null;

  let phone = String(raw).replace(/[\s\-().]/g, '');
  if (phone.startsWith('0')) {
    phone = `+62${phone.slice(1)}`;
  } else if (phone.startsWith('62') && !phone.startsWith('+')) {
    phone = `+${phone}`;
  }

  return phone.slice(0, 18) || null;
};

export const isValidLocalPhone = raw => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
};
