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
 * @returns {Promise<object>} Initialized Emscripten module with FS access
 */
export async function loadWasm() {
  if (wasmModule) return wasmModule;
  if (wasmLoading) return wasmLoading;

  wasmLoading = (async () => {
    // Create a promise that resolves when the module is ready
    let resolveReady;
    const readyPromise = new Promise((resolve) => {
      resolveReady = resolve;
    });

    // Shared output capture object - Emscripten captures print at load time,
    // so we need to use a mutable object that the closure can write to
    const capture = {
      output: '',
      errors: '',
    };

    // Set up Module configuration before loading the script
    // The Emscripten script looks for window.Module
    const moduleConfig = {
      noInitialRun: true,
      print: (text) => {
        capture.output += text + '\n';
      },
      printErr: (text) => {
        capture.errors += text + '\n';
      },
      locateFile: (path) => {
        return `${WASM_BASE_URL}${path}`;
      },
      onRuntimeInitialized: () => {
        resolveReady();
      },
    };

    // Store config globally for the Emscripten script to find
    window.Module = moduleConfig;

    // Load the Emscripten script via script tag
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${WASM_BASE_URL}edid-decode.js`;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load edid-decode.js'));
      document.head.appendChild(script);
    });

    // Wait for runtime initialization
    await Promise.race([
      readyPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('WASM initialization timeout')), 15000)
      ),
    ]);

    // Get the module reference (Emscripten assigns to window.Module)
    const Module = window.Module;

    // Create wrapper object - uses shared capture object since
    // Emscripten's out/err functions were bound at load time
    wasmModule = {
      Module,
      _capture: capture,

      resetCapture() {
        this._capture.output = '';
        this._capture.errors = '';
      },

      getOutput() {
        return this._capture.output;
      },

      getErrors() {
        return this._capture.errors;
      },
    };

    return wasmModule;
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

  const wrapper = await loadWasm();
  const Module = wrapper.Module;

  // Reset output capture
  wrapper.resetCapture();

  try {
    // Get pointer to static input buffer in WASM memory
    const bufferPtr = Module._get_edid_buffer();
    const bufferSize = Module._get_edid_buffer_size();

    if (edidData.length > bufferSize) {
      throw new Error(`EDID data too large: ${edidData.length} > ${bufferSize}`);
    }

    // Copy EDID data directly to the static buffer
    Module.HEAPU8.set(edidData, bufferPtr);

    // Call parse_edid_buffer with just the length
    const result = Module._parse_edid_buffer(edidData.length);

    // Get output
    let output = wrapper.getOutput();
    const errors = wrapper.getErrors();

    // Combine output and errors
    if (errors && errors.trim()) {
      output += '\n--- Warnings/Errors ---\n' + errors;
    }

    if (result !== 0 && !output.trim()) {
      throw new Error('EDID decode failed');
    }

    return output.trim() || '(no output)';
  } catch (err) {
    const errors = wrapper.getErrors();
    if (errors) {
      throw new Error(`${err.message}\n${errors}`);
    }
    throw err;
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
