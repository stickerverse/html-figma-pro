# 🚀 Seamless HTML to Figma - Quick Start

## One-Command Setup

```bash
./start.sh
```

That's it! This will:
- ✅ Check dependencies
- ✅ Build everything if needed  
- ✅ Start the handoff server

---

## What This Does

**Enables seamless webpage capture:**

1. **Click** Chrome extension on any page
2. **Open** Figma plugin
3. **Click** "Import Latest Capture"  
→ **Done!** No file downloads/uploads needed!

---

## Setup Steps

### 1. Start the Server
```bash
./start.sh
```

### 2. Load Chrome Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension/dist` folder

### 3. Load Figma Plugin
1. In Figma: **Plugins** → **Development** → **Import plugin from manifest**
2. Select `manifest.json` from this directory

---

## Usage

1. Navigate to any webpage in Chrome
2. Click the extension icon → See success notification ✓
3. Open Figma plugin (cmd+/)
4. Click "📡 Import Latest Capture"
5. Done! Page imports automatically

---

## Files Created/Modified

### New Files:
- `handoff-server.js` - Bridge server between extension and plugin
- `start.sh` - One-command startup script
- `SEAMLESS_SETUP_GUIDE.md` - Detailed documentation

### Modified Files:
- `chrome-extension/src/inject.ts` - Sends to server instead of downloading
- `plugin/ui.tsx` - Added "Import Latest Capture" button

---

## Troubleshooting

**Server won't start:**
```bash
npm install express cors
./start.sh
```

**Extension not capturing:**
- Check server is running
- Look for green success notification
- Check browser console (F12)

**Plugin import fails:**
- Make sure server is running (`./start.sh`)
- Capture a page with extension first
- Check Figma console for errors

---

## Documentation

- **Quick Setup:** This file
- **Detailed Guide:** `SEAMLESS_SETUP_GUIDE.md`
- **Server Code:** `handoff-server.js`

---

## Architecture

```
┌─────────────────┐
│ Chrome Browser  │
│   Extension     │ Captures page → JSON
└────────┬────────┘
         │ HTTP POST
         ↓
┌─────────────────┐
│ Handoff Server  │ Port 4411
│  (Local)        │ Stores latest capture
└────────┬────────┘
         │ HTTP GET
         ↓
┌─────────────────┐
│ Figma Plugin    │
│  (Auto-import)  │ Creates layers
└─────────────────┘
```

---

## Benefits

✅ No manual file downloads  
✅ No manual file selection  
✅ One-click import  
✅ Automatic synchronization  
✅ Works offline (with fallback)  
✅ Simple localhost server  

---

## Next Steps

After setup:
1. Try capturing simple pages first (google.com)
2. Test complex pages with images
3. Experiment with different viewport widths
4. Check out the detailed guide for advanced features

**Happy designing! 🎨**
