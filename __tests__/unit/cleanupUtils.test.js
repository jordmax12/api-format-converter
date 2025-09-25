const {
  cleanJsonForApi,
  cleanXmlForApi,
  cleanForApi
} = require('../../src/cleanupUtils');

describe('cleanupUtils', () => {
  // Test data with internal fields
  const jsonWithMetadata = {
    "segments": [
      {
        "segment_id": "ProductID",
        "elements": ["4", "8", "15"],
        "_order": 0
      },
      {
        "segment_id": "AddressID", 
        "elements": ["42", "108"],
        "_order": 1,
        "_originalOrder": 1
      }
    ],
    "_metadata": {
      "endsWithSeparator": true
    }
  };

  const xmlWithMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <_metadata>
    <endsWithSeparator>true</endsWithSeparator>
  </_metadata>
  <ProductID>
    <_order>0</_order>
    <ProductID1>4</ProductID1>
    <ProductID2>8</ProductID2>
    <ProductID3>15</ProductID3>
  </ProductID>
  <AddressID>
    <_order>1</_order>
    <AddressID1>42</AddressID1>
    <AddressID2>108</AddressID2>
  </AddressID>
</root>`;

  it('cleanJsonForApi - should remove _metadata from JSON', () => {
    const result = cleanJsonForApi(jsonWithMetadata);
    
    expect(result._metadata).toBeUndefined();
    expect(result.segments).toBeDefined();
    expect(result.segments.length).toBe(2);
  });

  it('cleanJsonForApi - should remove _order fields from segments', () => {
    const result = cleanJsonForApi(jsonWithMetadata);
    
    result.segments.forEach(segment => {
      expect(segment._order).toBeUndefined();
      expect(segment._originalOrder).toBeUndefined();
      expect(segment.segment_id).toBeDefined();
      expect(segment.elements).toBeDefined();
    });
  });

  it('cleanJsonForApi - should preserve segment data', () => {
    const result = cleanJsonForApi(jsonWithMetadata);
    
    expect(result.segments[0]).toEqual({
      "segment_id": "ProductID",
      "elements": ["4", "8", "15"]
    });
    
    expect(result.segments[1]).toEqual({
      "segment_id": "AddressID",
      "elements": ["42", "108"]
    });
  });

  it('cleanJsonForApi - should not mutate original data', () => {
    const original = JSON.parse(JSON.stringify(jsonWithMetadata));
    cleanJsonForApi(jsonWithMetadata);
    
    expect(jsonWithMetadata).toEqual(original);
    expect(jsonWithMetadata._metadata).toBeDefined();
    expect(jsonWithMetadata.segments[0]._order).toBeDefined();
  });

  it('cleanJsonForApi - should handle JSON without metadata', () => {
    const cleanJson = {
      "segments": [
        {
          "segment_id": "ProductID",
          "elements": ["4", "8"]
        }
      ]
    };
    
    const result = cleanJsonForApi(cleanJson);
    expect(result).toEqual(cleanJson);
  });

  it('cleanJsonForApi - should handle empty JSON', () => {
    expect(cleanJsonForApi({})).toEqual({});
    expect(cleanJsonForApi({ segments: [] })).toEqual({ segments: [] });
  });

  it('cleanJsonForApi - should handle null/undefined input', () => {
    expect(cleanJsonForApi(null)).toBe(null);
    expect(cleanJsonForApi(undefined)).toBe(undefined);
    expect(cleanJsonForApi("string")).toBe("string");
  });

  it('cleanXmlForApi - should remove _metadata from XML', async () => {
    const result = await cleanXmlForApi(xmlWithMetadata);
    
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<root>');
    expect(result).not.toContain('<_metadata>');
    expect(result).not.toContain('<endsWithSeparator>');
  });

  it('cleanXmlForApi - should remove _order fields from XML segments', async () => {
    const result = await cleanXmlForApi(xmlWithMetadata);
    
    expect(result).not.toContain('<_order>');
    expect(result).toContain('<ProductID1>4</ProductID1>');
    expect(result).toContain('<AddressID1>42</AddressID1>');
  });

  it('cleanXmlForApi - should preserve segment data in XML', async () => {
    const result = await cleanXmlForApi(xmlWithMetadata);
    
    expect(result).toContain('<ProductID>');
    expect(result).toContain('<ProductID1>4</ProductID1>');
    expect(result).toContain('<ProductID2>8</ProductID2>');
    expect(result).toContain('<ProductID3>15</ProductID3>');
    expect(result).toContain('<AddressID>');
    expect(result).toContain('<AddressID1>42</AddressID1>');
    expect(result).toContain('<AddressID2>108</AddressID2>');
  });

  it('cleanXmlForApi - should handle XML without metadata', async () => {
    const cleanXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ProductID>
    <ProductID1>4</ProductID1>
    <ProductID2>8</ProductID2>
  </ProductID>
</root>`;
    
    const result = await cleanXmlForApi(cleanXml);
    expect(result).toContain('<ProductID1>4</ProductID1>');
    expect(result).toContain('<ProductID2>8</ProductID2>');
  });

  it('cleanXmlForApi - should handle multiple segments of same type', async () => {
    const xmlWithMultiple = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ProductID>
    <_order>0</_order>
    <ProductID1>4</ProductID1>
  </ProductID>
  <ProductID>
    <_order>1</_order>
    <ProductID1>8</ProductID1>
  </ProductID>
</root>`;
    
    const result = await cleanXmlForApi(xmlWithMultiple);
    expect(result).not.toContain('<_order>');
    expect(result).toContain('<ProductID1>4</ProductID1>');
    expect(result).toContain('<ProductID1>8</ProductID1>');
  });

  it('cleanXmlForApi - should handle empty XML', async () => {
    const emptyXml = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
    const result = await cleanXmlForApi(emptyXml);
    expect(result).toContain('<root');
  });

  it('cleanXmlForApi - should handle invalid XML gracefully', async () => {
    const invalidXml = '<root><unclosed>';
    const result = await cleanXmlForApi(invalidXml);
    expect(result).toBe(invalidXml); // Should return original on error
  });

  it('cleanXmlForApi - should handle null/undefined input', async () => {
    expect(await cleanXmlForApi(null)).toBe(null);
    expect(await cleanXmlForApi(undefined)).toBe(undefined);
    expect(await cleanXmlForApi("")).toBe("");
  });

  it('cleanForApi - should clean JSON objects when dataType is json', async () => {
    const result = await cleanForApi(jsonWithMetadata, 'json');
    
    expect(result._metadata).toBeUndefined();
    expect(result.segments[0]._order).toBeUndefined();
    expect(result.segments[0].segment_id).toBe("ProductID");
  });

  it('cleanForApi - should clean XML strings when dataType is xml', async () => {
    const result = await cleanForApi(xmlWithMetadata, 'xml');
    
    expect(typeof result).toBe('string');
    expect(result).not.toContain('<_metadata>');
    expect(result).not.toContain('<_order>');
    expect(result).toContain('<ProductID1>4</ProductID1>');
  });

  it('cleanForApi - should pass through string format unchanged when dataType is string', async () => {
    const stringData = 'ProductID*4*8*15~AddressID*42*108~';
    const result = await cleanForApi(stringData, 'string');
    
    expect(result).toBe(stringData);
  });

  it('cleanForApi - should handle case-insensitive dataType', async () => {
    const result1 = await cleanForApi(jsonWithMetadata, 'JSON');
    const result2 = await cleanForApi(xmlWithMetadata, 'XML');
    const result3 = await cleanForApi('test', 'STRING');
    
    expect(result1._metadata).toBeUndefined();
    expect(result2).not.toContain('<_metadata>');
    expect(result3).toBe('test');
  });

  it('cleanForApi - should default to string behavior for unknown dataType', async () => {
    const testData = 'some data';
    const result = await cleanForApi(testData, 'unknown');
    
    expect(result).toBe(testData);
  });

  it('cleanForApi - should handle null/undefined data', async () => {
    expect(await cleanForApi(null, 'json')).toBe(null);
    expect(await cleanForApi(undefined, 'xml')).toBe(undefined);
    expect(await cleanForApi('', 'string')).toBe('');
  });
});
