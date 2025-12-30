/**
 * Minimal EDID decoder for list view.
 * Extracts only the fields needed for results display.
 *
 * For full EDID parsing, use edid-decoder.js or the WASM edid-decode.
 *
 * @module edid-decoder-basic
 */

/**
 * Convert 5-bit code to ASCII letter (A-Z).
 * @param {number} code - 5-bit value (1-26)
 * @returns {string} Single character A-Z or ?
 */
function intToAscii(code) {
  return code > 0 && code <= 26 ? String.fromCharCode(code + 64) : '?';
}

/**
 * Parse 3-letter manufacturer ID from bytes 8-9.
 * @param {Uint8Array} data - EDID bytes
 * @returns {string} 3-character manufacturer code
 */
function parseManufacturerId(data) {
  const byte1 = data[8];
  const byte2 = data[9];
  const ch1 = (byte1 >> 2) & 0x1F;
  const ch2 = ((byte1 & 0x03) << 3) | ((byte2 >> 5) & 0x07);
  const ch3 = byte2 & 0x1F;
  return intToAscii(ch1) + intToAscii(ch2) + intToAscii(ch3);
}

/**
 * Parse product code from bytes 10-11 (little-endian).
 * @param {Uint8Array} data - EDID bytes
 * @returns {number} Product code
 */
function parseProductCode(data) {
  return data[10] | (data[11] << 8);
}

/**
 * Search descriptors (bytes 54-125) for monitor name (tag 0xFC).
 * @param {Uint8Array} data - EDID bytes
 * @returns {string|null} Monitor name or null
 */
function parseMonitorName(data) {
  for (let i = 0; i < 4; i++) {
    const offset = 54 + i * 18;

    // Check if it's a display descriptor (first two bytes are 0)
    if (data[offset] !== 0 || data[offset + 1] !== 0) continue;

    // Check for monitor name tag (0xFC)
    if (data[offset + 3] !== 0xFC) continue;

    // Extract text (bytes 5-17 of descriptor)
    let name = '';
    for (let j = 5; j < 18; j++) {
      const byte = data[offset + j];
      if (byte === 0x0A || byte === 0x00) break;
      name += String.fromCharCode(byte);
    }
    return name.trim();
  }
  return null;
}

/**
 * Parse preferred resolution from first detailed timing descriptor (bytes 54-71).
 * @param {Uint8Array} data - EDID bytes
 * @returns {{width: number, height: number, interlaced: boolean}|null}
 */
function parsePreferredResolution(data) {
  const offset = 54;

  // Pixel clock (bytes 0-1, little-endian, in 10kHz units)
  const pixelClock = (data[offset + 1] << 8) | data[offset];
  if (pixelClock === 0) return null; // Not a timing descriptor

  // Horizontal active pixels
  const hActive = data[offset + 2] | ((data[offset + 4] & 0xF0) << 4);

  // Vertical active lines
  const vActive = data[offset + 5] | ((data[offset + 7] & 0xF0) << 4);

  // Interlaced flag (byte 17, bit 7)
  const interlaced = (data[offset + 17] & 0x80) !== 0;

  return { width: hActive, height: vActive, interlaced };
}

/**
 * Decode minimal EDID data for list display.
 *
 * @param {Uint8Array} data - Raw EDID bytes (at least 128 bytes)
 * @returns {Object} Minimal decoded EDID fields
 */
export function decodeEdidBasic(data) {
  if (!data || data.length < 128) {
    return { error: 'EDID too short' };
  }

  // Manufacturer ID (bytes 8-9)
  const manufacturerId = parseManufacturerId(data);

  // Product code (bytes 10-11)
  const productCode = parseProductCode(data);
  const productCodeHex = productCode.toString(16).toUpperCase().padStart(4, '0');

  // Manufacture year (byte 17 + 1990)
  const year = data[17] + 1990;

  // Screen size in cm (bytes 21-22)
  const screenSizeCm = {
    widthCm: data[21],
    heightCm: data[22],
  };

  // Digital vs analog (byte 20, bit 7)
  const digital = (data[20] & 0x80) !== 0;

  // Monitor name from descriptors
  const monitorName = parseMonitorName(data);

  // Preferred resolution from first detailed timing
  const preferredResolution = parsePreferredResolution(data);

  return {
    manufacturerId,
    productCode,
    productCodeHex,
    year,
    week: data[16],
    manufactureYear: year,
    screenSizeCm,
    videoInput: { digital },
    monitorName,
    preferredResolution,
  };
}

export default decodeEdidBasic;
