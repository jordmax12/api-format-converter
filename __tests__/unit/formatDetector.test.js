const {
  detectFormat,
  detectSeparators,
  detectJSON,
  detectXML,
  detectString
} = require('../../src/formatDetector');

describe('formatDetector', () => {
  describe('detectFormat', () => {
    it('should detect JSON format', () => {
      const jsonData = '{"test": "value"}';
      expect(detectFormat(jsonData)).toBe('json');
    });

    it('should detect XML format with declaration', () => {
      const xmlData = '<?xml version="1.0"?><root><test>value</test></root>';
      expect(detectFormat(xmlData)).toBe('xml');
    });

    it('should detect XML format with root element', () => {
      const xmlData = '<root><test>value</test></root>';
      expect(detectFormat(xmlData)).toBe('xml');
    });

    it('should detect string format', () => {
      const stringData = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
      expect(detectFormat(stringData)).toBe('string');
    });

    it('should default to string format for unrecognized data', () => {
      const plainText = 'This is just plain text';
      expect(detectFormat(plainText)).toBe('string');
    });

    it('should throw error for empty input', () => {
      expect(() => detectFormat('')).toThrow('Input must be a non-empty string');
    });

    it('should throw error for null input', () => {
      expect(() => detectFormat(null)).toThrow('Input must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => detectFormat(123)).toThrow('Input must be a non-empty string');
    });

    it('should throw error for whitespace-only input', () => {
      expect(() => detectFormat('   ')).toThrow('Input must be a non-empty string');
    });

    it('should throw error for tab and newline only input', () => {
      expect(() => detectFormat('\t\n  \r\n')).toThrow('Input must be a non-empty string');
    });
  });

  describe('detectJSON', () => {
    it('should return true for valid JSON object', () => {
      expect(detectJSON('{"key": "value"}')).toBe(true);
    });

    it('should return true for valid JSON array', () => {
      expect(detectJSON('[1, 2, 3]')).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(detectJSON('{}')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(detectJSON('[]')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(detectJSON('{ invalid json }')).toBe(false);
    });

    it('should return false for string not starting with { or [', () => {
      expect(detectJSON('not json')).toBe(false);
    });

    it('should return false for null value', () => {
      expect(detectJSON('null')).toBe(false);
    });

    it('should return false for number', () => {
      expect(detectJSON('123')).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(detectJSON('true')).toBe(false);
    });
  });

  describe('detectXML', () => {
    it('should return true for XML with declaration', () => {
      expect(detectXML('<?xml version="1.0"?><root></root>')).toBe(true);
    });

    it('should return true for XML with root element', () => {
      expect(detectXML('<root><child>value</child></root>')).toBe(true);
    });

    it('should return true for simple XML tags', () => {
      expect(detectXML('<test>content</test>')).toBe(true);
    });

    it('should return false for self-closing tags (not matching our pattern)', () => {
      expect(detectXML('<test/>')).toBe(false);
    });

    it('should return false for malformed XML', () => {
      expect(detectXML('<root>unclosed')).toBe(false);
    });

    it('should return false for non-XML content', () => {
      expect(detectXML('not xml content')).toBe(false);
    });

    it('should return false for partial XML', () => {
      expect(detectXML('<root')).toBe(false);
    });
  });

  describe('detectString', () => {
    it('should detect * and ~ separators', () => {
      const input = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
      const result = detectString(input);
      expect(result).toEqual({ element: '*', segment: '~' });
    });

    it('should detect | and newline separators', () => {
      const input = 'ProductID|4|8|15\nAddressID|42|108';
      const result = detectString(input);
      expect(result).toEqual({ element: '|', segment: '\n' });
    });

    it('should detect comma and newline separators', () => {
      const input = 'ProductID,4,8,15\nAddressID,42,108';
      const result = detectString(input);
      expect(result).toEqual({ element: ',', segment: '\n' });
    });

    it('should detect tab and newline separators', () => {
      const input = 'ProductID\t4\t8\t15\nAddressID\t42\t108';
      const result = detectString(input);
      expect(result).toEqual({ element: '\t', segment: '\n' });
    });

    it('should return null for no valid separators', () => {
      const input = 'just plain text with no separators';
      expect(detectString(input)).toBeNull();
    });

    it('should return null for single separator only', () => {
      const input = 'text*with*only*element*separators';
      expect(detectString(input)).toBeNull();
    });

    it('should detect separators even with some invalid segments', () => {
      const input = 'single*element~another*~';
      expect(detectString(input)).toEqual({ element: '*', segment: '~' });
    });

    it('should handle empty segments', () => {
      const input = 'ProductID*4*8~~AddressID*42*108~';
      const result = detectString(input);
      expect(result).toEqual({ element: '*', segment: '~' });
    });
  });

  describe('detectSeparators', () => {
    it('should return same result as detectString', () => {
      const input = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~';
      expect(detectSeparators(input)).toEqual(detectString(input));
    });

    it('should return null when no separators detected', () => {
      const input = 'plain text';
      expect(detectSeparators(input)).toBeNull();
    });
  });
});
