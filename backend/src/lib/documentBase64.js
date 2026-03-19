/**
 * Document Base64 Conversion Utility
 * Converts uploaded documents (Word, PowerPoint, Excel, PDF, Images) to Base64.
 * 
 * Supported formats:
 * - PDF: application/pdf
 * - Word: .doc, .docx
 * - PowerPoint: .ppt, .pptx
 * - Excel: .xls, .xlsx
 * - Images: JPEG, PNG, WebP, GIF
 * 
 * Max file size: 10MB (becomes ~13.3MB after Base64 encoding)
 */

// Allowed MIME types for document attachments
const ALLOWED_DOCUMENT_TYPES = [
  // PDF
  'application/pdf',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// File extensions mapped to MIME types
const EXTENSION_TO_MIME = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Max file size: 10MB before Base64 encoding
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Magic bytes for file type detection
const MAGIC_BYTES = {
  '25504446': 'application/pdf', // %PDF
  'd0cf11e0': 'application/msword', // Old Office format (doc, xls, ppt)
  '504b0304': 'application/zip', // ZIP-based (docx, xlsx, pptx, etc.)
  'ffd8ff': 'image/jpeg',
  '89504e47': 'image/png',
  '47494638': 'image/gif',
  '52494646': 'image/webp', // RIFF container
};

/**
 * Detect MIME type from buffer using magic bytes
 */
function detectMimeType(buffer, filename) {
  if (!buffer || buffer.length < 8) return null;
  
  const hex = buffer.slice(0, 8).toString('hex').toLowerCase();
  
  // Check PDF
  if (hex.startsWith('25504446')) return 'application/pdf';
  
  // Check old Office format (compound document)
  if (hex.startsWith('d0cf11e0')) {
    // Need filename extension to distinguish doc/xls/ppt
    const ext = getExtension(filename);
    if (ext === '.doc') return 'application/msword';
    if (ext === '.xls') return 'application/vnd.ms-excel';
    if (ext === '.ppt') return 'application/vnd.ms-powerpoint';
    return 'application/msword'; // Default to Word for old format
  }
  
  // Check ZIP-based Office formats (docx, xlsx, pptx)
  if (hex.startsWith('504b0304') || hex.startsWith('504b0506') || hex.startsWith('504b0708')) {
    const ext = getExtension(filename);
    if (ext === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === '.xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === '.pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    // Fallback based on common usage
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  
  // Check images
  if (hex.startsWith('ffd8ff')) return 'image/jpeg';
  if (hex.startsWith('89504e47')) return 'image/png';
  if (hex.startsWith('47494638')) return 'image/gif';
  if (hex.startsWith('52494646') && buffer.length >= 12) {
    const marker = buffer.slice(8, 12).toString('ascii');
    if (marker === 'WEBP') return 'image/webp';
  }
  
  return null;
}

/**
 * Get file extension from filename
 */
function getExtension(filename) {
  if (!filename) return '';
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Get human-readable file type name
 */
export function getFileTypeName(mimeType) {
  const typeNames = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'image/jpeg': 'Image',
    'image/jpg': 'Image',
    'image/png': 'Image',
    'image/webp': 'Image',
    'image/gif': 'Image',
  };
  return typeNames[mimeType] || 'Document';
}

/**
 * Check if MIME type is an image
 */
export function isImageType(mimeType) {
  return mimeType?.startsWith('image/');
}

/**
 * Check if MIME type can be previewed in browser
 */
export function isPreviewable(mimeType) {
  return mimeType === 'application/pdf' || mimeType?.startsWith('image/');
}

/**
 * Convert document buffer to Base64 data URI
 * 
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} declaredMime - MIME type declared by upload
 * @returns {{ success: boolean, data?: string, mimeType?: string, error?: string, errorCode?: string }}
 */
export function convertDocumentToBase64(buffer, filename, declaredMime) {
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
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      success: false,
      error: `File too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // Detect actual MIME type
  let mimeType = detectMimeType(buffer, filename);
  
  // Fallback to declared MIME or extension-based detection
  if (!mimeType) {
    if (declaredMime && ALLOWED_DOCUMENT_TYPES.includes(declaredMime)) {
      mimeType = declaredMime;
    } else {
      const ext = getExtension(filename);
      mimeType = EXTENSION_TO_MIME[ext];
    }
  }

  // Validate MIME type
  if (!mimeType || !ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    return {
      success: false,
      error: 'Unsupported file format. Allowed: PDF, Word, PowerPoint, Excel, Images.',
      errorCode: 'UNSUPPORTED_FORMAT',
    };
  }

  // Convert to Base64
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimeType};base64,${base64}`;

  return {
    success: true,
    data: dataUri,
    mimeType,
    originalSize: buffer.length,
    base64Size: base64.length,
  };
}

/**
 * Extract MIME type from Base64 data URI
 */
export function getMimeFromDataUri(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}

/**
 * Check if string is a Base64 data URI
 */
export function isBase64DataUri(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('data:') && str.includes(';base64,');
}

export const DOCUMENT_MAX_SIZE = MAX_FILE_SIZE;
export const DOCUMENT_ALLOWED_TYPES = ALLOWED_DOCUMENT_TYPES;
