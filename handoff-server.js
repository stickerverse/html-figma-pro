// Simple handoff server for Chrome Extension -> Figma Plugin communication
// This eliminates the need to manually download/upload JSON files
//
// Install: npm install express cors
// Run: node handoff-server.js

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Allow large JSON payloads

// Store the latest capture in memory (for single-user development)
// For production, you'd want Redis or a database
let latestCapture = null;
let captureId = 0;

// Endpoint for Chrome extension to POST captured data
app.post("/api/capture", (req, res) => {
  const data = req.body;

  if (!data || !data.layers) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  captureId++;
  latestCapture = {
    id: captureId,
    timestamp: Date.now(),
    data: data,
    url: data.url || "unknown",
  };

  console.log(`✅ Received capture #${captureId} from ${latestCapture.url}`);
  console.log(`   Layers: ${data.layers.length}`);

  res.json({
    success: true,
    id: captureId,
    message: "Capture received. Open Figma plugin to import.",
  });
});

// Endpoint for Figma plugin to GET the latest capture
app.get("/api/latest-capture", (req, res) => {
  if (!latestCapture) {
    return res.status(404).json({
      error: "No capture available",
      message: "Use the Chrome extension to capture a page first",
    });
  }

  console.log(`📤 Sending capture #${latestCapture.id} to Figma plugin`);

  res.json({
    id: latestCapture.id,
    timestamp: latestCapture.timestamp,
    url: latestCapture.url,
    data: latestCapture.data,
  });

  // Optionally clear after sending
  // latestCapture = null;
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasCapture: !!latestCapture,
    captureId: latestCapture?.id || null,
  });
});

// Clear endpoint (optional)
app.delete("/api/capture", (req, res) => {
  latestCapture = null;
  console.log("🗑️  Capture cleared");
  res.json({ success: true });
});

const PORT = process.env.PORT || 4411;

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Handoff Server Running");
  console.log("=".repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log("\n📋 Instructions:");
  console.log("  1. Click Chrome extension to capture a page");
  console.log('  2. Open Figma plugin and click "Import Latest Capture"');
  console.log("  3. Page will be imported automatically!\n");
  console.log("=".repeat(60) + "\n");
});
