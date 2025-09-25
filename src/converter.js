const xml2js = require('xml2js');

/**
 * Converts string format to JSON
 * @param {string} stringData - String format data
 * @param {Object} separators - { element: string, segment: string }
 * @param {boolean} strict - If true, preserves empty elements for perfect round-trip conversion (default true)
 * @returns {Object} - JSON representation
 */
function stringToJson(stringData, separators, strict = true) {
  const { element, segment } = separators;
  
  // Check if original data ends with segment separator
  const endsWithSeparator = stringData.endsWith(segment);

  const segments = stringData.trim().split(segment).filter(s => s.trim());

  const result = {
    segments: [],
    _metadata: {
      endsWithSeparator: endsWithSeparator
    }
  };

  segments.forEach((segmentData) => {
    const parts = segmentData.split(element);

    if (parts.length < 2) return;

    const segmentId = parts[0];
    const elements = parts.slice(1);

    result.segments.push({
      segment_id: segmentId,
      elements: strict ? elements : elements.filter(e => e.trim()) 
    });
  });

  return result;
}

/**
 * Converts JSON to string format
 * @param {Object} jsonData - JSON data
 * @param {Object} separators - { element: string, segment: string }
 * @param {boolean} strict - If true, preserves empty elements for perfect round-trip conversion (default true)
 * @returns {string} - String format representation
 */
function jsonToString(jsonData, separators, strict = true) {
  const { element, segment } = separators;
  
  // Extract metadata
  const metadata = jsonData._metadata || {};
  const endsWithSeparator = metadata.endsWithSeparator || false;
  
  // Convert segments back to string format
  const stringSegments = jsonData.segments.map(seg => {
    const elements = strict ? seg.elements : seg.elements.filter(e => e.trim());
    const parts = [seg.segment_id, ...elements];
    return parts.join(element);
  });
  
  // Join segments and add trailing separator if original had it
  let result = stringSegments.join(segment);
  if (endsWithSeparator) {
    result += segment;
  }
  
  return result;
}

/**
 * Converts JSON to XML
 * @param {Object} jsonData - JSON data
 * @returns {string} - XML string
 */
function jsonToXml(jsonData) {
  // Create XML structure from segments array, preserving order and metadata
  const xmlData = {};
  
  // Add metadata if it exists
  if (jsonData._metadata) {
    xmlData._metadata = jsonData._metadata;
  }
  
  jsonData.segments.forEach((seg, index) => {
    const segmentName = seg.segment_id;
    
    // Create segment object with numbered elements AND sequence order
    const segmentObj = {
      _order: index  // Add sequence information
    };
    seg.elements.forEach((element, elementIndex) => {
      segmentObj[`${segmentName}${elementIndex + 1}`] = element;
    });
    
    // Group segments by name
    if (!xmlData[segmentName]) {
      xmlData[segmentName] = [];
    }
    xmlData[segmentName].push(segmentObj);
  });
  
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
  
  return builder.buildObject(xmlData);
}

/**
 * Converts XML to JSON
 * @param {string} xmlData - XML string
 * @returns {Promise<Object>} - JSON representation
 */
async function xmlToJson(xmlData) {
  const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: true,
    explicitRoot: false,
    mergeAttrs: false,
    emptyTag: '',  // Preserve empty elements as empty strings
    trim: false,   // Don't trim whitespace
    normalize: false // Don't normalize whitespace
  });
  
  try {
    const result = await parser.parseStringPromise(xmlData);
    
    // Convert XML structure back to segments array, preserving original order and metadata
    const segments = [];
    let metadata = null;
    
    Object.keys(result).forEach(segmentName => {
      // Handle metadata separately - don't process as segment
      if (segmentName === '_metadata') {
        metadata = result[segmentName];
        return;
      }
      
      const segmentArray = Array.isArray(result[segmentName]) ? result[segmentName] : [result[segmentName]];
      
      segmentArray.forEach(segmentObj => {
        // Extract elements in order, excluding _order field
        const elements = [];
        const keys = Object.keys(segmentObj)
          .filter(key => key !== '_order')  // Skip the order field
          .sort((a, b) => {
            const aNum = parseInt(a.replace(segmentName, ''));
            const bNum = parseInt(b.replace(segmentName, ''));
            return aNum - bNum;
          });
        
        keys.forEach(key => {
          elements.push(segmentObj[key]);
        });
        
        segments.push({
          segment_id: segmentName,
          elements: elements,
          _originalOrder: segmentObj._order || 0  // Preserve original order
        });
      });
    });
    
    // Sort segments by original order to restore sequence
    segments.sort((a, b) => a._originalOrder - b._originalOrder);
    
    // Remove the temporary _originalOrder field
    const cleanSegments = segments.map(seg => ({
      segment_id: seg.segment_id,
      elements: seg.elements
    }));
    
    // Build result with metadata if it exists
    const jsonResult = { segments: cleanSegments };
    if (metadata) {
      jsonResult._metadata = metadata;
    }
    
    return jsonResult;
  } catch (error) {
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

/**
 * Converts string to XML
 * @param {string} stringData - String format data
 * @param {Object} separators - { element: string, segment: string }
 * @param {boolean} strict - If true, preserves empty elements for perfect round-trip conversion (default true)
 * @returns {string} - XML string
 */
function stringToXml(stringData, separators, strict = true) {
  const jsonData = stringToJson(stringData, separators, strict);
  return jsonToXml(jsonData);
}

/**
 * Converts XML to string
 * @param {string} xmlData - XML string
 * @param {Object} separators - { element: string, segment: string }
 * @param {boolean} strict - If true, preserves empty elements for perfect round-trip conversion (default true)
 * @returns {Promise<string>} - String format representation
 */
async function xmlToString(xmlData, separators, strict = true) {
  const jsonData = await xmlToJson(xmlData);
  return jsonToString(jsonData, separators, strict);
}

module.exports = {
  stringToJson,
  jsonToString,
  jsonToXml,
  xmlToJson,
  stringToXml,
  xmlToString
};