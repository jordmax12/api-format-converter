const fs = require('fs');
const { cleanForApi } = require('./src/cleanupUtils');

async function generateCleanedExamples() {
  console.log('🧹 Generating Cleaned API Response Examples');
  console.log('============================================================');
  console.log('📋 Adding cleaned examples to numbered data structure');
  
  // Read the existing files with metadata
  console.log('\n📄 Reading source files with metadata:');
  const strictJson = JSON.parse(fs.readFileSync('./data/02-strict-string-to-json.json', 'utf8'));
  const strictXml = fs.readFileSync('./data/04-strict-string-to-xml.xml', 'utf8');
  
  console.log(`   📄 02-strict-string-to-json.json - ${JSON.stringify(strictJson).length} chars (with metadata)`);
  console.log(`   📄 04-strict-string-to-xml.xml   - ${strictXml.length} chars (with metadata)`);
  
  console.log('\n🧹 Generating cleaned versions:');
  console.log('----------------------------------------');
  
  // Clean the JSON for API response
  const cleanedJson = await cleanForApi(strictJson, 'json');
  fs.writeFileSync('./data/15-cleaned-json-for-api.json', JSON.stringify(cleanedJson, null, 2));
  
  console.log(`✅ 15-cleaned-json-for-api.json`);
  console.log(`   📊 Size: ${JSON.stringify(cleanedJson).length} chars (${JSON.stringify(strictJson).length - JSON.stringify(cleanedJson).length} chars saved)`);
  console.log(`   🔧 _metadata removed: ${!cleanedJson._metadata}`);
  console.log(`   🔧 _order fields removed: ${!cleanedJson.segments[0]._order}`);
  console.log(`   ✅ Segments preserved: ${cleanedJson.segments.length}`);
  
  // Clean the XML for API response
  const cleanedXml = await cleanForApi(strictXml, 'xml');
  fs.writeFileSync('./data/16-cleaned-xml-for-api.xml', cleanedXml);
  
  console.log(`\n✅ 16-cleaned-xml-for-api.xml`);
  console.log(`   📊 Size: ${cleanedXml.length} chars (${strictXml.length - cleanedXml.length} chars saved)`);
  console.log(`   🔧 <_metadata> removed: ${!cleanedXml.includes('<_metadata>')}`);
  console.log(`   🔧 <_order> removed: ${!cleanedXml.includes('<_order>')}`);
  console.log(`   ✅ Segment data preserved: ${cleanedXml.includes('<ProductID1>')}`);
  
  console.log('\n============================================================');
  console.log('📊 CLEANED EXAMPLES SUMMARY');
  console.log('============================================================');
  
  // Generate comparison summary
  const summary = {
    description: "Cleaned API response examples - internal metadata and order fields removed",
    source_files: {
      json_with_metadata: "02-strict-string-to-json.json",
      xml_with_metadata: "04-strict-string-to-xml.xml"
    },
    cleaned_files: {
      json_for_api: "15-cleaned-json-for-api.json",
      xml_for_api: "16-cleaned-xml-for-api.xml"
    },
    size_comparison: {
      json: {
        original_size: JSON.stringify(strictJson).length,
        cleaned_size: JSON.stringify(cleanedJson).length,
        bytes_saved: JSON.stringify(strictJson).length - JSON.stringify(cleanedJson).length,
        percentage_reduction: Math.round(((JSON.stringify(strictJson).length - JSON.stringify(cleanedJson).length) / JSON.stringify(strictJson).length) * 100)
      },
      xml: {
        original_size: strictXml.length,
        cleaned_size: cleanedXml.length,
        bytes_saved: strictXml.length - cleanedXml.length,
        percentage_reduction: Math.round(((strictXml.length - cleanedXml.length) / strictXml.length) * 100)
      }
    },
    fields_removed: {
      json: ["_metadata", "_order", "_originalOrder"],
      xml: ["<_metadata>", "<_order>"]
    },
    use_case: "Perfect for API responses - removes internal conversion fields while preserving all business data"
  };
  
  fs.writeFileSync('./data/17-cleaned-examples-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📁 Generated Files:');
  console.log('   📄 15-cleaned-json-for-api.json    - Clean JSON without internal fields');
  console.log('   📄 16-cleaned-xml-for-api.xml      - Clean XML without internal elements');
  console.log('   📄 17-cleaned-examples-summary.json - Comparison analysis');
  
  console.log('\n🎯 API Usage Examples:');
  console.log('   // Convert and clean for JSON API response:');
  console.log('   const converted = stringToJson(input, separators, strict);');
  console.log('   const clean = await cleanForApi(converted, "json");');
  console.log('   res.json({ data: clean });');
  console.log('');
  console.log('   // Convert and clean for XML API response:');
  console.log('   const converted = stringToXml(input, separators, strict);');
  console.log('   const clean = await cleanForApi(converted, "xml");');
  console.log('   res.set("Content-Type", "application/xml").send(clean);');
  
  console.log('\n📊 Size Reductions:');
  console.log(`   📄 JSON: ${summary.size_comparison.json.bytes_saved} bytes saved (${summary.size_comparison.json.percentage_reduction}% reduction)`);
  console.log(`   📄 XML:  ${summary.size_comparison.xml.bytes_saved} bytes saved (${summary.size_comparison.xml.percentage_reduction}% reduction)`);
  
  console.log('\n✅ Cleaned API response examples generated successfully!');
  console.log(`   📁 Total files in data folder: ${fs.readdirSync('./data').length}`);
}

generateCleanedExamples().catch(console.error);
