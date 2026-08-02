const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const modulePath = path.join(__dirname, "..", "js", "modules", "correspondence.js");
const source = fs.readFileSync(modulePath, "utf8");
const context = vm.createContext({});
vm.runInContext(source, context, { filename: modulePath });

const allowed = ["open", "in_progress", "closed", "no_action"];
const options = JSON.parse(vm.runInContext("JSON.stringify(CORRESPONDENCE_STATUS_OPTIONS)", context));
assert.deepEqual(options, [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "closed", label: "Closed" },
  { value: "no_action", label: "No Action" },
]);

const transitions = {
  open: "in_progress",
  in_progress: "closed",
  closed: "open",
  no_action: "open",
};

for (const [current, expected] of Object.entries(transitions)) {
  const next = context.nextCorrespondenceStatus(current);
  assert.equal(next, expected, `${current} should transition to ${expected}`);
  assert.ok(allowed.includes(next), `${next} must be accepted by correspondence_status_check`);
}

for (const value of allowed) {
  assert.equal(context.normalizeCorrespondenceStatus(value), value);
}
for (const value of ["under_review", "replied", "", null, undefined]) {
  assert.equal(context.normalizeCorrespondenceStatus(value), "open");
  assert.ok(allowed.includes(context.nextCorrespondenceStatus(value)));
}

assert.doesNotMatch(source, /["']under_review["']/);
assert.doesNotMatch(source, /["']replied["']/);
assert.match(source, /status:\s*normalizeCorrespondenceStatus\(value\("#corr-status"\)\)/);
assert.match(source, /const next = nextCorrespondenceStatus\(record\.status\)/);
assert.match(source, /updateCorrespondence\(record\.id, \{ status: next \}\)/);

console.log("Correspondence status regression checks passed.");
