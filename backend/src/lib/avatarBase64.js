/**
 * Avatar Base64 Conversion Utility
 * Converts uploaded images to Base64 for storage in database.
 * 
 * Features:
 * - File type validation (JPEG, PNG, WebP, GIF)
 * - Size validation (max 500KB before encoding)
 * - Automatic MIME type detection
 * - Returns data URI format ready for <img src="">
 */

// Allowed MIME types for avatar images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Max file size before Base64 encoding (500KB → ~667KB after encoding)
const MAX_FILE_SIZE = 500 * 1024; // 500KB

// Magic bytes for detecting file type
const MAGIC_BYTES = {
  'ffd8ff': 'image/jpeg',
  '89504e47': 'image/png',
  '52494646': 'image/webp', // RIFF (WebP container)
  '47494638': 'image/gif',
};

/**
 * Detect MIME type from buffer using magic bytes
 */
function detectMimeType(buffer) {
  if (!buffer || buffer.length < 4) return null;
  
  const hex = buffer.slice(0, 4).toString('hex').toLowerCase();
  
  // Check JPEG (starts with FFD8FF)
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  
  // Check PNG (starts with 89504E47)
  if (hex.startsWith('89504e47')) return 'image/png';
  
  // Check GIF (starts with 47494638)
  if (hex.startsWith('47494638')) return 'image/gif';
  
  // Check WebP (RIFF container, need to check further)
  if (hex.startsWith('52494646') && buffer.length >= 12) {
    const webpMarker = buffer.slice(8, 12).toString('ascii');
    if (webpMarker === 'WEBP') return 'image/webp';
  }
  
  return null;
}

/**
 * Validate and convert image buffer to Base64 data URI
 * 
 * @param {Buffer} buffer - Image file buffer
 * @param {string} declaredMime - MIME type declared by upload (from multer)
 * @returns {{ success: boolean, data?: string, error?: string, errorCode?: string }}
 */
export function convertToBase64(buffer, declaredMime) {
  // Validate buffer exists
  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      error: 'No file data provided',
      errorCode: 'NO_FILE',
    };
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2);
    return {
      success: false,
      error: `File too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // Detect actual MIME type from file content
  const detectedMime = detectMimeType(buffer);
  
  // Validate detected MIME type
  if (!detectedMime) {
    return {
      success: false,
      error: 'Unable to detect image format. Please upload a valid JPEG, PNG, WebP, or GIF image.',
      errorCode: 'INVALID_FORMAT',
    };
  }

  // Check if detected type is allowed
  if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
    return {
      success: false,
      error: `Unsupported image format (${detectedMime}). Allowed formats: JPEG, PNG, WebP, GIF.`,
      errorCode: 'UNSUPPORTED_FORMAT',
    };
  }

  // Additional security: verify declared MIME matches detected (or accept if not declared)
  if (declaredMime && !ALLOWED_MIME_TYPES.includes(declaredMime)) {
    return {
      success: false,
      error: 'Invalid declared file type.',
      errorCode: 'INVALID_DECLARED_TYPE',
    };
  }

  // Convert to Base64 and create data URI
  const base64 = buffer.toString('base64');
  const dataUri = `data:${detectedMime};base64,${base64}`;

  return {
    success: true,
    data: dataUri,
    mimeType: detectedMime,
    originalSize: buffer.length,
    base64Size: base64.length,
  };
}

/**
 * Validate if a string is a valid Base64 data URI for images
 */
export function isValidBase64DataUri(str) {
  if (!str || typeof str !== 'string') return false;
  const regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
  return regex.test(str);
}

/**
 * Get the size of a Base64 data URI in bytes (approximate original file size)
 */
export function getBase64Size(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return 0;
  const base64Part = dataUri.split(',')[1];
  if (!base64Part) return 0;
  // Base64 encodes 3 bytes into 4 characters, so decode
  const padding = (base64Part.match(/=+$/) || [''])[0].length;
  return Math.floor((base64Part.length * 3) / 4) - padding;
}

export const AVATAR_MAX_SIZE = MAX_FILE_SIZE;
export const AVATAR_ALLOWED_MIMES = ALLOWED_MIME_TYPES;
