// Run: node app/dashboard/components/AgentFields.test.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.join(__dirname, "AgentFields.tsx");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const loaded = new Module(filename, module);
loaded.paths = Module._nodeModulePaths(__dirname);
loaded.require = name => name === "./FaqEditor" ? {} : require(name);
loaded._compile(compiled, filename);
const { DEFAULT_AGENT, agentPayload, configDraft, DAYS } = loaded.exports;

const payload = agentPayload({ ...DEFAULT_AGENT, services: " Consultation \n\nFollow-up\n " });
assert.deepEqual(payload.services, [{ name: "Consultation" }, { name: "Follow-up" }]);
assert.equal("serviceMeta" in payload, false);
assert.equal(payload.take_messages, true);
assert.deepEqual(Object.keys(payload.business_hours), DAYS);
assert.deepEqual(DAYS, ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
assert.equal(payload.business_hours.sun.closed, true);
const restored = configDraft({ services: ["Consultation", { name: "Follow-up", duration_min: 30, price: 80 }], faq: [{ q: "Hours?", a: "Nine to five" }], voice_id: "custom-voice", business_hours: { monday: { open: "10:00", close: "18:00", closed: false } }, take_messages: false });
assert.equal(restored.services, "Consultation\nFollow-up");
assert.deepEqual(restored.faq, [{ question: "Hours?", answer: "Nine to five" }]);
assert.equal(restored.voice_id, "custom-voice");
assert.equal(restored.take_messages, false);
// Legacy full-name keys are read, then saved back under short keys.
assert.equal(restored.business_hours.mon.open, "10:00");
assert.equal(restored.business_hours.sun.closed, true);
assert.deepEqual(agentPayload(restored).services, [{ name: "Consultation" }, { name: "Follow-up", duration_min: 30, price: 80 }]);
console.log("Agent config serialization checks passed.");
