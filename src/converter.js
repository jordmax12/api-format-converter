const xml2js = require('xml2js');

/**
 * Converts string format to JSON
 * @param {string} stringData - String format data
 * @param {Object} separators - { element: string, segment: string }
 * @returns {Object} - JSON representation
 */
function stringToJson(stringData, separators) {
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
      elements: elements
    });
  });

  return result;
}

/**
 * Converts JSON to string format
 * @param {Object} jsonData - JSON data
 * @param {Object} separators - { element: string, segment: string }
 * @returns {string} - String format representation
 */
function jsonToString(jsonData, separators) {
  const { element, segment } = separators;
  
  // Extract metadata
  const metadata = jsonData._metadata || {};
  const endsWithSeparator = metadata.endsWithSeparator || false;
  
  // Convert segments back to string format
  const stringSegments = jsonData.segments.map(seg => {
    const parts = [seg.segment_id, ...seg.elements];
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
  // Create XML structure from segments array
  const xmlData = {};
  
  jsonData.segments.forEach((seg, index) => {
    const segmentName = seg.segment_id;
    
    // Create segment object with numbered elements
    const segmentObj = {};
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
    xmldec: { version: '1.0', encoding: 'UTF-8' }
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
    mergeAttrs: false
  });
  
  try {
    const result = await parser.parseStringPromise(xmlData);
    
    // Convert XML structure back to segments array
    const segments = [];
    
    Object.keys(result).forEach(segmentName => {
      const segmentArray = Array.isArray(result[segmentName]) ? result[segmentName] : [result[segmentName]];
      
      segmentArray.forEach(segmentObj => {
        // Extract elements in order
        const elements = [];
        const keys = Object.keys(segmentObj).sort((a, b) => {
          const aNum = parseInt(a.replace(segmentName, ''));
          const bNum = parseInt(b.replace(segmentName, ''));
          return aNum - bNum;
        });
        
        keys.forEach(key => {
          elements.push(segmentObj[key]);
        });
        
        segments.push({
          segment_id: segmentName,
          elements: elements
        });
      });
    });
    
    return { segments };
  } catch (error) {
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

/**
 * Converts string to XML
 * @param {string} stringData - String format data
 * @param {Object} separators - { element: string, segment: string }
 * @returns {string} - XML string
 */
function stringToXml(stringData, separators) {
  const jsonData = stringToJson(stringData, separators);
  return jsonToXml(jsonData);
}

/**
 * Converts XML to string
 * @param {string} xmlData - XML string
 * @param {Object} separators - { element: string, segment: string }
 * @returns {Promise<string>} - String format representation
 */
async function xmlToString(xmlData, separators) {
  const jsonData = await xmlToJson(xmlData);
  return jsonToString(jsonData, separators);
}

module.exports = {
  stringToJson,
  jsonToString,
  jsonToXml,
  xmlToJson,
  stringToXml,
  xmlToString
};