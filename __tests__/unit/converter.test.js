const {
  stringToJson,
  jsonToString,
  jsonToXml,
  xmlToJson,
  stringToXml,
  xmlToString
} = require('../../src/converter');

describe('converter', () => {
  const testSeparators = { element: '*', segment: '~' };
  const altSeparators = { element: '|', segment: '\n' };
  
  const testStringData = 'ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~AddressID*42*108*3*14~ContactID*59*26~';
  
  const expectedJsonData = {
    "segments": [
      {
        "segment_id": "ProductID",
        "elements": ["4", "8", "15", "16", "23"]
      },
      {
        "segment_id": "ProductID",
        "elements": ["a", "b", "c", "d", "e"]
      },
      {
        "segment_id": "AddressID",
        "elements": ["42", "108", "3", "14"]
      },
      {
        "segment_id": "ContactID",
        "elements": ["59", "26"]
      }
    ],
    "_metadata": {
      "endsWithSeparator": true
    }
  };

  // stringToJson tests
  // it('stringToJson - should convert string format to JSON', () => {
  //   const result = stringToJson(testStringData, testSeparators);
  //   expect(result).toEqual(expectedJsonData);
  // });

  // it('stringToJson - should handle different separators', () => {
  //   const stringData = 'ProductID|4|8|15\nAddressID|42|108';
  //   const result = stringToJson(stringData, altSeparators);
    
  //   expect(result).toEqual({
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8", "15"]
  //       },
  //       {
  //         "segment_id": "AddressID",
  //         "elements": ["42", "108"]
  //       }
  //     ],
  //     "_metadata": {
  //       "endsWithSeparator": false
  //     }
  //   });
  // });

  // it('stringToJson - should handle single segment', () => {
  //   const stringData = 'ProductID*4*8*15~';
  //   const result = stringToJson(stringData, testSeparators);
    
  //   expect(result).toEqual({
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8", "15"]
  //       }
  //     ],
  //     "_metadata": {
  //       "endsWithSeparator": true
  //     }
  //   });
  // });

  // it('stringToJson - should handle empty elements', () => {
  //   const stringData = 'ProductID*4**15~';
  //   const result = stringToJson(stringData, testSeparators);
    
  //   expect(result).toEqual({
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "", "15"]
  //       }
  //     ],
  //     "_metadata": {
  //       "endsWithSeparator": true
  //     }
  //   });
  // });

  // it('stringToJson - should handle empty elements strict mode off', () => {
  //   const stringData = 'ProductID*4**15~';
  //   const result = stringToJson(stringData, testSeparators, false);
    
  //   expect(result).toEqual({
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "15"]
  //       }
  //     ],
  //     "_metadata": {
  //       "endsWithSeparator": true
  //     }
  //   });
  // });

  // it('jsonToString - should handle strict mode off', () => {
  //   const jsonData = {
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "", "8", ""]
  //       }
  //     ]
  //   };
  //   const strictResult = jsonToString(jsonData, testSeparators, true);
  //   const nonStrictResult = jsonToString(jsonData, testSeparators, false);
    
  //   expect(strictResult).toBe('ProductID*4**8*');
  //   expect(nonStrictResult).toBe('ProductID*4*8');
  // });

  // it('stringToXml - should handle strict mode', () => {
  //   const stringData = 'ProductID*4**8~';
  //   const strictXml = stringToXml(stringData, testSeparators, true);
  //   const nonStrictXml = stringToXml(stringData, testSeparators, false);
    
  //   expect(strictXml).toContain('<ProductID2/>'); // Empty element preserved
  //   expect(strictXml).toContain('<ProductID3>8</ProductID3>');
    
  //   expect(nonStrictXml).toContain('<ProductID2>8</ProductID2>'); // Empty element filtered
  //   expect(nonStrictXml).not.toContain('<ProductID3>');
  // });

  // it('xmlToString - should handle strict mode', async () => {
  //   const stringData = 'ProductID*4**8~';
  //   const xml = stringToXml(stringData, testSeparators, true);
    
  //   const strictResult = await xmlToString(xml, testSeparators, true);
  //   const nonStrictResult = await xmlToString(xml, testSeparators, false);
    
  //   expect(strictResult).toBe('ProductID*4**8~');
  //   expect(nonStrictResult).toBe('ProductID*4*8~');
  // });

  // it('stringToJson - should ignore invalid segments with no elements', () => {
  //   const stringData = 'ProductID*4*8~InvalidSegment~AddressID*42~';
  //   const result = stringToJson(stringData, testSeparators);
    
  //   expect(result).toEqual({
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8"]
  //       },
  //       {
  //         "segment_id": "AddressID",
  //         "elements": ["42"]
  //       }
  //     ],
  //     "_metadata": {
  //       "endsWithSeparator": true
  //     }
  //   });
  // });

  // it('stringToJson - should handle whitespace in input', () => {
  //   const stringData = '  ProductID*4*8~  ';
  //   const result = stringToJson(stringData, testSeparators);
    
  //   expect(result).toEqual({
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8"]
  //       }
  //     ],
  //     "_metadata": {
  //       "endsWithSeparator": false
  //     }
  //   });
  // });

  // // jsonToString tests
  // it('jsonToString - should convert JSON to string format', () => {
  //   const result = jsonToString(expectedJsonData, testSeparators);
  //   expect(result).toBe('ProductID*4*8*15*16*23~ProductID*a*b*c*d*e~AddressID*42*108*3*14~ContactID*59*26~');
  // });

  // it('jsonToString - should handle different separators', () => {
  //   const jsonData = {
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8"]
  //       }
  //     ]
  //   };
  //   const result = jsonToString(jsonData, altSeparators);
  //   expect(result).toBe('ProductID|4|8');
  // });

  // it('jsonToString - should handle single segment', () => {
  //   const jsonData = {
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8"]
  //       }
  //     ]
  //   };
  //   const result = jsonToString(jsonData, testSeparators);
  //   expect(result).toBe('ProductID*4*8');
  // });

  // it('jsonToString - should handle empty values', () => {
  //   const jsonData = {
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "", "8"]
  //       }
  //     ]
  //   };
  //   const result = jsonToString(jsonData, testSeparators);
  //   expect(result).toBe('ProductID*4**8');
  // });

  // it('jsonToString - should maintain element order', () => {
  //   const jsonData = {
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8", "15"]
  //       }
  //     ]
  //   };
  //   const result = jsonToString(jsonData, testSeparators);
  //   expect(result).toBe('ProductID*4*8*15');
  // });

  // // jsonToXml tests
  // it('jsonToXml - should convert JSON to XML', () => {
  //   const result = jsonToXml(expectedJsonData);
    
  //   expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  //   expect(result).toContain('<root>');
  //   expect(result).toContain('</root>');
  //   expect(result).toContain('<ProductID>');
  //   expect(result).toContain('<ProductID1>4</ProductID1>');
  //   expect(result).toContain('<ProductID1>a</ProductID1>');
  //   expect(result).toContain('<AddressID1>42</AddressID1>');
  //   expect(result).toContain('<ContactID1>59</ContactID1>');
  // });

  // it('jsonToXml - should handle empty JSON', () => {
  //   const result = jsonToXml({ segments: [] });
  //   expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  //   expect(result).toContain('<root/>');
  // });

  // it('jsonToXml - should handle single segment', () => {
  //   const jsonData = {
  //     "segments": [
  //       {
  //         "segment_id": "ProductID",
  //         "elements": ["4", "8"]
  //       }
  //     ]
  //   };
  //   const result = jsonToXml(jsonData);
    
  //   expect(result).toContain('<ProductID1>4</ProductID1>');
  //   expect(result).toContain('<ProductID2>8</ProductID2>');
  // });

  // xmlToJson tests
  it('xmlToJson - should convert XML to JSON', async () => {
    const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ProductID>
    <ProductID1>4</ProductID1>
    <ProductID2>8</ProductID2>
  </ProductID>
  <AddressID>
    <AddressID1>42</AddressID1>
  </AddressID>
</root>`;

    const result = await xmlToJson(testXml);
    
    expect(result).toEqual({
      "segments": [
        {
          "segment_id": "ProductID",
          "elements": ["4", "8"]
        },
        {
          "segment_id": "AddressID",
          "elements": ["42"]
        }
      ]
    });
  });

//   it('xmlToJson - should handle multiple segments of same type', async () => {
//     const xmlWithMultiple = `<?xml version="1.0" encoding="UTF-8"?>
// <root>
//   <ProductID>
//     <ProductID1>4</ProductID1>
//     <ProductID2>8</ProductID2>
//   </ProductID>
//   <ProductID>
//     <ProductID1>a</ProductID1>
//     <ProductID2>b</ProductID2>
//   </ProductID>
// </root>`;
    
//     const result = await xmlToJson(xmlWithMultiple);
    
//     expect(result.segments).toHaveLength(2);
//     expect(result.segments[0]).toEqual({
//       "segment_id": "ProductID",
//       "elements": ["4", "8"]
//     });
//     expect(result.segments[1]).toEqual({
//       "segment_id": "ProductID",
//       "elements": ["a", "b"]
//     });
//   });

//   it('xmlToJson - should handle empty XML root', async () => {
//     const emptyXml = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
//     const result = await xmlToJson(emptyXml);
//     expect(result).toEqual({ segments: [] });
//   });

//   it('xmlToJson - should throw error for invalid XML', async () => {
//     const invalidXml = '<root><unclosed>';
//     await expect(xmlToJson(invalidXml)).rejects.toThrow('XML parsing failed');
//   });

//   it('xmlToJson - should handle XML without declaration', async () => {
//     const xmlWithoutDecl = '<root><ProductID><ProductID1>4</ProductID1></ProductID></root>';
//     const result = await xmlToJson(xmlWithoutDecl);
    
//     expect(result).toEqual({
//       "segments": [
//         {
//           "segment_id": "ProductID",
//           "elements": ["4"]
//         }
//       ]
//     });
//   });

//   // stringToXml tests
//   it('stringToXml - should convert string directly to XML', () => {
//     const result = stringToXml(testStringData, testSeparators);
    
//     expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
//     expect(result).toContain('<root>');
//     expect(result).toContain('<ProductID1>4</ProductID1>');
//     expect(result).toContain('<ProductID1>a</ProductID1>');
//     expect(result).toContain('<AddressID1>42</AddressID1>');
//   });

//   it('stringToXml - should handle different separators', () => {
//     const stringData = 'ProductID|4|8';
//     const result = stringToXml(stringData, altSeparators);
    
//     expect(result).toContain('<ProductID1>4</ProductID1>');
//     expect(result).toContain('<ProductID2>8</ProductID2>');
//   });

//   // xmlToString tests
//   it('xmlToString - should convert XML directly to string', async () => {
//     const testXml = `<?xml version="1.0" encoding="UTF-8"?>
// <root>
//   <ProductID>
//     <ProductID1>4</ProductID1>
//     <ProductID2>8</ProductID2>
//     <ProductID3>15</ProductID3>
//   </ProductID>
//   <AddressID>
//     <AddressID1>42</AddressID1>
//     <AddressID2>108</AddressID2>
//   </AddressID>
// </root>`;

//     const result = await xmlToString(testXml, testSeparators);
//     expect(result).toBe('ProductID*4*8*15~AddressID*42*108');
//   });

//   it('xmlToString - should handle different separators', async () => {
//     const testXml = `<?xml version="1.0" encoding="UTF-8"?>
// <root>
//   <ProductID>
//     <ProductID1>4</ProductID1>
//     <ProductID2>8</ProductID2>
//     <ProductID3>15</ProductID3>
//   </ProductID>
//   <AddressID>
//     <AddressID1>42</AddressID1>
//     <AddressID2>108</AddressID2>
//   </AddressID>
// </root>`;

//     const result = await xmlToString(testXml, altSeparators);
//     expect(result).toBe('ProductID|4|8|15\nAddressID|42|108');
//   });

//   it('xmlToString - should handle multiple segments of same type', async () => {
//     const xmlWithMultiple = `<?xml version="1.0" encoding="UTF-8"?>
// <root>
//   <ProductID>
//     <ProductID1>4</ProductID1>
//     <ProductID2>8</ProductID2>
//   </ProductID>
//   <ProductID>
//     <ProductID1>a</ProductID1>
//     <ProductID2>b</ProductID2>
//   </ProductID>
// </root>`;
    
//     const result = await xmlToString(xmlWithMultiple, testSeparators);
//     expect(result).toBe('ProductID*4*8~ProductID*a*b');
//   });

//   // round-trip conversion tests
//   it('round-trip - should maintain data integrity: String → JSON → String', () => {
//     const json = stringToJson(testStringData, testSeparators);
//     const backToString = jsonToString(json, testSeparators);
    
//     // With enhanced converter, we should get exact match including trailing separator
//     expect(backToString).toBe(testStringData);
//   });

//   it('round-trip - should maintain data integrity: JSON → XML → JSON', async () => {
//     const xml = jsonToXml(expectedJsonData);
//     const backToJson = await xmlToJson(xml);
    
//     // XML conversion now preserves metadata, so compare with original structure
//     const expectedJsonWithMetadata = {
//       "_metadata": {
//         "endsWithSeparator": "true"  // XML converts boolean to string
//       },
//       "segments": [
//         {
//           "segment_id": "ProductID",
//           "elements": ["4", "8", "15", "16", "23"]
//         },
//         {
//           "segment_id": "ProductID",
//           "elements": ["a", "b", "c", "d", "e"]
//         },
//         {
//           "segment_id": "AddressID",
//           "elements": ["42", "108", "3", "14"]
//         },
//         {
//           "segment_id": "ContactID",
//           "elements": ["59", "26"]
//         }
//       ]
//     };
    
//     expect(backToJson).toEqual(expectedJsonWithMetadata);
//   });

//   it('round-trip - should maintain data integrity: String → XML → String', async () => {
//     const xml = stringToXml(testStringData, testSeparators);
//     const backToString = await xmlToString(xml, testSeparators);
    
//     // Enhanced XML converter now preserves trailing separator perfectly
//     expect(backToString).toBe(testStringData);
//   });
});