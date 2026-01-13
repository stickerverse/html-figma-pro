# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a bidirectional HTML <-> Figma converter consisting of three main components:
1. **Core library** (`lib/`) - Conversion logic for HTML→Figma and Figma→code
2. **Figma plugin** (`plugin/`) - Figma UI and plugin code for importing/exporting within Figma
3. **Chrome extension** (`chrome-extension/`) - Captures live pages from browser

## Project Structure

```
├── lib/                    # Core conversion library
│   ├── html-to-figma.ts   # Main HTML → Figma conversion logic
│   └── figma-to-code.ts   # Figma → code generation logic
├── plugin/                 # Figma plugin code
│   ├── code.ts            # Plugin backend (runs in Figma context)
│   ├── ui.tsx             # Plugin UI (React)
│   └── functions/         # Utilities (traverse-layers, fast-clone, etc)
├── chrome-extension/       # Chrome extension for capturing live pages
│   └── src/
│       ├── background.ts   # Extension background script
│       ├── inject.ts      # Page content injection
│       └── popup/         # Extension UI
└── shared/                # Shared types between plugin and lib
```

## Development Commands

### Root Project (Figma Plugin + Library)

```bash
# Development (watch mode)
npm run dev              # Webpack watch for plugin UI/code
npm run dev:lib          # TypeScript watch for library

# Build
npm run build            # Production build (compiles TS + webpack)

# Release
npm run release:patch    # Bump patch version, build, and publish
npm run release:dev      # Prerelease version with dev tag
```

### Chrome Extension

```bash
cd chrome-extension

# Development
npm run dev              # Build once
npm run watch            # Watch mode for development

# Build
npm run build            # Production build (minified)

# Lint
npm run lint             # TSLint check
```

## Build System Architecture

### Webpack Configuration (`webpack.config.js`)

Three separate build outputs:

1. **Figma Plugin** - UI and code bundles
   - Entry: `plugin/ui.tsx` → `dist/ui.html` (inlined JS)
   - Entry: `plugin/code.ts` → `dist/code.js`

2. **Browser Bundle** - For use in web contexts
   - Entry: `lib/html-to-figma.ts` → `dist/browser.js` (var library)

3. **CommonJS Bundle** - For npm package
   - Entry: `lib/html-to-figma.ts` → `dist/main.js` (commonjs)

**Environment Variables Required:**
- `NODE_ENV` - development or production
- `API_ROOT` - (optional) API endpoint
- `API_KEY` - (optional) API key

### TypeScript Configuration

- Target: ES6
- JSX: React
- Strict mode: disabled (legacy codebase)
- Output: `dist/` directory
- Excludes: `chrome-extension/` (has separate tsconfig)

## Key Architecture Patterns

### HTML → Figma Conversion Flow

1. **Input**: DOM element or selector string
2. **Process**: `lib/html-to-figma.ts`
   - Traverses DOM tree
   - Computes bounding boxes and aggregate rectangles
   - Maps CSS properties to Figma node properties
   - Handles fonts via font matching system
3. **Output**: Figma-compatible layer objects

### Figma → Code Flow

1. **Input**: Figma node tree (from plugin selection)
2. **Process**: `lib/figma-to-code.ts`
   - Analyzes node hierarchy and constraints
   - Detects component types (row, stack, columns, grid, canvas)
   - Determines size types (shrink, expand, fixed)
   - Type guards: `isTextNode`, `isRectangleNode`, `isFrameNode`, etc.
3. **Output**: Builder.io-compatible element structure

### Plugin Communication Pattern

The Figma plugin uses message passing between UI and code contexts:

- **UI → Code**: `parent.postMessage()` sends commands
- **Code → UI**: `figma.ui.postMessage()` sends data/events
- **Selection sync**: `figma.on("selectionchange")` triggers serialization

Key message types in `plugin/code.ts`:
- `selectionChange` - Updates UI with current selection
- Image processing via `figma.createImage()` and hash-based caching

### Font Handling

Font matching system in `plugin/code.ts`:
- Normalizes font family names (strips non-alphanumeric)
- Searches available Figma fonts for matches
- Falls back to default: Roboto Regular
- Caches loaded fonts to avoid repeated `figma.loadFontAsync()` calls

## Testing and Debugging

No formal test suite exists. Manual testing workflow:

1. **For plugin**: Load in Figma via manifest.json pointing to `dist/code.js` and `dist/ui.html`
2. **For extension**: Load unpacked extension from `chrome-extension/dist/` in Chrome
3. **For library**: Test via integration in consuming projects

## Known Limitations

From README.md:
- Not all element types supported (iframe, pseudo-elements)
- Partial CSS property support
- Limited media types (no video, animated gifs)
- Fonts must exist in Figma or fallback is used
- Best-effort conversion (90% accuracy goal)

## Development Notes

- MobX used for state management in UI components
- Material-UI components for plugin/extension UI
- Plugin uses Figma Plugin API v1.0.0
- Chrome extension captures page state and downloads as JSON for plugin upload
