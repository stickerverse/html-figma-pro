# URL Import Setup Guide

## Overview

The HTML to Figma plugin has **two methods** for importing HTML:

1. **Chrome Extension** (✅ Recommended - No setup needed)
2. **URL Import** (Requires backend server setup)

---

## Method 1: Chrome Extension (Recommended) ✅

### Why Use This?
- ✅ No backend server needed
- ✅ Works with authenticated pages
- ✅ Captures pages in specific states
- ✅ Already built and ready to use

### Setup Steps

1. **Load the Chrome Extension:**
   ```bash
   # The extension is already built at:
   /Users/skirk92/Downloads/html-figma-master/chrome-extension/dist
   ```

2. **Install in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the folder: `chrome-extension/dist`

3. **Use the Extension:**
   - Navigate to any webpage you want to import
   - Click the "HTML ↔ Figma" extension icon in Chrome toolbar
   - The extension will capture the page and download a JSON file
   - Open the Figma plugin and upload the JSON file

---

## Method 2: URL Import (Requires Backend)

### Why This Method Needs a Backend

The URL import feature cannot run directly in the Figma plugin because:
- Figma plugins are sandboxed and can't make arbitrary web requests
- You need a headless browser to properly render and capture web pages
- CORS restrictions prevent direct access to external sites

### Required Backend Server

The plugin expects a backend server running at `http://localhost:4000` with these endpoints:

#### 1. Main Endpoint: `/api/v1/url-to-figma`
**Purpose:** Converts a URL to Figma layers

**Parameters:**
- `url` - The URL to import (required)
- `width` - Viewport width in pixels (default: 1200)
- `useFrames` - Whether to use frames (default: false)

**Returns:**
```json
{
  "layers": [/* Figma layer objects */]
}
```

#### 2. Proxy Endpoint: `/api/v1/proxy-api`
**Purpose:** Proxies image requests to avoid CORS issues

**Parameters:**
- `url` - Image URL to fetch

**Returns:** Raw image data with appropriate Content-Type header

### Backend Implementation Options

#### Option A: Use the Example Server

I've created an example backend server for you: `backend-server-example.js`

**Setup:**
```bash
# 1. Install dependencies
npm install express puppeteer cors

# 2. Run the server
node backend-server-example.js
```

**Important:** The example server requires the browser bundle of the html-to-figma library. You may need to adjust the script path or bundle configuration.

#### Option B: Build Your Own

If you want to build your own backend, it needs to:

1. Accept URL requests
2. Launch a headless browser (Puppeteer, Playwright, etc.)
3. Navigate to the URL with specified viewport width
4. Inject the `html-to-figma` library
5. Run the conversion: `htmlToFigma(document.body)`
6. Return the resulting layers as JSON

---

## Comparison

| Feature | Chrome Extension | URL Import |
|---------|-----------------|------------|
| Setup Required | ✅ None | ❌ Backend server needed |
| Auth Pages | ✅ Supported | ❌ Difficult |
| Real-time State | ✅ Captures current state | ❌ Only initial load |
| Javascript | ✅ Fully executed | ⚠️ Depends on implementation |
| Speed | ✅ Instant | ⚠️ 5-10 seconds |

---

## Recommendation

**For most use cases, use the Chrome Extension.** It's simpler, more flexible, and already working.

Only build a backend server if you specifically need:
- Automated batch processing of multiple URLs
- Integration with CI/CD pipelines
- Server-side rendering without browser extension
- API-based workflow

---

## Testing the Setup

### For Chrome Extension:
1. Load extension in Chrome
2. Navigate to `https://google.com`
3. Click extension icon
4. Check that JSON file downloads
5. Open Figma plugin and import the JSON

### For Backend Server:
1. Start the backend server
2. Open Figma plugin
3. Enter a URL (e.g., `https://google.com`)
4. Set viewport width (e.g., `1200`)
5. Click "Import from URL"
6. Layers should appear in Figma

---

## Troubleshooting

### Chrome Extension Issues

**Extension not showing:**
- Make sure Developer mode is enabled
- Check that you selected the correct `dist` folder
- Look for errors in `chrome://extensions/`

**JSON not downloading:**
- Check browser console for errors (F12)
- Make sure you're on a valid webpage
- Try a simpler page first (like google.com)

### Backend Server Issues

**Server won't start:**
- Check that port 4000 is available
- Ensure all npm dependencies are installed
- Look for error messages in terminal

**Import fails:**
- Check server logs for errors
- Verify the URL is accessible
- Check that browser bundle exists at expected path
- Ensure puppeteer can launch (may need additional dependencies on Linux)

**CORS errors:**
- Make sure the proxy endpoint is working
- Check that CORS is enabled on the server
- Verify response headers

---

## Next Steps

1. **Recommended:** Load the Chrome extension and try importing a page
2. **Optional:** If you need backend functionality, set up the example server
3. Test both import methods to see which fits your workflow better

For questions or issues, check the console logs in both Figma and Chrome DevTools.
