const fs = require('fs');

// Real test data from data files with error handling
let testStringData, testJsonData;

try {
  testStringData = fs.readFileSync('./data/test-file.txt', 'utf8').trim();
  testJsonData = JSON.parse(fs.readFileSync('./data/15-cleaned-json-for-api.json', 'utf8'));
} catch (error) {
  console.error('❌ Error reading test data files:');
  console.error('   Make sure you are running this script from the project root directory');
  console.error('   Expected files: ./data/test-file.txt and ./data/15-cleaned-json-for-api.json');
  console.error('   Current directory:', process.cwd());
  console.error('   Error:', error.message);
  process.exit(1);
}

// Shorter sample data for easier curl testing
const shortStringData = 'ISA*00*          *00*          *12*5032337522~GS*PO*5032337522*005033375~ST*850*000000001~';
const shortJsonData = {
  'segments': [
    {
      'segment_id': 'ISA',
      'elements': ['00', '          ', '00', '          ', '12', '5032337522']
    },
    {
      'segment_id': 'GS',
      'elements': ['PO', '5032337522', '005033375']
    },
    {
      'segment_id': 'ST',
      'elements': ['850', '000000001']
    }
  ]
};

async function testApiEndpoint() {
  console.log('🧪 Testing /convert API Endpoint');
  console.log('============================================================');

  const baseUrl = 'http://localhost:3000';

  // Test cases using real EDI data
  const testCases = [
    {
      name: 'Real EDI String to JSON (strict mode)',
      data: {
        input: testStringData,
        outputFormat: 'json',
        strict: true
      },
      description: `Full EDI data (${testStringData.length} chars, 61 segments)`
    },
    {
      name: 'Real EDI String to JSON (non-strict mode)',
      data: {
        input: testStringData,
        outputFormat: 'json',
        strict: false
      },
      description: 'Full EDI data with empty elements filtered'
    },
    {
      name: 'Clean JSON to XML',
      data: {
        input: testJsonData,
        outputFormat: 'xml'
      },
      description: `Clean JSON (${testJsonData.segments.length} segments) to XML`
    },
    {
      name: 'Clean JSON to String',
      data: {
        input: testJsonData,
        outputFormat: 'string'
      },
      description: 'Clean JSON back to EDI string format'
    },
    {
      name: 'Short EDI Sample to JSON',
      data: {
        input: shortStringData,
        outputFormat: 'json',
        strict: true
      },
      description: `Short sample for easy testing (${shortStringData.length} chars)`
    }
  ];

  console.log('📋 Test Cases Prepared:');
  testCases.forEach((test, i) => {
    console.log(`   ${i + 1}. ${test.name}`);
    console.log(`       ${test.description}`);
  });

  console.log('\n🚀 To test the API endpoint:');
  console.log('============================================================');

  console.log('\n1️⃣ Start the server:');
  console.log('   npm run dev');
  console.log('   # or');
  console.log('   node server.js');

  console.log('\n2️⃣ Test with curl commands (using short sample data):');
  console.log('\n📝 Short EDI String to JSON (strict):');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -d '{"input": "${shortStringData}", "outputFormat": "json", "strict": true}'`);

  console.log('\n📝 Short EDI String to JSON (non-strict):');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -d '{"input": "${shortStringData}", "outputFormat": "json", "strict": false}'`);

  console.log('\n📝 JSON to XML:');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -d '${JSON.stringify({ input: shortJsonData, outputFormat: 'xml' })}'`);

  console.log('\n📝 JSON to String:');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -d '${JSON.stringify({ input: shortJsonData, outputFormat: 'string' })}'`);

  console.log('\n📝 Full EDI Data Test (use for performance testing):');
  console.log(`# Note: Full EDI data is ${testStringData.length} characters`);
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d @- << \'EOF\'');
  console.log(`{"input": "${testStringData.slice(0, 100)}...", "outputFormat": "json", "strict": true}`);
  console.log('EOF');

  console.log('\n3️⃣ Test error cases:');
  console.log('\n❌ Missing input:');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"outputFormat": "json"}\'');

  console.log('\n❌ Missing output format:');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"input": "test"}\'');

  console.log('\n❌ Invalid output format:');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"input": "test", "outputFormat": "invalid"}\'');

  console.log('\n❌ Empty input:');
  console.log(`curl -X POST ${baseUrl}/convert \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"input": "", "outputFormat": "json"}\'');

  console.log('\n4️⃣ Environment Variable Testing:');
  console.log('============================================================');
  console.log('\n🔧 Set strict mode default to false:');
  console.log('   DEFAULT_STRICT_MODE=false node server.js');
  console.log('\n🔧 Check current environment:');
  console.log(`   curl ${baseUrl}/`);

  console.log('\n✅ Expected Response Formats:');
  console.log('============================================================');
  console.log('\n📄 JSON Response:');
  console.log(`{
  "success": true,
  "inputFormat": "string",
  "outputFormat": "json", 
  "strict": true,
  "data": {
    "segments": [...]
  }
}`);

  console.log('\n📄 XML Response (raw):');
  console.log('<?xml version="1.0" encoding="UTF-8"?>\\n<root>...</root>');

  console.log('\n📄 String Response (raw):');
  console.log('ProductID*4*8*15~AddressID*42*108~');

  console.log('\n📄 Error Response:');
  console.log(`{
  "error": "Missing required parameter",
  "message": "outputFormat is required (json, xml, or string)"
}`);

  console.log('\n🎯 POSTMAN TEST EXAMPLES:');
  console.log('============================================================');

  console.log('\n📋 Method: POST');
  console.log(`📋 URL: ${baseUrl}/convert`);

  console.log('\n1️⃣ Short EDI to JSON (Body -> raw -> JSON):');
  console.log(JSON.stringify({
    input: shortStringData,
    outputFormat: 'json',
    strict: true
  }, null, 2));

  console.log('\n2️⃣ JSON to XML (Body -> raw -> JSON):');
  console.log(JSON.stringify({
    input: shortJsonData,
    outputFormat: 'xml'
  }, null, 2));

  console.log('\n3️⃣ JSON to String (Body -> raw -> JSON):');
  console.log(JSON.stringify({
    input: shortJsonData,
    outputFormat: 'string'
  }, null, 2));

  console.log('\n4️⃣ Custom Separators (Body -> raw -> JSON):');
  console.log(JSON.stringify({
    input: 'ProductID|4|8|15\\nAddressID|42|108',
    outputFormat: 'json',
    separators: { element: '|', segment: '\\n' }
  }, null, 2));

  console.log('\n5️⃣ Full EDI Data (Body -> raw -> JSON):');
  console.log('// Note: This is the full real EDI data - large payload');
  console.log('// Use this JSON in Postman for full testing:');
  console.log(JSON.stringify({
    input: testStringData,
    outputFormat: 'json',
    strict: false
  }, null, 2).slice(0, 500) + '...');
  console.log(`// Full input length: ${testStringData.length} characters`);

  console.log('\n6️⃣ Error Test - Missing input:');
  console.log(JSON.stringify({
    outputFormat: 'json'
  }, null, 2));

  console.log('\n7️⃣ Error Test - Missing outputFormat:');
  console.log(JSON.stringify({
    input: shortStringData
  }, null, 2));

  console.log('\n✅ Expected Success Response (JSON output):');
  console.log(`{
  "success": true,
  "inputFormat": "string",
  "outputFormat": "json",
  "strict": true,
  "data": {
    "segments": [
      {
        "segment_id": "ProductID",
        "elements": ["4", "8", "15"]
      }
    ]
  }
}`);

  console.log('\n❌ Expected Error Response:');
  console.log(`{
  "error": "Missing required parameter",
  "message": "outputFormat is required (json, xml, or string)"
}`);

  console.log('\n🎯 Ready to test the API endpoint!');
  console.log('   Start your server and use the curl commands or Postman examples above!');
}

testApiEndpoint().catch(console.error);
