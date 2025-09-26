const { detectFormat, detectSeparators } = require('./formatDetector');

/**
 * Determines input format using auto-detection
 * @param {string} data - The input data
 * @returns {Object} - { format: string, separators?: Object }
 */
function determineFormat(data) {
  const format = detectFormat(data);
  const result = { format };

  if (format === 'string') {
    const separators = detectSeparators(data);
    if (separators) {
      result.separators = separators;
    }
  }

  return result;
}

module.exports = {
  determineFormat
};
