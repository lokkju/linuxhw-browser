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

    // Output capture
    let capturedOutput = '';
    let capturedErrors = '';

    // Set up Module configuration before loading the script
    // The Emscripten script looks for window.Module
    const moduleConfig = {
      noInitialRun: true,
      print: (text) => {
        capturedOutput += text + '\n';
      },
      printErr: (text) => {
        capturedErrors += text + '\n';
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

    // Create wrapper object with output capture functionality
    wasmModule = {
      Module,
      _capturedOutput: '',
      _capturedErrors: '',

      resetCapture() {
        this._capturedOutput = '';
        this._capturedErrors = '';
        Module.print = (text) => {
          this._capturedOutput += text + '\n';
        };
        Module.printErr = (text) => {
          this._capturedErrors += text + '\n';
        };
      },

      getOutput() {
        return this._capturedOutput;
      },

      getErrors() {
        return this._capturedErrors;
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
    // Write EDID to virtual filesystem
    // FS is a global created by Emscripten
    const FS = Module.FS || window.FS;
    if (!FS) {
      throw new Error('Emscripten FS not available');
    }

    const inputPath = '/input.bin';
    FS.writeFile(inputPath, edidData);

    // Call parse_edid (ccall uses name without underscore prefix)
    Module.ccall('parse_edid', 'number', ['string'], [inputPath]);

    // Clean up
    try {
      FS.unlink(inputPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Get output
    let output = wrapper.getOutput();
    const errors = wrapper.getErrors();

    // Combine output and errors
    if (errors && errors.trim()) {
      output += '\n--- Warnings/Errors ---\n' + errors;
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
