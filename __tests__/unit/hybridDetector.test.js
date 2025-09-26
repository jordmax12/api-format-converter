const { determineFormat } = require('../../src/hybridDetector');

describe('hybridDetector', () => {
  describe('determineFormat', () => {
    const testData = {
      json: '{"ProductID": [{"ProductID1": "4"}]}',
      xml: '<?xml version="1.0"?><root><ProductID><ProductID1>4</ProductID1></ProductID></root>',
      string: 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~'
    };

    describe('auto-detection', () => {
      it('should auto-detect JSON', () => {
        const result = determineFormat(testData.json);
        expect(result.format).toBe('json');
        expect(result.separators).toBeUndefined();
      });

      it('should auto-detect XML', () => {
        const result = determineFormat(testData.xml);
        expect(result.format).toBe('xml');
        expect(result.separators).toBeUndefined();
      });

      it('should auto-detect string and find separators', () => {
        const result = determineFormat(testData.string);
        expect(result.format).toBe('string');
        expect(result.separators).toEqual({ element: '*', segment: '~' });
      });
    });

    describe('string format without detectable separators', () => {
      it('should handle string format without separators', () => {
        const result = determineFormat('plain text');
        expect(result.format).toBe('string');
        expect(result.separators).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle malformed JSON', () => {
        const result = determineFormat('{"invalid": json}');
        expect(result.format).toBe('string');
      });

      it('should handle malformed XML', () => {
        const result = determineFormat('<invalid xml>');
        expect(result.format).toBe('string');
      });

      it('should detect complex JSON objects', () => {
        const complexJson = '{"segments":[{"segment_id":"ISA","elements":["00","00"]}]}';
        const result = determineFormat(complexJson);
        expect(result.format).toBe('json');
      });

      it('should detect XML with attributes', () => {
        const xmlWithAttrs = '<?xml version="1.0" encoding="UTF-8"?><root attr="value"><item>test</item></root>';
        const result = determineFormat(xmlWithAttrs);
        expect(result.format).toBe('xml');
      });

      it('should detect string with pipe and tilde separators', () => {
        const customString = 'ISA|00|00~GS|PO|SENDER~';
        const result = determineFormat(customString);
        expect(result.format).toBe('string');
        // This should return null because pipe + tilde isn't in the common separators list
        expect(result.separators).toBeUndefined();
      });

      it('should detect string with pipe and newline separators', () => {
        const customString = 'ISA|00|00\nGS|PO|SENDER\n';
        const result = determineFormat(customString);
        expect(result.format).toBe('string');
        expect(result.separators).toEqual({ element: '|', segment: '\n' });
      });
    });
  });
});
