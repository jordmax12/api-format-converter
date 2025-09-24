const { determineFormat, detectFromContentType } = require('../../src/hybridDetector');

describe('hybridDetector', () => {
  describe('determineFormat', () => {
    const testData = {
      json: '{"ProductID": [{"ProductID1": "4"}]}',
      xml: '<?xml version="1.0"?><root><ProductID><ProductID1>4</ProductID1></ProductID></root>',
      string: 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~'
    };

    describe('with Content-Type header', () => {
      it('should use Content-Type for JSON', () => {
        const result = determineFormat(testData.json, 'application/json');
        expect(result.format).toBe('json');
        expect(result.separators).toBeUndefined();
      });

      it('should use Content-Type for XML', () => {
        const result = determineFormat(testData.xml, 'application/xml');
        expect(result.format).toBe('xml');
        expect(result.separators).toBeUndefined();
      });

      it('should use Content-Type for string and detect separators', () => {
        const result = determineFormat(testData.string, 'text/plain');
        expect(result.format).toBe('string');
        expect(result.separators).toEqual({ element: '*', segment: '~' });
      });

      it('should override auto-detection with Content-Type', () => {
        const result = determineFormat(testData.json, 'text/plain');
        expect(result.format).toBe('string');
      });

      it('should handle text/json Content-Type', () => {
        const result = determineFormat(testData.json, 'text/json');
        expect(result.format).toBe('json');
      });

      it('should handle text/xml Content-Type', () => {
        const result = determineFormat(testData.xml, 'text/xml');
        expect(result.format).toBe('xml');
      });

      it('should handle application/x-xml Content-Type', () => {
        const result = determineFormat(testData.xml, 'application/x-xml');
        expect(result.format).toBe('xml');
      });

      it('should handle generic text/ Content-Type', () => {
        const result = determineFormat(testData.string, 'text/custom');
        expect(result.format).toBe('string');
      });

      it('should handle application/octet-stream Content-Type', () => {
        const result = determineFormat(testData.string, 'application/octet-stream');
        expect(result.format).toBe('string');
      });
    });

    describe('without Content-Type header', () => {
      it('should auto-detect JSON', () => {
        const result = determineFormat(testData.json);
        expect(result.format).toBe('json');
      });

      it('should auto-detect XML', () => {
        const result = determineFormat(testData.xml);
        expect(result.format).toBe('xml');
      });

      it('should auto-detect string and find separators', () => {
        const result = determineFormat(testData.string);
        expect(result.format).toBe('string');
        expect(result.separators).toEqual({ element: '*', segment: '~' });
      });

      it('should handle empty Content-Type', () => {
        const result = determineFormat(testData.json, '');
        expect(result.format).toBe('json');
      });
    });

    describe('with unrecognized Content-Type', () => {
      it('should fallback to auto-detection', () => {
        const result = determineFormat(testData.json, 'application/unknown');
        expect(result.format).toBe('json');
      });
    });

    describe('string format without detectable separators', () => {
      it('should handle string format without separators', () => {
        const result = determineFormat('plain text', 'text/plain');
        expect(result.format).toBe('string');
        expect(result.separators).toBeUndefined();
      });
    });
  });

  describe('detectFromContentType', () => {
    describe('JSON Content-Types', () => {
      it('should detect application/json', () => {
        expect(detectFromContentType('application/json')).toBe('json');
      });

      it('should detect text/json', () => {
        expect(detectFromContentType('text/json')).toBe('json');
      });

      it('should handle case insensitive', () => {
        expect(detectFromContentType('APPLICATION/JSON')).toBe('json');
      });

      it('should handle with charset', () => {
        expect(detectFromContentType('application/json; charset=utf-8')).toBe('json');
      });
    });

    describe('XML Content-Types', () => {
      it('should detect application/xml', () => {
        expect(detectFromContentType('application/xml')).toBe('xml');
      });

      it('should detect text/xml', () => {
        expect(detectFromContentType('text/xml')).toBe('xml');
      });

      it('should detect application/x-xml', () => {
        expect(detectFromContentType('application/x-xml')).toBe('xml');
      });

      it('should handle case insensitive', () => {
        expect(detectFromContentType('TEXT/XML')).toBe('xml');
      });
    });

    describe('String/Text Content-Types', () => {
      it('should detect text/plain', () => {
        expect(detectFromContentType('text/plain')).toBe('string');
      });

      it('should detect generic text/', () => {
        expect(detectFromContentType('text/custom')).toBe('string');
      });

      it('should detect application/octet-stream', () => {
        expect(detectFromContentType('application/octet-stream')).toBe('string');
      });
    });

    describe('Unrecognized Content-Types', () => {
      it('should return null for unknown type', () => {
        expect(detectFromContentType('application/unknown')).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(detectFromContentType('')).toBeNull();
      });

      it('should return null for image type', () => {
        expect(detectFromContentType('image/png')).toBeNull();
      });
    });

    describe('Edge cases', () => {
      it('should handle whitespace', () => {
        expect(detectFromContentType('  application/json  ')).toBe('json');
      });

      it('should handle malformed content type', () => {
        expect(detectFromContentType('application')).toBeNull();
      });
    });
  });
});
