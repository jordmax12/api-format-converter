/**
 * Detects the format of the input data
 * @param {string} input - The input data as a string
 * @returns {string} - 'json'|'xml'|'string'
 */
function detectFormat(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const trimmedInput = input.trim();
  if (!trimmedInput) {
    throw new Error('Input must be a non-empty string');
  }

  if (detectJSON(trimmedInput)) {
    return 'json';
  }

  if (detectXML(trimmedInput)) {
    return 'xml';
  }

  return 'string';
}

/**
 * Attempts to detect JSON format
 * @param {string} input - Trimmed input string
 * @returns {boolean}
 */
function detectJSON(input) {
  try {
    if (!input.startsWith('{') && !input.startsWith('[')) {
      return false;
    }

    const parsed = JSON.parse(input);
    return typeof parsed === 'object' && parsed !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Attempts to detect XML format
 * @param {string} input - Trimmed input string
 * @returns {boolean}
 */
function detectXML(input) {
  if (input.startsWith('<?xml')) {
    return true;
  }

  if (input.startsWith('<root>') && input.endsWith('</root>')) {
    return true;
  }

  const xmlPattern = /^<[^>]+>.*<\/[^>]+>$/s;
  return xmlPattern.test(input);
}

/**
 * Attempts to detect separators for string format
 * @param {string} input - Trimmed input string
 * @returns {Object|null} - { element: string, segment: string } or null
 */
function detectString(input) {
  const commonSeparators = [
    { element: '*', segment: '~' },
    { element: '|', segment: '\n' },
    { element: ',', segment: '\n' },
    { element: '\t', segment: '\n' }
  ];

  for (const separators of commonSeparators) {
    const { element, segment } = separators;

    if (input.includes(element) && input.includes(segment)) {
      const segments = input.split(segment).filter(s => s.trim());

      if (segments.length > 0) {
        const validSegments = segments.every(seg => {
          const parts = seg.split(element);
          return parts.length >= 2;
        });

        if (validSegments) {
          return separators;
        }
      }
    }
  }
  return null;
}

/**
 * Attempts to auto-detect separators for string format
 * @param {string} input - The string format input
 * @returns {Object|null} - { element: string, segment: string } or null
 */
function detectSeparators(input) {
  return detectString(input);
}
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
  detectFormat,
  detectSeparators,
  detectJSON,
  detectXML,
  detectString,
  determineFormat
};
