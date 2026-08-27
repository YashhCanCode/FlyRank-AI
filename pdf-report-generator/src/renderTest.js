// Stage 3 checkpoint: build the report and write reports/test.pdf.
const path = require("path");
const fs = require("fs");
const { getReportData } = require("./report");
const { buildReportHtml } = require("./html");
const { renderPdf } = require("./render");

(async () => {
  fs.mkdirSync(path.join(__dirname, "..", "reports"), { recursive: true });
  const out = path.join(__dirname, "..", "reports", "test.pdf");
  await renderPdf(buildReportHtml(getReportData()), out);
  console.log("Wrote", out);
})().catch((e) => { console.error(e); process.exit(1); });
