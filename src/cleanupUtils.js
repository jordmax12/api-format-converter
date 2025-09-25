const xml2js = require('xml2js');

/**
 * Removes internal metadata and order fields from JSON data for clean API responses
 * @param {Object} jsonData - JSON data that may contain _metadata and _order fields
 * @returns {Object} - Clean JSON without internal fields
 */
function cleanJsonForApi(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return jsonData;
  }

  // Create a deep copy to avoid mutating the original
  const cleaned = JSON.parse(JSON.stringify(jsonData));

  // Remove top-level _metadata
  if (cleaned._metadata) {
    delete cleaned._metadata;
  }

  // Clean segments array if it exists
  if (cleaned.segments && Array.isArray(cleaned.segments)) {
    cleaned.segments = cleaned.segments.map(segment => {
      const cleanSegment = { ...segment };
      
      // Remove any _order or other internal fields
      if (cleanSegment._order !== undefined) {
        delete cleanSegment._order;
      }
      if (cleanSegment._originalOrder !== undefined) {
        delete cleanSegment._originalOrder;
      }
      
      return cleanSegment;
    });
  }

  return cleaned;
}

/**
 * Removes internal metadata and order fields from XML string for clean API responses
 * @param {string} xmlData - XML string that may contain _metadata and _order elements
 * @returns {Promise<string>} - Clean XML without internal elements
 */
async function cleanXmlForApi(xmlData) {
  if (!xmlData || typeof xmlData !== 'string') {
    return xmlData;
  }

  try {
    // Parse XML to object
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
      explicitRoot: false,
      mergeAttrs: false,
      emptyTag: '',
      trim: false,
      normalize: false
    });

    const parsed = await parser.parseStringPromise(xmlData);
    
    // Remove _metadata from root level
    if (parsed._metadata) {
      delete parsed._metadata;
    }

    // Clean _order from all segments
    Object.keys(parsed).forEach(segmentName => {
      if (segmentName === '_metadata') return; // Skip if somehow still there
      
      const segmentData = parsed[segmentName];
      
      if (Array.isArray(segmentData)) {
        // Multiple segments of same type
        segmentData.forEach(segment => {
          if (segment && typeof segment === 'object' && segment._order !== undefined) {
            delete segment._order;
          }
        });
      } else if (segmentData && typeof segmentData === 'object') {
        // Single segment
        if (segmentData._order !== undefined) {
          delete segmentData._order;
        }
      }
    });

    // Convert back to XML
    const builder = new xml2js.Builder({
      rootName: 'root',
      headless: false,
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { 
        pretty: true,
        indent: '  ',
        newline: '\n'
      },
      allowEmpty: true
    });

    return builder.buildObject(parsed);

  } catch (error) {
    // If parsing fails, return original XML
    console.warn('Failed to clean XML, returning original:', error.message);
    return xmlData;
  }
}

/**
 * Cleans data for API responses based on specified data type
 * @param {string|Object} data - Data to clean
 * @param {string} dataType - Type of data: 'json', 'xml', or 'string'
 * @returns {Promise<string|Object>} - Cleaned data
 */
async function cleanForApi(data, dataType) {
  switch (dataType.toLowerCase()) {
    case 'json':
      return cleanJsonForApi(data);
    case 'xml':
      return await cleanXmlForApi(data);
    case 'string':
    default:
      // String format doesn't have metadata/order fields, return as-is
      return data;
  }
}

module.exports = {
  cleanJsonForApi,
  cleanXmlForApi,
  cleanForApi
};
