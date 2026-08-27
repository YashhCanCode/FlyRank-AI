// In-memory store for reports. Restarting the API forgets everything — that's the
// same lesson as A1, not a bug. Shared by the routes and the Inngest worker
// (they run in the same process).
const reports = globalThis.__reports || (globalThis.__reports = new Map());

let seq = 0;
function createReport(topic) {
  const id = `rep_${Date.now()}_${++seq}`;
  const report = { id, topic, status: "pending", result: null, createdAt: new Date().toISOString() };
  reports.set(id, report);
  return report;
}
function saveResult(id, result) {
  const r = reports.get(id);
  if (r) { r.status = "done"; r.result = result; r.finishedAt = new Date().toISOString(); }
  return r;
}
function markFailed(id, error) {
  const r = reports.get(id);
  if (r) { r.status = "failed"; r.error = error; }
  return r;
}
function getReport(id) { return reports.get(id) || null; }
function allReports() { return [...reports.values()]; }
function counts() {
  const c = { pending: 0, done: 0, failed: 0 };
  for (const r of reports.values()) c[r.status] = (c[r.status] || 0) + 1;
  return c;
}

module.exports = { createReport, saveResult, markFailed, getReport, allReports, counts };
