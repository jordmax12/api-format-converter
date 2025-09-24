const { detectFormat, detectSeparators } = require('./formatDetector');

/**
 * Determines input format using Content-Type header with fallback to auto-detection
 * @param {string} data - The input data
 * @param {string} contentType - The Content-Type header value
 * @returns {Object} - { format: string, separators?: Object }
 */
function determineFormat(data, contentType = '') {
  let format = null;

  if (contentType) {
    format = detectFromContentType(contentType);
  }

  if (!format) {
    format = detectFormat(data);
  }

  const result = { format };
  
  if (format === 'string') {
    const separators = detectSeparators(data);
    if (separators) {
      result.separators = separators;
    }
  }
  
  return result;
}

/**
 * Maps Content-Type header to format
 * @param {string} contentType - The Content-Type header value
 * @returns {string|null} - 'json'|'xml'|'string' or null
 */
function detectFromContentType(contentType) {
  const normalizedType = contentType.toLowerCase().trim();
  
  if (/application\/json|text\/json/.test(normalizedType)) {
    return 'json';
  }
  
  if (/application\/xml|text\/xml|application\/x-xml/.test(normalizedType)) {
    return 'xml';
  }
  
  if (/text\/plain|text\/|application\/octet-stream/.test(normalizedType)) {
    return 'string';
  }

  return null;
}

module.exports = {
  determineFormat,
  detectFromContentType
};
