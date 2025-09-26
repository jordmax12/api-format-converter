const {
  validateRequest,
  detectInputFormat,
  validateSeparators,
  performConversion,
  createResponse,
  handleConversionError
} = require('../../src/conversionHandler');

// Mock the dependencies
jest.mock('../../src/hybridDetector');
jest.mock('../../src/converter');

const { determineFormat } = require('../../src/hybridDetector');
const {
  stringToJson,
  jsonToString,
  stringToXml,
  xmlToString,
  jsonToXml,
  xmlToJson
} = require('../../src/converter');

describe('conversionHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest', () => {
    it('should return valid for correct parameters', () => {
      const result = validateRequest('test input', 'json');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for missing input', () => {
      const result = validateRequest(null, 'json');

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
      expect(result.error.message.error).toBe('Missing required parameter');
      expect(result.error.message.message).toBe('input is required - provide the data to convert');
    });

    it('should return error for undefined input', () => {
      const result = validateRequest(undefined, 'json');

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
    });

    it('should return error for missing outputFormat', () => {
      const result = validateRequest('test input', null);

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
      expect(result.error.message.error).toBe('Missing required parameter');
      expect(result.error.message.message).toBe('outputFormat is required (json, xml, or string)');
    });

    it('should return error for invalid outputFormat', () => {
      const result = validateRequest('test input', 'invalid');

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
      expect(result.error.message.error).toBe('Invalid output format');
      expect(result.error.message.message).toBe('outputFormat must be one of: json, xml, string');
    });

    it('should accept valid outputFormats (case insensitive)', () => {
      expect(validateRequest('test', 'json').isValid).toBe(true);
      expect(validateRequest('test', 'JSON').isValid).toBe(true);
      expect(validateRequest('test', 'xml').isValid).toBe(true);
      expect(validateRequest('test', 'XML').isValid).toBe(true);
      expect(validateRequest('test', 'string').isValid).toBe(true);
      expect(validateRequest('test', 'STRING').isValid).toBe(true);
    });

    it('should return error for empty string input', () => {
      const result = validateRequest('   ', 'json');

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
      expect(result.error.message.error).toBe('Empty input');
      expect(result.error.message.message).toBe('Input data cannot be empty');
    });

    it('should accept non-string input (objects)', () => {
      const result = validateRequest({ test: 'data' }, 'string');

      expect(result.isValid).toBe(true);
    });
  });

  describe('detectInputFormat', () => {
    it('should detect format and use provided separators', () => {
      determineFormat.mockReturnValue({
        format: 'string',
        separators: { element: '*', segment: '~' }
      });

      const customSeparators = { element: '|', segment: '\n' };
      const result = detectInputFormat('test*data~more*data~', customSeparators);

      expect(result.inputFormat).toBe('string');
      expect(result.separators).toEqual(customSeparators);
      expect(determineFormat).toHaveBeenCalledWith('test*data~more*data~');
    });

    it('should detect format and use detected separators when custom not provided', () => {
      determineFormat.mockReturnValue({
        format: 'string',
        separators: { element: '*', segment: '~' }
      });

      const result = detectInputFormat('test*data~more*data~', null);

      expect(result.inputFormat).toBe('string');
      expect(result.separators).toEqual({ element: '*', segment: '~' });
    });

    it('should use default separators when none detected or provided', () => {
      determineFormat.mockReturnValue({
        format: 'json'
      });

      const result = detectInputFormat('{"test": "data"}', null);

      expect(result.inputFormat).toBe('json');
      expect(result.separators).toEqual({ element: '*', segment: '~' });
    });

    it('should handle XML format detection', () => {
      determineFormat.mockReturnValue({
        format: 'xml'
      });

      const result = detectInputFormat('<root><test>data</test></root>', null);

      expect(result.inputFormat).toBe('xml');
      expect(result.separators).toEqual({ element: '*', segment: '~' });
    });
  });

  describe('validateSeparators', () => {
    it('should return valid when separators are provided for string format', () => {
      const result = validateSeparators('string', 'json', { element: '*', segment: '~' });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for non-string formats without separators', () => {
      const result = validateSeparators('json', 'xml', null);

      expect(result.isValid).toBe(true);
    });

    it('should return error when input is string format but no separators', () => {
      const result = validateSeparators('string', 'json', null);

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
      expect(result.error.message.error).toBe('Unable to detect separators');
    });

    it('should return error when output is string format but no separators', () => {
      const result = validateSeparators('json', 'string', null);

      expect(result.isValid).toBe(false);
      expect(result.error.status).toBe(400);
      expect(result.error.message.error).toBe('Unable to detect separators');
    });

    it('should return valid when both input and output are non-string formats', () => {
      const result = validateSeparators('json', 'xml', null);

      expect(result.isValid).toBe(true);
    });
  });

  describe('performConversion', () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;

    it('should return input data unchanged when input and target formats are the same (string)', async () => {
      const inputData = 'test*data~more*data~';
      const result = await performConversion(inputData, 'string', 'string', separators, strictMode);

      expect(result).toBe(inputData);
    });

    it('should return parsed JSON when input and target formats are both json (string input)', async () => {
      const inputData = '{"test": "data"}';
      const result = await performConversion(inputData, 'json', 'json', separators, strictMode);

      expect(result).toEqual({ test: 'data' });
    });

    it('should return object unchanged when input and target formats are both json (object input)', async () => {
      const inputData = { test: 'data' };
      const result = await performConversion(inputData, 'json', 'json', separators, strictMode);

      expect(result).toBe(inputData);
    });

    it('should convert string to json', async () => {
      const mockResult = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };
      stringToJson.mockReturnValue(mockResult);

      const result = await performConversion('TEST*data~', 'string', 'json', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(stringToJson).toHaveBeenCalledWith('TEST*data~', separators, strictMode);
    });

    it('should convert string to xml', async () => {
      const mockResult = '<root><TEST><TEST1>data</TEST1></TEST></root>';
      stringToXml.mockReturnValue(mockResult);

      const result = await performConversion('TEST*data~', 'string', 'xml', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(stringToXml).toHaveBeenCalledWith('TEST*data~', separators, strictMode);
    });

    it('should convert json to string (string input)', async () => {
      const mockResult = 'TEST*data~';
      jsonToString.mockReturnValue(mockResult);
      const jsonInput = '{"segments":[{"segment_id":"TEST","elements":["data"]}]}';

      const result = await performConversion(jsonInput, 'json', 'string', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(jsonToString).toHaveBeenCalledWith({ segments: [{ segment_id: 'TEST', elements: ['data'] }] }, separators, strictMode);
    });

    it('should convert json to string (object input)', async () => {
      const mockResult = 'TEST*data~';
      jsonToString.mockReturnValue(mockResult);
      const jsonInput = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };

      const result = await performConversion(jsonInput, 'json', 'string', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(jsonToString).toHaveBeenCalledWith(jsonInput, separators, strictMode);
    });

    it('should convert json to xml (string input)', async () => {
      const mockResult = '<root><TEST><TEST1>data</TEST1></TEST></root>';
      jsonToXml.mockReturnValue(mockResult);
      const jsonInput = '{"segments":[{"segment_id":"TEST","elements":["data"]}]}';

      const result = await performConversion(jsonInput, 'json', 'xml', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(jsonToXml).toHaveBeenCalledWith({ segments: [{ segment_id: 'TEST', elements: ['data'] }] });
    });

    it('should convert json to xml (object input)', async () => {
      const mockResult = '<root><TEST><TEST1>data</TEST1></TEST></root>';
      jsonToXml.mockReturnValue(mockResult);
      const jsonInput = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };

      const result = await performConversion(jsonInput, 'json', 'xml', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(jsonToXml).toHaveBeenCalledWith(jsonInput);
    });

    it('should convert xml to string', async () => {
      const mockResult = 'TEST*data~';
      xmlToString.mockResolvedValue(mockResult);

      const result = await performConversion('<root><TEST><TEST1>data</TEST1></TEST></root>', 'xml', 'string', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(xmlToString).toHaveBeenCalledWith('<root><TEST><TEST1>data</TEST1></TEST></root>', separators, strictMode);
    });

    it('should convert xml to json', async () => {
      const mockResult = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };
      xmlToJson.mockResolvedValue(mockResult);

      const result = await performConversion('<root><TEST><TEST1>data</TEST1></TEST></root>', 'xml', 'json', separators, strictMode);

      expect(result).toBe(mockResult);
      expect(xmlToJson).toHaveBeenCalledWith('<root><TEST><TEST1>data</TEST1></TEST></root>');
    });

    it('should throw error for unsupported conversion', async () => {
      await expect(performConversion('test', 'unknown', 'json', separators, strictMode))
        .rejects.toThrow('Cannot convert from unknown to json');
    });
  });

  describe('createResponse', () => {
    const inputFormat = 'string';
    const strictMode = true;

    it('should create JSON response for json target format', () => {
      const cleanedData = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };
      const result = createResponse(cleanedData, inputFormat, 'json', strictMode);

      expect(result.contentType).toBe('application/json');
      expect(result.isJson).toBe(true);
      expect(result.data).toEqual({
        success: true,
        inputFormat: 'string',
        outputFormat: 'json',
        strict: true,
        data: cleanedData
      });
    });

    it('should create raw response for xml target format', () => {
      const cleanedData = '<root><TEST><TEST1>data</TEST1></TEST></root>';
      const result = createResponse(cleanedData, inputFormat, 'xml', strictMode);

      expect(result.contentType).toBe('application/xml');
      expect(result.isJson).toBe(false);
      expect(result.data).toBe(cleanedData);
    });

    it('should create raw response for string target format', () => {
      const cleanedData = 'TEST*data~';
      const result = createResponse(cleanedData, inputFormat, 'string', strictMode);

      expect(result.contentType).toBe('text/plain');
      expect(result.isJson).toBe(false);
      expect(result.data).toBe(cleanedData);
    });

    it('should include correct strict mode setting', () => {
      const cleanedData = { test: 'data' };
      const result = createResponse(cleanedData, inputFormat, 'json', false);

      expect(result.data.strict).toBe(false);
    });

    it('should include correct input and output formats', () => {
      const cleanedData = { test: 'data' };
      const result = createResponse(cleanedData, 'xml', 'json', strictMode);

      expect(result.data.inputFormat).toBe('xml');
      expect(result.data.outputFormat).toBe('json');
    });
  });

  describe('handleConversionError', () => {
    beforeEach(() => {
      // Mock console.error to avoid noise in test output
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    it('should handle JSON parsing errors', () => {
      const error = new Error('JSON parsing failed: invalid syntax');
      const result = handleConversionError(error);

      expect(result.status).toBe(400);
      expect(result.message.error).toBe('Invalid JSON input');
      expect(result.message.message).toBe('The provided JSON data is malformed');
      expect(console.error).toHaveBeenCalledWith('Conversion error:', error);
    });

    it('should handle Invalid JSON errors', () => {
      const error = new Error('Invalid JSON structure');
      const result = handleConversionError(error);

      expect(result.status).toBe(400);
      expect(result.message.error).toBe('Invalid JSON input');
    });

    it('should handle XML parsing errors', () => {
      const error = new Error('XML parsing failed: malformed XML');
      const result = handleConversionError(error);

      expect(result.status).toBe(400);
      expect(result.message.error).toBe('Invalid XML input');
      expect(result.message.message).toBe('The provided XML data is malformed');
    });

    it('should handle empty input errors', () => {
      const error = new Error('Input must be a non-empty string');
      const result = handleConversionError(error);

      expect(result.status).toBe(400);
      expect(result.message.error).toBe('Empty input');
      expect(result.message.message).toBe('Input data cannot be empty');
    });

    it('should handle unsupported conversion errors', () => {
      const error = new Error('Cannot convert from unknown to json');
      const result = handleConversionError(error);

      expect(result.status).toBe(400);
      expect(result.message.error).toBe('Unsupported conversion');
      expect(result.message.message).toBe('Cannot convert from unknown to json');
    });

    it('should handle generic errors as internal server errors', () => {
      const error = new Error('Some unexpected error');
      const result = handleConversionError(error);

      expect(result.status).toBe(500);
      expect(result.message.error).toBe('Internal server error');
      expect(result.message.message).toBe('An error occurred during conversion');
    });

    it('should handle errors without messages', () => {
      const error = new Error();
      const result = handleConversionError(error);

      expect(result.status).toBe(500);
      expect(result.message.error).toBe('Internal server error');
    });
  });
});
