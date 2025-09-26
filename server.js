const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const {
  validateRequest,
  detectInputFormat,
  validateSeparators,
  performConversion,
  createResponse,
  handleConversionError
} = require('./src/conversionHandler');

app.use(express.json({ limit: '1mb' }));
app.use(express.text({ limit: '1mb', type: ['text/plain', 'application/xml', 'text/xml'] }));

const DEFAULT_STRICT_MODE = process.env.DEFAULT_STRICT_MODE === 'false' ? false : true;

const healthcheck = (res) => res.json({ status: 'OK', timestamp: new Date().toISOString() });

app.post('/convert', async (req, res) => {
  try {
    // Extract parameters from request body
    const { input, outputFormat, strict, separators } = req.body || {};
    // Validate request parameters
    const validation = validateRequest(input, outputFormat);
    if (!validation.isValid) {
      return res.status(validation.error.status).json(validation.error.message);
    }

    // Set defaults and detect input format
    const inputData = input;
    const strictMode = strict ?? DEFAULT_STRICT_MODE;
    const targetFormat = outputFormat.toLowerCase();

    const { inputFormat, separators: detectedSeparators } = detectInputFormat(inputData, separators);

    // Validate separators for string format conversions
    const separatorValidation = validateSeparators(inputFormat, targetFormat, detectedSeparators);
    if (!separatorValidation.isValid) {
      return res.status(separatorValidation.error.status).json(separatorValidation.error.message);
    }

    // Perform the conversion
    const convertedData = await performConversion(inputData, inputFormat, targetFormat, detectedSeparators, strictMode);

    // Clean the data for API response (remove internal metadata/order fields)
    const { cleanForApi } = require('./src/cleanupUtils');
    const cleanedData = await cleanForApi(convertedData, targetFormat);

    // Create and send response
    const response = createResponse(cleanedData, inputFormat, targetFormat, strictMode);
    res.set('Content-Type', response.contentType);

    if (response.isJson) {
      res.json(response.data);
    } else {
      res.send(response.data);
    }

  } catch (error) {
    const errorResponse = handleConversionError(error);
    res.status(errorResponse.status).json(errorResponse.message);
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Format Converter',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: {
      defaultStrictMode: !!DEFAULT_STRICT_MODE,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    endpoints: {
      convert: {
        method: 'POST',
        path: '/convert',
        description: 'Convert between JSON, XML, and custom string formats',
        parameters: {
          required: {
            input: 'string|object - The data to convert (Stringified JSON, XML string, or custom string format)',
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
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

// Export for Vercel
module.exports = app;
