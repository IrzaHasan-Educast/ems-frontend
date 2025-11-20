export const validateFullName = (name) => {
  return /^[A-Za-z\s]+$/.test(name);
};

export const validatePhone = (phone) => {
  return /^03[0-9]{9}$/.test(phone);
};

export const validateUsername = (username) => {
  return /^[A-Za-z0-9]+$/.test(username);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};
