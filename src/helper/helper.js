const crypto = require('crypto');
const secretKey = 'Initial-G';
// Fungsi untuk mengenkripsi data
export const encryptData = data => {
  if (!data) return;
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
};

// Fungsi untuk mendekripsi data
export const decryptData = encryptedData => {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    return JSON.parse(decryptedData);
  } catch (error) {
    console.log(error);
    return false;
  }
};
