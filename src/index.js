/**
 * LinuxHW Browser - Web components for browsing EDID display data
 * @module linuxhw-browser
 */

// Main components
export { EdidBrowser } from './edid-browser.js';
export { EdidViewer } from './edid-viewer.js';
export { EdidSelector } from './edid-selector.js';
export { EdidDetail } from './edid-detail.js';

// UI components
export { SearchTabs } from './search-tabs.js';
export { ResultsTable } from './results-table.js';

// EDID decoder and utilities
export {
  decodeEdid,
  EdidDecoder,
  EDID_BLOCK_LENGTH,
  DTD_LENGTH,
  ESTABLISHED_TIMINGS,
  ASPECT_RATIOS,
  AUDIO_FORMATS,
  SAMPLE_RATES,
  BIT_DEPTHS,
  VIDEO_FORMATS
} from './edid-decoder.js';

export {
  decodeVendorCode,
  decodeProductCode,
  getDisplayType,
  extractPathInfo
} from './edid-utils.js';

// Data loaders
export { BucketLoader, ParsedBucket } from './bucket-loader.js';
export { IndexLoader, ParsedIndex } from './index-loader.js';

// Roaring bitmap utilities
export { decodeRoaring, decodeRoaringLimit, countRoaring } from './roaring.js';
