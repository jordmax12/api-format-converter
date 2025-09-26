const { determineFormat } = require('./hybridDetector');
const {
  stringToJson,
  jsonToString,
  stringToXml,
  xmlToString,
  jsonToXml,
  xmlToJson
} = require('./converter');

/**
 * Validates the conversion request parameters
 * @param {string} input - The input data
 * @param {string} outputFormat - The target format
 * @returns {Object} - { isValid: boolean, error?: Object }
 */
function validateRequest(input, outputFormat) {
  if (!input) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: {
          error: 'Missing required parameter',
          message: 'input is required - provide the data to convert'
        }
      }
    };
  }

  if (!outputFormat) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: {
          error: 'Missing required parameter',
          message: 'outputFormat is required (json, xml, or string)'
        }
      }
    };
  }

  if (!['json', 'xml', 'string'].includes(outputFormat.toLowerCase())) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: {
          error: 'Invalid output format',
          message: 'outputFormat must be one of: json, xml, string'
        }
      }
    };
  }

  if (typeof input === 'string' && input.trim() === '') {
    return {
      isValid: false,
      error: {
        status: 400,
        message: {
          error: 'Empty input',
          message: 'Input data cannot be empty'
        }
      }
    };
  }

  return { isValid: true };
}

/**
 * Detects input format and separators
 * @param {string|Object} inputData - The input data
 * @param {Object} customSeparators - Custom separators if provided
 * @returns {Object} - { inputFormat: string, separators: Object }
 */
function detectInputFormat(inputData, customSeparators) {
  const detection = determineFormat(inputData, ''); // Ignore HTTP Content-Type
  const inputFormat = detection.format;
  const separators = customSeparators || detection.separators || { element: '*', segment: '~' };
  
  return { inputFormat, separators };
}

/**
 * Validates separators for string format conversions
 * @param {string} inputFormat - Detected input format
 * @param {string} outputFormat - Target output format
 * @param {Object} separators - Detected or provided separators
 * @returns {Object} - { isValid: boolean, error?: Object }
 */
function validateSeparators(inputFormat, outputFormat, separators) {
  if ((inputFormat === 'string' || outputFormat === 'string') && !separators) {
    return {
      isValid: false,
      error: {
        status: 400,
        message: {
          error: 'Unable to detect separators',
          message: 'For string format, separators must be detectable or provided explicitly'
        }
      }
    };
  }
  
  return { isValid: true };
}

/**
 * Performs the actual format conversion
 * @param {string|Object} inputData - The input data
 * @param {string} inputFormat - Detected input format
 * @param {string} targetFormat - Target output format
 * @param {Object} separators - Separators for string format
 * @param {boolean} strictMode - Whether to preserve empty elements
 * @returns {Promise<any>} - Converted data
 */
async function performConversion(inputData, inputFormat, targetFormat, separators, strictMode) {
  // No conversion needed
  if (inputFormat === targetFormat) {
    if (inputFormat === 'json') {
      return typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
    }
    return inputData;
  }

  // String conversions
  if (inputFormat === 'string' && targetFormat === 'json') {
    return stringToJson(inputData, separators, strictMode);
  }
  
  if (inputFormat === 'string' && targetFormat === 'xml') {
    return stringToXml(inputData, separators, strictMode);
  }

  // JSON conversions
  if (inputFormat === 'json' && targetFormat === 'string') {
    const jsonData = typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
    return jsonToString(jsonData, separators, strictMode);
  }
  
  if (inputFormat === 'json' && targetFormat === 'xml') {
    const jsonData = typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
    return jsonToXml(jsonData);
  }

  // XML conversions
  if (inputFormat === 'xml' && targetFormat === 'string') {
    return await xmlToString(inputData, separators, strictMode);
  }
  
  if (inputFormat === 'xml' && targetFormat === 'json') {
    return await xmlToJson(inputData);
  }

  // Unsupported conversion
  throw new Error(`Cannot convert from ${inputFormat} to ${targetFormat}`);
}

/**
 * Creates the appropriate response based on target format
 * @param {any} cleanedData - The cleaned conversion result
 * @param {string} inputFormat - Detected input format
 * @param {string} targetFormat - Target output format
 * @param {boolean} strictMode - Strict mode setting
 * @returns {Object} - { contentType: string, isJson: boolean, data: any }
 */
function createResponse(cleanedData, inputFormat, targetFormat, strictMode) {
  const contentType = {
    'json': 'application/json',
    'xml': 'application/xml',
    'string': 'text/plain'
  }[targetFormat];

  if (targetFormat === 'json') {
    return {
      contentType,
      isJson: true,
      data: {
        success: true,
        inputFormat,
        outputFormat: targetFormat,
        strict: strictMode,
        data: cleanedData
      }
    };
  }

  return {
    contentType,
    isJson: false,
    data: cleanedData
  };
}

/**
 * Handles conversion errors and returns appropriate error responses
 * @param {Error} error - The caught error
 * @returns {Object} - { status: number, message: Object }
 */
function handleConversionError(error) {
  console.error('Conversion error:', error);

  if (error.message.includes('JSON parsing failed') || error.message.includes('Invalid JSON')) {
    return {
      status: 400,
      message: {
        error: 'Invalid JSON input',
        message: 'The provided JSON data is malformed'
      }
    };
  }
  
  if (error.message.includes('XML parsing failed')) {
    return {
      status: 400,
      message: {
        error: 'Invalid XML input',
        message: 'The provided XML data is malformed'
      }
    };
  }
  
  if (error.message.includes('Input must be a non-empty string')) {
    return {
      status: 400,
      message: {
        error: 'Empty input',
        message: 'Input data cannot be empty'
      }
    };
  }

  if (error.message.includes('Cannot convert from')) {
    return {
      status: 400,
      message: {
        error: 'Unsupported conversion',
        message: error.message
      }
    };
  }

  // Generic server error
  return {
    status: 500,
    message: {
      error: 'Internal server error',
      message: 'An error occurred during conversion'
    }
  };
}

module.exports = {
  validateRequest,
  detectInputFormat,
  validateSeparators,
  performConversion,
  createResponse,
  handleConversionError
};
