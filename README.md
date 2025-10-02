# API Format Converter

A simple API service for converting data between different formats. This project provides endpoints to transform API input requests into responses designated by user. This was a interview assignment for Orderful.

## Features

- RESTful API endpoints for document format conversion
- Support for three specific document formats
- Custom string format parsing and generation
- Input validation and error handling
- Simple and lightweight Express.js server
- Strict mode setting for round-trip support (mostly used for local testing)

## Supported Document Formats

### Format #1: String (Custom)
String data composed of 'segments' (lines) and 'elements' (data values):
- **Segments**: Delineated by line separator character (e.g., `~`)
- **Elements**: Delineated by element separator character (e.g., `*`)
- **Structure**: `SegmentName*element1*element2*element3~`

**Example:**
```
ProductID*4*8*15*16*23~
ProductID*a*b*c*d*e~
AddressID*42*108*3*14~
ContactID*59*26~
```

### Format #2: JSON
Segments are nested in arrays and objects:
- **Keys**: Segment names followed by incrementing integers (1, 2, 3...)
- **Structure**: Grouped by segment type with numbered element keys

**Example:**
```json
{
  "ProductID": [
    {
      "ProductID1": "4",
      "ProductID2": "8",
      "ProductID3": "15",
      "ProductID4": "16",
      "ProductID5": "23"
    },
    {
      "ProductID1": "a",
      "ProductID2": "b",
      "ProductID3": "c",
      "ProductID4": "d",
      "ProductID5": "e"
    }
  ],
  "AddressID": [
    {
      "AddressID1": "42",
      "AddressID2": "108",
      "AddressID3": "3",
      "AddressID4": "14"
    }
  ],
  "ContactID": [
    {
      "ContactID1": "59",
      "ContactID2": "26"
    }
  ]
}
```

### Format #3: XML
Standard XML structure with nested elements:
- **Root element**: `<root>`
- **Segment grouping**: Multiple segments of same type at root level
- **Element naming**: Numbered element tags (SegmentName1, SegmentName2, etc.)

**Example:**
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<root>
  <ProductID>
    <ProductID1>4</ProductID1>
    <ProductID2>8</ProductID2>
    <ProductID3>15</ProductID3>
    <ProductID4>16</ProductID4>
    <ProductID5>23</ProductID5>
  </ProductID>
  <ProductID>
    <ProductID1>a</ProductID1>
    <ProductID2>b</ProductID2>
    <ProductID3>c</ProductID3>
    <ProductID4>d</ProductID4>
    <ProductID5>e</ProductID5>
  </ProductID>
  <AddressID>
    <AddressID1>42</AddressID1>
    <AddressID2>108</AddressID2>
    <AddressID3>3</AddressID3>
    <AddressID4>14</AddressID4>
  </AddressID>
  <ContactID>
    <ContactID1>59</ContactID1>
    <ContactID2>26</ContactID2>
  </ContactID>
</root>
```

## Conversion Capabilities

The API supports conversion between all three formats:
- **String ↔ JSON**
- **String ↔ XML** 
- **JSON ↔ XML**

### Special Requirements
- **String Format**: Requires custom separator characters to be specified
- **JSON/XML**: Can use standard libraries for JSON ↔ XML conversion
- **String Parsing**: Custom logic required for string format conversion

## Prerequisites

- Node.js (version 22 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:jordmax12/api-format-converter.git
   cd api-format-converter
   ```

2. Install dependencies:
   
   From lockfile (recommended):
   ```bash
   npm ci
   ```
   
   Or from package.json:
   ```bash
   npm install
   ```


## Usage

### Starting the Server

To start the server in production mode:
```bash
npm start
```

To start the server in development mode with auto-reload:
```bash
npm run dev
```
