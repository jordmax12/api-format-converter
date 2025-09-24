# API Format Converter

A simple API service for converting data between different formats. This project provides endpoints to transform API responses and data structures according to specified conversion rules.

## Features

- RESTful API endpoints for data conversion
- Support for multiple data formats
- Simple and lightweight Express.js server
- JSON request/response handling

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
   ```bash
   npm ci
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

## Development

### Project Structure
```
api-format-converter/
├── server.js          # Main server file
├── package.json       # Project dependencies and scripts
└── README.md         # Project documentation
```

### Environment Variables

- `PORT`: Server port (default: 3000)
