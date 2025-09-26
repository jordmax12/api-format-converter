const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import converter functions and utilities
const { determineFormat } = require('./src/hybridDetector');
const {
  stringToJson,
  jsonToString,
  stringToXml,
  xmlToString,
  jsonToXml,
  xmlToJson
} = require('./src/converter');
const { cleanForApi } = require('./src/cleanupUtils');
const { detectSeparators } = require('./src/formatDetector');

app.use(express.json({ limit: '1mb' }));
app.use(express.text({ limit: '1mb', type: ['text/plain', 'application/xml', 'text/xml'] }));

// Environment variables
const DEFAULT_STRICT_MODE = process.env.DEFAULT_STRICT_MODE === 'false' ? false : true;

const healthcheck = (res) => res.json({ status: 'OK', timestamp: new Date().toISOString() });

// Main conversion endpoint
app.post('/convert', async (req, res) => {
  try {
    // Debug logging
    console.log('Request Content-Type:', req.get('Content-Type'));
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    
    // Extract parameters from request body
    const { input, outputFormat, strict, separators } = req.body || {};
    
    // Validate required parameters
    if (!input) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'input is required - provide the data to convert'
      });
    }

    if (!outputFormat) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'outputFormat is required (json, xml, or string)'
      });
    }

    if (!['json', 'xml', 'string'].includes(outputFormat.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid output format',
        message: 'outputFormat must be one of: json, xml, string'
      });
    }

    // Validate input data
    if (typeof input === 'string' && input.trim() === '') {
      return res.status(400).json({
        error: 'Empty input',
        message: 'Input data cannot be empty'
      });
    }

    // Set defaults
    const inputData = input;
    const strictMode = strict !== undefined ? strict : DEFAULT_STRICT_MODE;
    const customSeparators = separators;
    const contentType = req.get('Content-Type') || '';

    // Detect input format using content-based detection (ignore HTTP Content-Type)
    // The Content-Type header describes the request format, not the input data format
    const detection = determineFormat(inputData, ''); // Pass empty string to ignore Content-Type
    const inputFormat = detection.format;
    const detectedSeparators = customSeparators || detection.separators || { element: '*', segment: '~' };

    // Validate separators for string format
    if ((inputFormat === 'string' || outputFormat === 'string') && !detectedSeparators) {
      return res.status(400).json({
        error: 'Unable to detect separators',
        message: 'For string format, separators must be detectable or provided explicitly'
      });
    }

    let convertedData;
    const targetFormat = outputFormat.toLowerCase();

    // Perform conversion based on input and output formats
    if (inputFormat === targetFormat) {
      // No conversion needed, but still clean for API response
      convertedData = inputFormat === 'json' ? JSON.parse(inputData) : inputData;
    } else if (inputFormat === 'string' && targetFormat === 'json') {
      convertedData = stringToJson(inputData, detectedSeparators, strictMode);
    } else if (inputFormat === 'json' && targetFormat === 'string') {
      const jsonData = typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
      convertedData = jsonToString(jsonData, detectedSeparators, strictMode);
    } else if (inputFormat === 'string' && targetFormat === 'xml') {
      convertedData = stringToXml(inputData, detectedSeparators, strictMode);
    } else if (inputFormat === 'xml' && targetFormat === 'string') {
      convertedData = await xmlToString(inputData, detectedSeparators, strictMode);
    } else if (inputFormat === 'json' && targetFormat === 'xml') {
      const jsonData = typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
      convertedData = jsonToXml(jsonData);
    } else if (inputFormat === 'xml' && targetFormat === 'json') {
      convertedData = await xmlToJson(inputData);
    } else {
      return res.status(400).json({
        error: 'Unsupported conversion',
        message: `Cannot convert from ${inputFormat} to ${targetFormat}`
      });
    }

    // Clean the data for API response (remove internal metadata/order fields)
    const cleanedData = await cleanForApi(convertedData, targetFormat);

    // Set appropriate content type for response
    const responseContentType = {
      'json': 'application/json',
      'xml': 'application/xml',
      'string': 'text/plain'
    }[targetFormat];

    res.set('Content-Type', responseContentType);

    // Send response
    if (targetFormat === 'json') {
      res.json({
        success: true,
        inputFormat,
        outputFormat: targetFormat,
        strict: strictMode,
        data: cleanedData
      });
    } else {
      res.send(cleanedData);
    }

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Handle specific error types
    if (error.message.includes('JSON parsing failed') || error.message.includes('Invalid JSON')) {
      return res.status(400).json({
        error: 'Invalid JSON input',
        message: 'The provided JSON data is malformed'
      });
    } else if (error.message.includes('XML parsing failed')) {
      return res.status(400).json({
        error: 'Invalid XML input',
        message: 'The provided XML data is malformed'
      });
    } else if (error.message.includes('Input must be a non-empty string')) {
      return res.status(400).json({
        error: 'Empty input',
        message: 'Input data cannot be empty'
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during conversion'
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Format Converter',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      defaultStrictMode: DEFAULT_STRICT_MODE,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    endpoints: {
      convert: {
        method: 'POST',
        path: '/convert',
        description: 'Convert between JSON, XML, and custom string formats',
        parameters: {
          required: {
            input: 'string|object - The data to convert (JSON object, XML string, or custom string format)',
            outputFormat: 'string - Target format: json, xml, or string'
          },
          optional: {
            strict: `boolean - Preserve empty elements (default: ${DEFAULT_STRICT_MODE})`,
            separators: 'object - Custom separators for string format: {element, segment}'
          }
        }
      },
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      }
    }
  });
});

app.get('/health', (req, res) => {
  return healthcheck(res);
});

// Start the server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/test`);
  });
}

// Export for Vercel
module.exports = app;
