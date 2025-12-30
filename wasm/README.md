# edid-decode WASM Build

This directory contains the build configuration for compiling [edid-decode](https://git.linuxtv.org/edid-decode.git/) to WebAssembly using Emscripten.

## Prerequisites

- [Earthly](https://earthly.dev/) (or Docker with Emscripten SDK)

## Building

### With Earthly (Recommended)

```bash
cd wasm
earthly +all
```

This produces:
- `edid-decode.wasm` - WebAssembly binary
- `edid-decode.js` - Emscripten glue code

### With Docker (Manual)

```bash
docker run --rm -v $(pwd):/src -w /src emscripten/emsdk:3.1.51 bash -c '
  pip3 install meson ninja
  git clone https://github.com/oe-mirrors/edid-decode.git /tmp/edid-decode
  cd /tmp/edid-decode
  meson setup build-wasm --cross-file ./emscripten/wasm-crossfile.txt --prefix=/tmp/install
  meson compile -C build-wasm
  meson install -C build-wasm
  cp /tmp/install/bin/edid-decode.{js,wasm} /src/
'
```

## Usage

The WASM module exposes:

```javascript
// Write EDID bytes to virtual filesystem
Module.FS.writeFile('input-file', edidUint8Array);

// Parse and output to stdout
Module.ccall('parse_edid', 'number', ['string'], ['input-file']);
```

Output is captured via `Module.print` callback.

## Size

Target: < 500KB gzipped (js + wasm combined)

## Source

- Official: https://git.linuxtv.org/edid-decode.git
- Mirror: https://github.com/oe-mirrors/edid-decode
- Demo: https://hverkuil.home.xs4all.nl/edid-decode/edid-decode.html
