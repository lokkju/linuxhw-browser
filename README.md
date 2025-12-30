# LinuxHW Browser

A web-based browser for exploring EDID (Extended Display Identification Data) from the [LinuxHW Dataset](https://github.com/lokkju/linuxhw-datasets).

## Features

- Browse 140,000+ EDIDs from real displays
- Search by vendor, product, PNP code, screen size, or path
- Decode and visualize EDID binary data
- View display characteristics (resolution, timing, color depth)
- Works entirely in the browser (no server required)

## Quick Start

### Option 1: Use hosted version

Visit the [live demo](https://lokkju.github.io/linuxhw-browser/) (coming soon)

### Option 2: Run locally

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

### Data Source

The browser reads RoaringBuckets format files from a data directory. Configure the data location:

```html
<edid-browser data-base-url="./data/"></edid-browser>
```

Generate data files using [linuxhw-datasets](https://github.com/lokkju/linuxhw-datasets):
```bash
uv run edid-build generate
```

## Technology Stack

- **[Lit](https://lit.dev/)** - Lightweight web components library
- **[RoaringBitmaps](https://roaringbitmap.org/)** - Compressed bitmap indexes for fast search
- **Pure ESM** - No build step required, uses browser-native import maps

## Project Structure

```
linuxhw-browser/
├── index.html          # Entry point with import maps
├── style.css           # Global styles
├── test-e2e.mjs        # End-to-end tests
└── src/
    ├── edid-browser.js     # Main wrapper component
    ├── edid-selector.js    # Search interface
    ├── edid-detail.js      # Detail view panel
    ├── edid-decoder.js     # EDID binary parser
    ├── edid-viewer.js      # Display properties viewer
    ├── edid-utils.js       # Utility functions
    ├── index-loader.js     # RoaringBuckets index loader
    ├── bucket-loader.js    # Bucket data loader
    ├── roaring.js          # Roaring bitmap decoder
    ├── search-tabs.js      # Search tab UI
    └── results-table.js    # Virtualized results list
```

## Related Projects

- [linuxhw-datasets](https://github.com/lokkju/linuxhw-datasets) - Dataset generation and DuckLake storage
- [linuxhw/EDID](https://github.com/linuxhw/EDID) - Original EDID collection

## License

[Polyform Shield 1.0.0](LICENSE)
