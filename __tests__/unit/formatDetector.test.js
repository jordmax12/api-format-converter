const {
  detectFormat,
  detectSeparators,
  detectJSON,
  detectXML,
  detectString,
  determineFormat
} = require('../../src/formatDetector');

describe('formatDetector', () => {
  // detectFormat tests
  it('detectFormat - should detect JSON format', () => {
    const jsonData = '{"test": "value"}';
    expect(detectFormat(jsonData)).toBe('json');
  });

  it('detectFormat - should detect XML format with declaration', () => {
    const xmlData = '<?xml version="1.0"?><root><test>value</test></root>';
    expect(detectFormat(xmlData)).toBe('xml');
  });

  it('detectFormat - should detect XML format with root element', () => {
    const xmlData = '<root><test>value</test></root>';
    expect(detectFormat(xmlData)).toBe('xml');
  });

  it('detectFormat - should detect string format', () => {
    const stringData = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
    expect(detectFormat(stringData)).toBe('string');
  });

  it('detectFormat - should default to string format for unrecognized data', () => {
    const plainText = 'This is just plain text';
    expect(detectFormat(plainText)).toBe('string');
  });

  it('detectFormat - should throw error for empty input', () => {
    expect(() => detectFormat('')).toThrow('Input must be a non-empty string');
  });

  it('detectFormat - should throw error for null input', () => {
    expect(() => detectFormat(null)).toThrow('Input must be a non-empty string');
  });

  it('detectFormat - should throw error for non-string input', () => {
    expect(() => detectFormat(123)).toThrow('Input must be a non-empty string');
  });

  it('detectFormat - should throw error for whitespace-only input', () => {
    expect(() => detectFormat('   ')).toThrow('Input must be a non-empty string');
  });

  it('detectFormat - should throw error for tab and newline only input', () => {
    expect(() => detectFormat('\t\n  \r\n')).toThrow('Input must be a non-empty string');
  });

  // detectJSON tests
  it('detectJSON - should return true for valid JSON object', () => {
    expect(detectJSON('{"key": "value"}')).toBe(true);
  });

  it('detectJSON - should return true for valid JSON array', () => {
    expect(detectJSON('[1, 2, 3]')).toBe(true);
  });

  it('detectJSON - should return true for empty object', () => {
    expect(detectJSON('{}')).toBe(true);
  });

  it('detectJSON - should return true for empty array', () => {
    expect(detectJSON('[]')).toBe(true);
  });

  it('detectJSON - should return false for invalid JSON', () => {
    expect(detectJSON('{ invalid json }')).toBe(false);
  });

  it('detectJSON - should return false for string not starting with { or [', () => {
    expect(detectJSON('not json')).toBe(false);
  });

  it('detectJSON - should return false for null value', () => {
    expect(detectJSON('null')).toBe(false);
  });

  it('detectJSON - should return false for number', () => {
    expect(detectJSON('123')).toBe(false);
  });

  it('detectJSON - should return false for boolean', () => {
    expect(detectJSON('true')).toBe(false);
  });

  // detectXML tests
  it('detectXML - should return true for XML with declaration', () => {
    expect(detectXML('<?xml version="1.0"?><root></root>')).toBe(true);
  });

  it('detectXML - should return true for XML with root element', () => {
    expect(detectXML('<root><child>value</child></root>')).toBe(true);
  });

  it('detectXML - should return true for simple XML tags', () => {
    expect(detectXML('<test>content</test>')).toBe(true);
  });

  it('detectXML - should return false for self-closing tags (not matching our pattern)', () => {
    expect(detectXML('<test/>')).toBe(false);
  });

  it('detectXML - should return false for malformed XML', () => {
    expect(detectXML('<root>unclosed')).toBe(false);
  });

  it('detectXML - should return false for non-XML content', () => {
    expect(detectXML('not xml content')).toBe(false);
  });

  it('detectXML - should return false for partial XML', () => {
    expect(detectXML('<root')).toBe(false);
  });

  // detectString tests
  it('detectString - should detect * and ~ separators', () => {
    const input = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
    const result = detectString(input);
    expect(result).toEqual({ element: '*', segment: '~' });
  });

  it('detectString - should detect | and newline separators', () => {
    const input = 'ProductID|4|8|15\nAddressID|42|108';
    const result = detectString(input);
    expect(result).toEqual({ element: '|', segment: '\n' });
  });

  it('detectString - should detect comma and newline separators', () => {
    const input = 'ProductID,4,8,15\nAddressID,42,108';
    const result = detectString(input);
    expect(result).toEqual({ element: ',', segment: '\n' });
  });

  it('detectString - should detect tab and newline separators', () => {
    const input = 'ProductID\t4\t8\t15\nAddressID\t42\t108';
    const result = detectString(input);
    expect(result).toEqual({ element: '\t', segment: '\n' });
  });

  it('detectString - should return null for no valid separators', () => {
    const input = 'just plain text with no separators';
    expect(detectString(input)).toBeNull();
  });

  it('detectString - should return null for single separator only', () => {
    const input = 'text*with*only*element*separators';
    expect(detectString(input)).toBeNull();
  });

  it('detectString - should detect separators even with some invalid segments', () => {
    const input = 'single*element~another*~';
    expect(detectString(input)).toEqual({ element: '*', segment: '~' });
  });

  it('detectString - should handle empty segments', () => {
    const input = 'ProductID*4*8~~AddressID*42*108~';
    const result = detectString(input);
    expect(result).toEqual({ element: '*', segment: '~' });
  });

  // detectSeparators tests
  it('detectSeparators - should return same result as detectString', () => {
    const input = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
    expect(detectSeparators(input)).toEqual(detectString(input));
  });

  it('detectSeparators - should return null when no separators detected', () => {
    const input = 'plain text';
    expect(detectSeparators(input)).toBeNull();
  });

  // determineFormat tests
  it('determineFormat - should auto-detect JSON', () => {
    const testData = '{"ProductID": [{"ProductID1": "4"}]}';
    const result = determineFormat(testData);
    expect(result.format).toBe('json');
    expect(result.separators).toBeUndefined();
  });

  it('determineFormat - should auto-detect XML', () => {
    const testData = '<?xml version="1.0"?><root><ProductID><ProductID1>4</ProductID1></ProductID></root>';
    const result = determineFormat(testData);
    expect(result.format).toBe('xml');
    expect(result.separators).toBeUndefined();
  });

  it('determineFormat - should auto-detect string and find separators', () => {
    const testData = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
    const result = determineFormat(testData);
    expect(result.format).toBe('string');
    expect(result.separators).toEqual({ element: '*', segment: '~' });
  });

  it('determineFormat - should handle string format without separators', () => {
    const result = determineFormat('plain text');
    expect(result.format).toBe('string');
    expect(result.separators).toBeUndefined();
  });

  it('determineFormat - should handle malformed JSON', () => {
    const result = determineFormat('{"invalid": json}');
    expect(result.format).toBe('string');
  });

  it('determineFormat - should handle malformed XML', () => {
    const result = determineFormat('<invalid xml>');
    expect(result.format).toBe('string');
  });

  it('determineFormat - should detect complex JSON objects', () => {
    const complexJson = '{"segments":[{"segment_id":"ISA","elements":["00","00"]}]}';
    const result = determineFormat(complexJson);
    expect(result.format).toBe('json');
  });

  it('determineFormat - should detect XML with attributes', () => {
    const xmlWithAttrs = '<?xml version="1.0" encoding="UTF-8"?><root attr="value"><item>test</item></root>';
    const result = determineFormat(xmlWithAttrs);
    expect(result.format).toBe('xml');
  });

  it('determineFormat - should detect string with pipe and tilde separators', () => {
    const customString = 'ISA|00|00~GS|PO|SENDER~';
    const result = determineFormat(customString);
    expect(result.format).toBe('string');
    // This should return null because pipe + tilde isn't in the common separators list
    expect(result.separators).toBeUndefined();
  });

  it('determineFormat - should detect string with pipe and newline separators', () => {
    const customString = 'ISA|00|00\nGS|PO|SENDER\n';
    const result = determineFormat(customString);
    expect(result.format).toBe('string');
    expect(result.separators).toEqual({ element: '|', segment: '\n' });
  });
});
