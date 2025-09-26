const {
  validateRequest,
  detectInputFormat,
  validateSeparators,
  performConversion,
  createResponse,
  handleConversionError
} = require('../../src/conversionHandler');

// Mock the dependencies
jest.mock('../../src/formatDetector');
jest.mock('../../src/converter');

const { determineFormat } = require('../../src/formatDetector');
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

  // validateRequest tests
  it('validateRequest - should return valid for correct parameters', () => {
    const result = validateRequest('test input', 'json');

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('validateRequest - should return error for missing input', () => {
    const result = validateRequest(null, 'json');

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message.error).toBe('Missing required parameter');
    expect(result.error.message.message).toBe('input is required - provide the data to convert');
  });

  it('validateRequest - should return error for undefined input', () => {
    const result = validateRequest(undefined, 'json');

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
  });

  it('validateRequest - should return error for missing outputFormat', () => {
    const result = validateRequest('test input', null);

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message.error).toBe('Missing required parameter');
    expect(result.error.message.message).toBe('outputFormat is required (json, xml, or string)');
  });

  it('validateRequest - should return error for invalid outputFormat', () => {
    const result = validateRequest('test input', 'invalid');

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message.error).toBe('Invalid output format');
    expect(result.error.message.message).toBe('outputFormat must be one of: json, xml, string');
  });

  it('validateRequest - should accept valid outputFormats (case insensitive)', () => {
    expect(validateRequest('test', 'json').isValid).toBe(true);
    expect(validateRequest('test', 'JSON').isValid).toBe(true);
    expect(validateRequest('test', 'xml').isValid).toBe(true);
    expect(validateRequest('test', 'XML').isValid).toBe(true);
    expect(validateRequest('test', 'string').isValid).toBe(true);
    expect(validateRequest('test', 'STRING').isValid).toBe(true);
  });

  it('validateRequest - should return error for empty string input', () => {
    const result = validateRequest('   ', 'json');

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message.error).toBe('Empty input');
    expect(result.error.message.message).toBe('Input data cannot be empty');
  });

  it('validateRequest - should accept non-string input (objects)', () => {
    const result = validateRequest({ test: 'data' }, 'string');

    expect(result.isValid).toBe(true);
  });

  // detectInputFormat tests
  it('detectInputFormat - should detect format and use provided separators', () => {
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

  it('detectInputFormat - should detect format and use detected separators when custom not provided', () => {
    determineFormat.mockReturnValue({
      format: 'string',
      separators: { element: '*', segment: '~' }
    });

    const result = detectInputFormat('test*data~more*data~', null);

    expect(result.inputFormat).toBe('string');
    expect(result.separators).toEqual({ element: '*', segment: '~' });
  });

  it('detectInputFormat - should use default separators when none detected or provided', () => {
    determineFormat.mockReturnValue({
      format: 'json'
    });

    const result = detectInputFormat('{"test": "data"}', null);

    expect(result.inputFormat).toBe('json');
    expect(result.separators).toEqual({ element: '*', segment: '~' });
  });

  it('detectInputFormat - should handle XML format detection', () => {
    determineFormat.mockReturnValue({
      format: 'xml'
    });

    const result = detectInputFormat('<root><test>data</test></root>', null);

    expect(result.inputFormat).toBe('xml');
    expect(result.separators).toEqual({ element: '*', segment: '~' });
  });

  // validateSeparators tests
  it('validateSeparators - should return valid when separators are provided for string format', () => {
    const result = validateSeparators('string', 'json', { element: '*', segment: '~' });

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('validateSeparators - should return valid for non-string formats without separators', () => {
    const result = validateSeparators('json', 'xml', null);

    expect(result.isValid).toBe(true);
  });

  it('validateSeparators - should return error when input is string format but no separators', () => {
    const result = validateSeparators('string', 'json', null);

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message.error).toBe('Unable to detect separators');
  });

  it('validateSeparators - should return error when output is string format but no separators', () => {
    const result = validateSeparators('json', 'string', null);

    expect(result.isValid).toBe(false);
    expect(result.error.status).toBe(400);
    expect(result.error.message.error).toBe('Unable to detect separators');
  });

  it('validateSeparators - should return valid when both input and output are non-string formats', () => {
    const result = validateSeparators('json', 'xml', null);

    expect(result.isValid).toBe(true);
  });

  // performConversion tests
  it('performConversion - should return input data unchanged when input and target formats are the same (string)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const inputData = 'test*data~more*data~';
    const result = await performConversion(inputData, 'string', 'string', separators, strictMode);

    expect(result).toBe(inputData);
  });

  it('performConversion - should return parsed JSON when input and target formats are both json (string input)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const inputData = '{"test": "data"}';
    const result = await performConversion(inputData, 'json', 'json', separators, strictMode);

    expect(result).toEqual({ test: 'data' });
  });

  it('performConversion - should return object unchanged when input and target formats are both json (object input)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const inputData = { test: 'data' };
    const result = await performConversion(inputData, 'json', 'json', separators, strictMode);

    expect(result).toBe(inputData);
  });

  it('performConversion - should convert string to json', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };
    stringToJson.mockReturnValue(mockResult);

    const result = await performConversion('TEST*data~', 'string', 'json', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(stringToJson).toHaveBeenCalledWith('TEST*data~', separators, strictMode);
  });

  it('performConversion - should convert string to xml', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = '<root><TEST><TEST1>data</TEST1></TEST></root>';
    stringToXml.mockReturnValue(mockResult);

    const result = await performConversion('TEST*data~', 'string', 'xml', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(stringToXml).toHaveBeenCalledWith('TEST*data~', separators, strictMode);
  });

  it('performConversion - should convert json to string (string input)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = 'TEST*data~';
    jsonToString.mockReturnValue(mockResult);
    const jsonInput = '{"segments":[{"segment_id":"TEST","elements":["data"]}]}';

    const result = await performConversion(jsonInput, 'json', 'string', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(jsonToString).toHaveBeenCalledWith({ segments: [{ segment_id: 'TEST', elements: ['data'] }] }, separators, strictMode);
  });

  it('performConversion - should convert json to string (object input)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = 'TEST*data~';
    jsonToString.mockReturnValue(mockResult);
    const jsonInput = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };

    const result = await performConversion(jsonInput, 'json', 'string', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(jsonToString).toHaveBeenCalledWith(jsonInput, separators, strictMode);
  });

  it('performConversion - should convert json to xml (string input)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = '<root><TEST><TEST1>data</TEST1></TEST></root>';
    jsonToXml.mockReturnValue(mockResult);
    const jsonInput = '{"segments":[{"segment_id":"TEST","elements":["data"]}]}';

    const result = await performConversion(jsonInput, 'json', 'xml', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(jsonToXml).toHaveBeenCalledWith({ segments: [{ segment_id: 'TEST', elements: ['data'] }] });
  });

  it('performConversion - should convert json to xml (object input)', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = '<root><TEST><TEST1>data</TEST1></TEST></root>';
    jsonToXml.mockReturnValue(mockResult);
    const jsonInput = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };

    const result = await performConversion(jsonInput, 'json', 'xml', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(jsonToXml).toHaveBeenCalledWith(jsonInput);
  });

  it('performConversion - should convert xml to string', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = 'TEST*data~';
    xmlToString.mockResolvedValue(mockResult);

    const result = await performConversion('<root><TEST><TEST1>data</TEST1></TEST></root>', 'xml', 'string', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(xmlToString).toHaveBeenCalledWith('<root><TEST><TEST1>data</TEST1></TEST></root>', separators, strictMode);
  });

  it('performConversion - should convert xml to json', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    const mockResult = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };
    xmlToJson.mockResolvedValue(mockResult);

    const result = await performConversion('<root><TEST><TEST1>data</TEST1></TEST></root>', 'xml', 'json', separators, strictMode);

    expect(result).toBe(mockResult);
    expect(xmlToJson).toHaveBeenCalledWith('<root><TEST><TEST1>data</TEST1></TEST></root>');
  });

  it('performConversion - should throw error for unsupported conversion', async () => {
    const separators = { element: '*', segment: '~' };
    const strictMode = true;
    await expect(performConversion('test', 'unknown', 'json', separators, strictMode))
      .rejects.toThrow('Cannot convert from unknown to json');
  });

  // createResponse tests
  it('createResponse - should create JSON response for json target format', () => {
    const cleanedData = { segments: [{ segment_id: 'TEST', elements: ['data'] }] };
    const result = createResponse(cleanedData, 'json');

    expect(result.contentType).toBe('application/json');
    expect(result.isJson).toBe(true);
    expect(result.data).toEqual(cleanedData);
  });

  it('createResponse - should create raw response for xml target format', () => {
    const cleanedData = '<root><TEST><TEST1>data</TEST1></TEST></root>';
    const result = createResponse(cleanedData, 'xml');

    expect(result.contentType).toBe('application/xml');
    expect(result.isJson).toBe(false);
    expect(result.data).toBe(cleanedData);
  });

  it('createResponse - should create raw response for string target format', () => {
    const cleanedData = 'TEST*data~';
    const result = createResponse(cleanedData, 'string');

    expect(result.contentType).toBe('text/plain');
    expect(result.isJson).toBe(false);
    expect(result.data).toBe(cleanedData);
  });

  // handleConversionError tests
  it('handleConversionError - should handle JSON parsing errors', () => {
    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('JSON parsing failed: invalid syntax');
    const result = handleConversionError(error);

    expect(result.status).toBe(400);
    expect(result.message.error).toBe('Invalid JSON input');
    expect(result.message.message).toBe('The provided JSON data is malformed');
    expect(console.error).toHaveBeenCalledWith('Conversion error:', error);

    console.error.mockRestore();
  });

  it('handleConversionError - should handle Invalid JSON errors', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Invalid JSON structure');
    const result = handleConversionError(error);

    expect(result.status).toBe(400);
    expect(result.message.error).toBe('Invalid JSON input');

    console.error.mockRestore();
  });

  it('handleConversionError - should handle XML parsing errors', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('XML parsing failed: malformed XML');
    const result = handleConversionError(error);

    expect(result.status).toBe(400);
    expect(result.message.error).toBe('Invalid XML input');
    expect(result.message.message).toBe('The provided XML data is malformed');

    console.error.mockRestore();
  });

  it('handleConversionError - should handle empty input errors', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Input must be a non-empty string');
    const result = handleConversionError(error);

    expect(result.status).toBe(400);
    expect(result.message.error).toBe('Empty input');
    expect(result.message.message).toBe('Input data cannot be empty');

    console.error.mockRestore();
  });

  it('handleConversionError - should handle unsupported conversion errors', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Cannot convert from unknown to json');
    const result = handleConversionError(error);

    expect(result.status).toBe(400);
    expect(result.message.error).toBe('Unsupported conversion');
    expect(result.message.message).toBe('Cannot convert from unknown to json');

    console.error.mockRestore();
  });

  it('handleConversionError - should handle generic errors as internal server errors', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('Some unexpected error');
    const result = handleConversionError(error);

    expect(result.status).toBe(500);
    expect(result.message.error).toBe('Internal server error');
    expect(result.message.message).toBe('An error occurred during conversion');

    console.error.mockRestore();
  });

  it('handleConversionError - should handle errors without messages', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error();
    const result = handleConversionError(error);

    expect(result.status).toBe(500);
    expect(result.message.error).toBe('Internal server error');

    console.error.mockRestore();
  });
});
