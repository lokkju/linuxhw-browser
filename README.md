# LinuxHW Browser

Web components for browsing EDID (Extended Display Identification Data) from the [LinuxHW Dataset](https://github.com/lokkju/linuxhw-datasets).

## Features

- Browse 140,000+ EDIDs from real displays
- Search by vendor, product, PNP code, screen size, or path
- Decode and visualize EDID binary data
- View display characteristics (resolution, timing, color depth)
- Works entirely in the browser (no server required)

## Installation

```bash
npm install linuxhw-browser
```

Or use via CDN:

```html
<script type="module">
  import 'https://esm.run/linuxhw-browser';
</script>
```

## Usage

### Full Browser Application

```html
<script type="module">
  import 'linuxhw-browser';
</script>

<edid-browser data-base-url="https://raw.githubusercontent.com/lokkju/linuxhw-datasets/main/data/"></edid-browser>
```

### Standalone EDID Viewer

The `<edid-viewer>` component can be used independently to display any EDID data:

```html
<script type="module">
  import 'linuxhw-browser/edid-viewer.js';
</script>

<edid-viewer id="viewer"></edid-viewer>

<script type="module">
  const viewer = document.querySelector('#viewer');
  viewer.edidData = new Uint8Array([/* EDID bytes */]);
  viewer.hash = '00FF1234ABCD';
</script>
```

### Programmatic EDID Decoding

Use the decoder directly without any UI:

```javascript
import { decodeEdid } from 'linuxhw-browser';

const edidBytes = new Uint8Array([/* 128+ bytes */]);
const decoded = decodeEdid(edidBytes);

console.log(decoded.manufacturerId); // e.g., "SAM"
console.log(decoded.monitorName);    // e.g., "SyncMaster"
console.log(decoded.preferredResolution); // { width: 1920, height: 1080, ... }
```

### Selective Imports

Import only what you need:

```javascript
// Just the viewer component
import 'linuxhw-browser/edid-viewer.js';

// Just the decoder utilities
import { decodeEdid, EdidDecoder } from 'linuxhw-browser/edid-decoder.js';

// Data loaders for RoaringBuckets format
import { BucketLoader, IndexLoader } from 'linuxhw-browser';
```

## Components

| Component | Tag Name | Description |
|-----------|----------|-------------|
| EdidBrowser | `<edid-browser>` | Full application with search and viewer |
| EdidViewer | `<edid-viewer>` | Standalone EDID display viewer |
| EdidSelector | `<edid-selector>` | Search interface component |
| EdidDetail | `<edid-detail>` | Detail panel wrapper |

## Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/lokkju/linuxhw-browser.git
cd linuxhw-browser

# Serve with any static file server
python -m http.server 8080
# or
npx serve .
```

Then open http://localhost:8080 in your browser.

## Data Format

The browser reads RoaringBuckets format files. Generate data using [linuxhw-datasets](https://github.com/lokkju/linuxhw-datasets):

```bash
uv run edid-build generate
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Related Projects

- [linuxhw-datasets](https://github.com/lokkju/linuxhw-datasets) - Dataset generation and DuckLake storage
- [linuxhw/EDID](https://github.com/linuxhw/EDID) - Original EDID collection

## License

Dual licensed under your choice of:

- [Polyform Shield 1.0.0](LICENSE) - Permissive with non-compete clause
- [AGPL-3.0-or-later](LICENSE-AGPL) - Open source copyleft
