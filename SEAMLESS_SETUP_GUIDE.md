# Seamless HTML to Figma Setup Guide

## 🎯 Overview

This setup enables a **seamless workflow** where you can capture any webpage with the Chrome extension and it automatically appears in Figma - **no manual file downloads needed**!

### Workflow:
```
Chrome Extension → Handoff Server → Figma Plugin
     (Capture)      (Bridge/Store)    (Auto-Import)
```

---

## 📦 What's Been Set Up

### 1. **Handoff Server** (`handoff-server.js`)
   - Acts as a bridge between Chrome extension and Figma plugin
   - Stores the latest capture in memory
   - Runs on `http://localhost:4411`

### 2. **Modified Chrome Extension**
   - Now sends captured data to the handoff server instead of downloading
   - Falls back to download if server isn't running
   - Shows a nice notification when capture succeeds

### 3. **Updated Figma Plugin**
   - New button: "📡 Import Latest Capture"
   - Automatically fetches from handoff server
   - No need to manually select files!

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
# Install required packages for handoff server
npm install express cors
```

### Step 2: Start the Handoff Server
```bash
# From the project root
node handoff-server.js
```

You should see:
```
============================================================
🚀 Handoff Server Running
============================================================
📍 Server: http://localhost:4411
📊 Health: http://localhost:4411/api/health

📋 Instructions:
  1. Click Chrome extension to capture a page
  2. Open Figma plugin and click "Import Latest Capture"
  3. Page will be imported automatically!

============================================================
```

### Step 3: Load Chrome Extension
```bash
# Build the extension (already done, but run this if you make changes)
cd chrome-extension
npm run build
cd ..
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select: `/Users/skirk92/Downloads/html-figma-master/chrome-extension/dist`

### Step 4: Load Figma Plugin

In Figma:
1. Go to **Plugins** → **Development** → **Import plugin from manifest**
2. Select: `/Users/skirk92/Downloads/html-figma-master/manifest.json`
3. The plugin is now loaded!

---

## 🎬 Using the Seamless Workflow

### Capture & Import:

1. **Navigate to any webpage** in Chrome
2. **Click the extension icon** in your Chrome toolbar  
   → You'll see a green success notification: "✓ Captured successfully!"
3. **Open the Figma plugin** (cmd+/ then search "HTML Figma")
4. **Click "📡 Import Latest Capture"**  
   → The page imports automatically!

### That's it! No file downloads, no file selects! 🎉

---

## 🔄 Alternative: Fallback to Manual Download

If the handoff server isn't running:
- Chrome extension automatically downloads the JSON file instead
- You'll see an alert explaining this
- You can manually upload the JSON to Figma (old workflow)

---

## 🛠️ Troubleshooting

### "Handoff server not running" error

**Problem:** Figma plugin can't connect to server  
**Solution:**
```bash
# Make sure the server is running
node handoff-server.js

# Check it's working
curl http://localhost:4411/api/health
```

### "No capture available" error

**Problem:** No page has been captured yet  
**Solution:**
1. Navigate to a webpage in Chrome
2. Click the extension icon to capture
3. Try importing in Figma again

### Chrome extension downloads JSON instead

**Problem:** Extension couldn't connect to handoff server  
**Solution:**
1. Make sure handoff server is running
2. Check console for errors (F12 in Chrome)
3. Verify server is on port 4411

### Port 4411 already in use

**Problem:** Another app is using port 4411  
**Solution:**
```bash
# Kill whatever's on port 4411
lsof -ti:4411 | xargs kill -9

# Or edit the port in both:
# - handoff-server.js (line 55)
# - chrome-extension/src/inject.ts (line 3)
# - plugin/ui.tsx (line 751)
```

---

## 📖 API Endpoints

The handoff server provides these endpoints:

### `POST /api/capture`
Receives captured data from Chrome extension
```json
{
  "layers": [...],
  "url": "https://example.com",
  "title": "Page Title",
  "timestamp": 1234567890
}
```

### `GET /api/latest-capture`
Fetches the latest capture for Figma plugin
```json
{
  "id": 1,
  "timestamp": 1234567890,
  "url": "https://example.com",
  "data": { "layers": [...] }
}
```

### `GET /api/health`
Health check endpoint
```json
{
  "status": "ok",
  "hasCapture": true,
  "captureId": 1
}
```

### `DELETE /api/capture`
Clears the current capture

---

## 🔧 Development Notes

### Rebuilding After Changes

**Chrome Extension:**
```bash
cd chrome-extension
npm run build
# Then reload extension in chrome://extensions/
```

**Figma Plugin:**
```bash
npm run build
# Plugin reloads automatically in Figma
```

### Server Configuration

Default port: `4411`  
Default host: `localhost`  
Max payload: `50mb`

To change these, edit `handoff-server.js`

---

## 🎨 Customization

### Change Server Port

Edit these files:
- `handoff-server.js` (line 55): `const PORT = 4411;`
- `chrome-extension/src/inject.ts` (line 3): `const HANDOFF_SERVER = "http://localhost:4411";`
- `plugin/ui.tsx` (line 751): `const HANDOFF_SERVER = "http://localhost:4411";`

### Disable Fallback Download

In `chrome-extension/src/inject.ts`, remove the `.catch()` block if you want errors instead of fallback.

### Multi-User Support

Currently stores one capture in memory. For multi-user:
- Add user authentication
- Use Redis or database instead of memory
- Implement per-user capture storage

---

## 📊 Comparison: Before vs After

| Step | Old Workflow | New Workflow |
|------|-------------|--------------|
| 1 | Click extension | Click extension |
| 2 | **Download JSON file** | ✓ Done! (auto-sent to server) |
| 3 | Open Figma plugin | Open Figma plugin |
| 4 | **Click "Choose file"** | Click "Import Latest Capture" |
| 5 | **Find & select JSON** | ✓ Done! (auto-imported) |
| 6 | Wait for import | Wait for import |

**Saved steps: 2**  
**Time saved: ~10-15 seconds per import**

---

## ✅ Success Checklist

- [ ] Handoff server installed (`npm install express cors`)
- [ ] Handoff server running (`node handoff-server.js`)
- [ ] Chrome extension built (`cd chrome-extension && npm run build`)
- [ ] Chrome extension loaded in browser
- [ ] Figma plugin built (`npm run build`)
- [ ] Figma plugin loaded
- [ ] Test capture shows success notification
- [ ] Test import works from Figma plugin

---

## 🎉 You're All Set!

Now enjoy the seamless workflow:
1. Browse → 2. Click → 3. Import → Done! 

No more manual file management! 🚀
