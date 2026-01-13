// Simple backend server for URL import
// Install: npm install express puppeteer cors
// Run: node backend-server.js

const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/v1/url-to-figma", async (req, res) => {
  try {
    const { url, width = 1200, useFrames = false } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter required" });
    }

    console.log(`Fetching ${url} at width ${width}...`);

    // Launch headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: parseInt(width),
      height: 1080,
    });

    // Navigate to URL
    await page.goto(url, { waitUntil: "networkidle0" });

    // Inject the html-to-figma library
    // You'll need to build a browser bundle of the library
    const htmlToFigmaScript = require("fs").readFileSync(
      "./dist/browser.js",
      "utf8"
    );
    await page.addScriptTag({ content: htmlToFigmaScript });

    // Run conversion
    const layers = await page.evaluate(() => {
      // @ts-ignore - htmlToFigma is injected
      return window.htmlToFigma(document.body);
    });

    await browser.close();

    res.json({ layers });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for images (CORS workaround)
app.get("/api/v1/proxy-api", async (req, res) => {
  try {
    const { url } = req.query;
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type");

    res.set("Content-Type", contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
