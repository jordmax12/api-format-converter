const fs = require('fs');
const {
  stringToJson,
  jsonToString,
  stringToXml,
  xmlToString,
  jsonToXml,
  xmlToJson
} = require('./src/converter');
const { detectSeparators } = require('./src/formatDetector');

async function generateComprehensiveRoundtripTest() {
  console.log('🔄 Generating Comprehensive Round-trip Test Files');
  console.log('============================================================');
  console.log('📋 Clear naming for easy diffchecker.com verification');
  
  // Read the original test file
  const originalData = fs.readFileSync('./data/test-file.txt', 'utf8').trim();
  console.log(`📄 Original EDI data: ${originalData.length} characters, ${originalData.split('~').filter(s => s.trim()).length} segments`);
  
  // Detect separators
  const separators = detectSeparators(originalData);
  console.log(`🔍 Using separators: element='${separators.element}', segment='${separators.segment}'`);
  
  console.log('\n============================================================');
  console.log('🔧 GENERATING STRICT MODE ROUND-TRIP FILES');
  console.log('============================================================');
  
  // === STRICT MODE CONVERSIONS ===
  console.log('\n📝 Strict Mode: String → JSON → String');
  console.log('----------------------------------------');
  
  const strictJson = stringToJson(originalData, separators, true);
  const strictJsonToString = jsonToString(strictJson, separators, true);
  
  fs.writeFileSync('./data/01-original.txt', originalData);
  fs.writeFileSync('./data/02-strict-string-to-json.json', JSON.stringify(strictJson, null, 2));
  fs.writeFileSync('./data/03-strict-json-to-string.txt', strictJsonToString);
  
  console.log('✅ Files generated:');
  console.log('   📄 01-original.txt                - Original EDI data');
  console.log('   📄 02-strict-string-to-json.json  - String converted to JSON (strict)');
  console.log('   📄 03-strict-json-to-string.txt   - JSON converted back to string (strict)');
  console.log(`   🎯 Round-trip match: ${originalData === strictJsonToString ? '✅ PERFECT' : '❌ FAILED'}`);
  
  console.log('\n📝 Strict Mode: String → XML → String');
  console.log('----------------------------------------');
  
  const strictXml = stringToXml(originalData, separators, true);
  const strictXmlToString = await xmlToString(strictXml, separators, true);
  
  fs.writeFileSync('./data/04-strict-string-to-xml.xml', strictXml);
  fs.writeFileSync('./data/05-strict-xml-to-string.txt', strictXmlToString);
  
  console.log('✅ Files generated:');
  console.log('   📄 04-strict-string-to-xml.xml    - String converted to XML (strict)');
  console.log('   📄 05-strict-xml-to-string.txt    - XML converted back to string (strict)');
  console.log(`   🎯 Round-trip match: ${originalData === strictXmlToString ? '✅ PERFECT' : '❌ FAILED'}`);
  
  console.log('\n📝 Strict Mode: JSON → XML → JSON');
  console.log('----------------------------------------');
  
  const strictJsonToXml = jsonToXml(strictJson);
  const strictXmlToJson = await xmlToJson(strictJsonToXml);
  
  fs.writeFileSync('./data/06-strict-json-to-xml.xml', strictJsonToXml);
  fs.writeFileSync('./data/07-strict-xml-to-json.json', JSON.stringify(strictXmlToJson, null, 2));
  
  console.log('✅ Files generated:');
  console.log('   📄 06-strict-json-to-xml.xml      - JSON converted to XML (strict)');
  console.log('   📄 07-strict-xml-to-json.json     - XML converted back to JSON (strict)');
  
  // Compare JSON structures (ignoring metadata string vs boolean differences)
  const jsonMatch = JSON.stringify(strictJson.segments) === JSON.stringify(strictXmlToJson.segments);
  console.log(`   🎯 JSON structure match: ${jsonMatch ? '✅ PERFECT' : '❌ FAILED'}`);
  
  console.log('\n============================================================');
  console.log('🧹 GENERATING NON-STRICT MODE ROUND-TRIP FILES');
  console.log('============================================================');
  
  // === NON-STRICT MODE CONVERSIONS ===
  console.log('\n📝 Non-Strict Mode: String → JSON → String');
  console.log('----------------------------------------');
  
  const nonStrictJson = stringToJson(originalData, separators, false);
  const nonStrictJsonToString = jsonToString(nonStrictJson, separators, false);
  
  fs.writeFileSync('./data/08-nonstrict-string-to-json.json', JSON.stringify(nonStrictJson, null, 2));
  fs.writeFileSync('./data/09-nonstrict-json-to-string.txt', nonStrictJsonToString);
  
  console.log('✅ Files generated:');
  console.log('   📄 08-nonstrict-string-to-json.json - String converted to JSON (non-strict)');
  console.log('   📄 09-nonstrict-json-to-string.txt  - JSON converted back to string (non-strict)');
  console.log(`   🎯 Consistent filtering: ${nonStrictJsonToString.length < originalData.length ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n📝 Non-Strict Mode: String → XML → String');
  console.log('----------------------------------------');
  
  const nonStrictXml = stringToXml(originalData, separators, false);
  const nonStrictXmlToString = await xmlToString(nonStrictXml, separators, false);
  
  fs.writeFileSync('./data/10-nonstrict-string-to-xml.xml', nonStrictXml);
  fs.writeFileSync('./data/11-nonstrict-xml-to-string.txt', nonStrictXmlToString);
  
  console.log('✅ Files generated:');
  console.log('   📄 10-nonstrict-string-to-xml.xml   - String converted to XML (non-strict)');
  console.log('   📄 11-nonstrict-xml-to-string.txt   - XML converted back to string (non-strict)');
  console.log(`   🎯 Matches non-strict JSON→String: ${nonStrictJsonToString === nonStrictXmlToString ? '✅ PERFECT' : '❌ FAILED'}`);
  
  console.log('\n📝 Non-Strict Mode: JSON → XML → JSON');
  console.log('----------------------------------------');
  
  const nonStrictJsonToXml = jsonToXml(nonStrictJson);
  const nonStrictXmlToJson = await xmlToJson(nonStrictJsonToXml);
  
  fs.writeFileSync('./data/12-nonstrict-json-to-xml.xml', nonStrictJsonToXml);
  fs.writeFileSync('./data/13-nonstrict-xml-to-json.json', JSON.stringify(nonStrictXmlToJson, null, 2));
  
  console.log('✅ Files generated:');
  console.log('   📄 12-nonstrict-json-to-xml.xml     - JSON converted to XML (non-strict)');
  console.log('   📄 13-nonstrict-xml-to-json.json    - XML converted back to JSON (non-strict)');
  
  const nonStrictJsonMatch = JSON.stringify(nonStrictJson.segments) === JSON.stringify(nonStrictXmlToJson.segments);
  console.log(`   🎯 JSON structure match: ${nonStrictJsonMatch ? '✅ PERFECT' : '❌ FAILED'}`);
  
  console.log('\n============================================================');
  console.log('📊 GENERATING COMPARISON SUMMARY');
  console.log('============================================================');
  
  // Count empty elements for analysis
  let totalEmptyElements = 0;
  let segmentsWithEmpty = 0;
  
  strictJson.segments.forEach(segment => {
    const emptyCount = segment.elements.filter(el => el === '').length;
    if (emptyCount > 0) {
      segmentsWithEmpty++;
      totalEmptyElements += emptyCount;
    }
  });
  
  const summary = {
    original: {
      file: "01-original.txt",
      length: originalData.length,
      segments: strictJson.segments.length
    },
    strict_mode: {
      string_to_json_to_string: {
        json_file: "02-strict-string-to-json.json",
        result_file: "03-strict-json-to-string.txt",
        perfect_roundtrip: originalData === strictJsonToString,
        length: strictJsonToString.length
      },
      string_to_xml_to_string: {
        xml_file: "04-strict-string-to-xml.xml",
        result_file: "05-strict-xml-to-string.txt",
        perfect_roundtrip: originalData === strictXmlToString,
        length: strictXmlToString.length
      },
      json_to_xml_to_json: {
        xml_file: "06-strict-json-to-xml.xml",
        result_file: "07-strict-xml-to-json.json",
        structure_match: jsonMatch
      }
    },
    non_strict_mode: {
      string_to_json_to_string: {
        json_file: "08-nonstrict-string-to-json.json",
        result_file: "09-nonstrict-json-to-string.txt",
        length: nonStrictJsonToString.length,
        chars_saved: originalData.length - nonStrictJsonToString.length
      },
      string_to_xml_to_string: {
        xml_file: "10-nonstrict-string-to-xml.xml",
        result_file: "11-nonstrict-xml-to-string.txt",
        matches_json_result: nonStrictJsonToString === nonStrictXmlToString,
        length: nonStrictXmlToString.length
      },
      json_to_xml_to_json: {
        xml_file: "12-nonstrict-json-to-xml.xml",
        result_file: "13-nonstrict-xml-to-json.json",
        structure_match: nonStrictJsonMatch
      }
    },
    statistics: {
      total_empty_elements: totalEmptyElements,
      segments_with_empty_elements: segmentsWithEmpty,
      empty_elements_percentage: Math.round((totalEmptyElements / (strictJson.segments.reduce((sum, seg) => sum + seg.elements.length, 0))) * 100)
    }
  };
  
  fs.writeFileSync('./data/14-roundtrip-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('✅ Summary file generated:');
  console.log('   📄 14-roundtrip-summary.json       - Complete test summary and statistics');
  
  console.log('\n============================================================');
  console.log('🎯 DIFFCHECKER.COM VERIFICATION GUIDE');
  console.log('============================================================');
  
  console.log('\n🔍 Strict Mode Round-trip Verification:');
  console.log('   Compare: 01-original.txt ↔ 03-strict-json-to-string.txt   (should be IDENTICAL)');
  console.log('   Compare: 01-original.txt ↔ 05-strict-xml-to-string.txt    (should be IDENTICAL)');
  console.log('   Compare: 02-strict-string-to-json.json ↔ 07-strict-xml-to-json.json (segments should match)');
  
  console.log('\n🧹 Non-Strict Mode Consistency Verification:');
  console.log('   Compare: 09-nonstrict-json-to-string.txt ↔ 11-nonstrict-xml-to-string.txt (should be IDENTICAL)');
  console.log('   Compare: 08-nonstrict-string-to-json.json ↔ 13-nonstrict-xml-to-json.json (segments should match)');
  
  console.log('\n📊 Size Comparison:');
  console.log('   Compare: 01-original.txt ↔ 09-nonstrict-json-to-string.txt (non-strict should be smaller)');
  console.log(`   Original: ${originalData.length} chars → Non-strict: ${nonStrictJsonToString.length} chars (${originalData.length - nonStrictJsonToString.length} chars saved)`);
  
  console.log('\n✅ All round-trip test files generated successfully!');
  console.log(`   📁 Total files created: 14`);
  console.log(`   🎯 Empty elements found: ${totalEmptyElements} in ${segmentsWithEmpty}/${strictJson.segments.length} segments`);
}

// Run the comprehensive test
generateComprehensiveRoundtripTest().catch(console.error);
