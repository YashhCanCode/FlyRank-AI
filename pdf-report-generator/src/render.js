// Renders an HTML string to a PDF file using headless Chromium (Playwright).
const { chromium } = require("playwright");

async function renderPdf(html, outPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({ path: outPath, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
  return outPath;
}

module.exports = { renderPdf };
