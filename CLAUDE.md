# LinuxHW Browser

Web-based EDID browser built with Lit web components.

## Project Structure

```
linuxhw-browser/
├── index.html          # Entry point (ESM import maps, no build)
├── style.css           # Global CSS with variables
├── test-e2e.mjs        # End-to-end tests
└── src/
    ├── edid-browser.js     # Main component (layout, coordination)
    ├── edid-selector.js    # Search interface
    ├── edid-detail.js      # Detail view panel
    ├── edid-decoder.js     # EDID binary format decoder
    ├── edid-viewer.js      # Display properties visualization
    ├── edid-utils.js       # Utility functions
    ├── index-loader.js     # Loads .idx roaring bitmap indexes
    ├── bucket-loader.js    # Loads .bin bucket files
    ├── roaring.js          # Roaring bitmap decoder
    ├── search-tabs.js      # Tab navigation
    └── results-table.js    # Virtualized results list
```

## Development

No build step required. Just serve the directory:

```bash
python -m http.server 8080
```

## Data Format

Reads RoaringBuckets format from `data-base-url`:
- `buckets/00.bin` through `ff.bin` - 256 bucket files
- `metadata/vendors.idx`, `products.idx`, etc. - Search indexes
- `manifest.json` - Dataset metadata

See [linuxhw-datasets ROARING_BUCKETS.md](https://github.com/lokkju/linuxhw-datasets/blob/main/docs/ROARING_BUCKETS.md) for format details.

## Key Components

### edid-browser.js
Main wrapper handling responsive layout and component coordination.

### edid-decoder.js
Parses raw EDID binary (128-512 bytes) into structured data:
- Manufacturer ID, product code, serial
- Display descriptors, timing modes
- EDID extensions (CEA, DisplayID)

### bucket-loader.js
Loads bucket v4 format files with per-entry vendor names.

### roaring.js
Decodes serialized Roaring bitmaps for search indexes.

## CSS Variables (Theme)

Components require these CSS custom properties defined in `:root` (see `style.css`):

```css
/* Typography */
--font-base: system-ui, -apple-system, sans-serif;
--font-mono: ui-monospace, monospace;

/* Base colors */
--color-bg: #1a1a2e;
--color-surface: #16213e;
--color-primary: #0f3460;
--color-accent: #e94560;
--color-text: #eee;
--color-text-muted: #888;
--color-border: #2a2a4e;

/* Status colors */
--color-success: #4ade80;
--color-warning: #fbbf24;

/* Overlay/transparency colors */
--color-overlay-light: rgba(255, 255, 255, 0.08);
--color-overlay-medium: rgba(255, 255, 255, 0.1);
--color-overlay-dark: rgba(0, 0, 0, 0.2);
--color-overlay-heavy: rgba(0, 0, 0, 0.5);

--radius: 4px;
```

CSS variables inherit through Shadow DOM, so defining them in `:root` makes them available to all components.

## Dependencies

External (loaded via CDN):
- `lit@3` - Web components framework
- `roaring-wasm@1` - Roaring bitmap operations

## License

Polyform Shield 1.0.0
