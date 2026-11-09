/**
 * Input Validators for Authentication
 * Smart Agriculture Assistant Backend
 */

/**
 * Validate password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter (A-Z)'
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter (a-z)'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number (0-9)'
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*)'
    };
  }

  return { isValid: true };
}

/**
 * Normalize and validate email address
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email is required' };
  }

  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(clean)) {
    return { isValid: false, message: 'Please provide a valid email address' };
  }

  return { isValid: true, email: clean };
}

/**
 * Normalize and validate Indian mobile number (10 digits)
 */
export function validateMobileNumber(mobile) {
  if (!mobile || typeof mobile !== 'string') {
    return { isValid: false, message: 'Mobile number is required' };
  }

  // Remove spaces, hyphens, and leading +91 or 0
  let clean = mobile.trim().replace(/[\s\-()]/g, '');
  if (clean.startsWith('+91')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('91') && clean.length === 12) {
    clean = clean.slice(2);
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  }

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(clean)) {
    return {
      isValid: false,
      message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9'
    };
  }

  return { isValid: true, mobileNumber: clean };
}

/**
 * Validate Indian Postal PIN Code (6 digits)
 */
export function validatePinCode(pinCode) {
  if (!pinCode) {
    return { isValid: false, message: 'PIN code is required' };
  }

  const clean = String(pinCode).trim();
  const pinRegex = /^[1-9][0-9]{5}$/;

  if (!pinRegex.test(clean)) {
    return {
      isValid: false,
      message: 'Please provide a valid 6-digit Indian PIN code'
    };
  }

  return { isValid: true, pinCode: clean };
}

/**
 * Validate User Type
 */
export const ALLOWED_USER_TYPES = [
  'farmer',
  'agriculture_student',
  'agriculture_expert',
  'agriculture_business_owner',
  'other'
];

export function validateUserType(userType) {
  if (!userType) {
    return { isValid: true, userType: 'farmer' }; // default
  }

  const clean = String(userType).trim().toLowerCase();
  if (!ALLOWED_USER_TYPES.includes(clean)) {
    return {
      isValid: false,
      message: `Invalid user type. Allowed values: ${ALLOWED_USER_TYPES.join(', ')}`
    };
  }

  return { isValid: true, userType: clean };
}


