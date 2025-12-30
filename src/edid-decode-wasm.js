/**
 * WASM wrapper for linuxtv edid-decode.
 * Provides lazy loading and async API for decoding EDID data.
 *
 * @module edid-decode-wasm
 */

let wasmModule = null;
let wasmLoading = null;

// Resolve WASM path relative to this module
const WASM_BASE_URL = new URL('../wasm/', import.meta.url).href;

/**
 * Check if WebAssembly is supported in this environment.
 * @returns {boolean}
 */
export function isWasmSupported() {
  return typeof WebAssembly !== 'undefined';
}

/**
 * Lazy-load the WASM module.
 * @returns {Promise<object>} Initialized Emscripten module
 */
export async function loadWasm() {
  if (wasmModule) return wasmModule;
  if (wasmLoading) return wasmLoading;

  wasmLoading = (async () => {
    // Fetch and execute the Emscripten glue code
    const response = await fetch(`${WASM_BASE_URL}edid-decode.js`);
    const code = await response.text();

    // Create module configuration
    const moduleConfig = {
      noInitialRun: true,
      print: () => {}, // Will be overridden per-call
      printErr: () => {},
      locateFile: (path) => `${WASM_BASE_URL}${path}`,
    };

    // Execute the Emscripten module code
    // The module assigns to a global 'Module' or returns it
    const moduleFunc = new Function('Module', `
      var f = Module;
      ${code}
      return f;
    `);

    const Module = moduleFunc(moduleConfig);

    // Wait for WASM to be ready
    await new Promise((resolve, reject) => {
      Module.onRuntimeInitialized = resolve;
      Module.onAbort = reject;
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('WASM initialization timeout')), 10000);
    });

    wasmModule = Module;
    return Module;
  })();

  return wasmLoading;
}

/**
 * Decode EDID data using the WASM module.
 * @param {Uint8Array} edidData - Raw EDID bytes (128-512 bytes typically)
 * @returns {Promise<string>} Decoded text output from edid-decode
 */
export async function decodeEdidWasm(edidData) {
  if (!edidData || edidData.length < 128) {
    throw new Error('Invalid EDID data: must be at least 128 bytes');
  }

  const Module = await loadWasm();

  // Capture output
  let output = '';
  let errors = '';

  const originalPrint = Module.print;
  const originalPrintErr = Module.printErr;

  Module.print = (text) => {
    output += text + '\n';
  };
  Module.printErr = (text) => {
    errors += text + '\n';
  };

  try {
    // Write EDID to virtual filesystem
    const inputPath = '/input.bin';
    Module.FS.writeFile(inputPath, edidData);

    // Call parse_edid
    Module.ccall('parse_edid', 'number', ['string'], [inputPath]);

    // Clean up
    try {
      Module.FS.unlink(inputPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Combine output and errors
    if (errors && errors.trim()) {
      output += '\n--- Warnings/Errors ---\n' + errors;
    }

    return output.trim();
  } finally {
    // Restore original print functions
    Module.print = originalPrint;
    Module.printErr = originalPrintErr;
  }
}

/**
 * Get the WASM loading state.
 * @returns {'idle'|'loading'|'loaded'|'error'}
 */
export function getWasmState() {
  if (wasmModule) return 'loaded';
  if (wasmLoading) return 'loading';
  return 'idle';
}

/**
 * Preload the WASM module without decoding anything.
 * Useful for warming up the module before user interaction.
 * @returns {Promise<void>}
 */
export async function preloadWasm() {
  await loadWasm();
}

export default {
  isWasmSupported,
  loadWasm,
  decodeEdidWasm,
  getWasmState,
  preloadWasm,
};
