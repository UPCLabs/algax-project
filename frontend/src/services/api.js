const MOCK = true;
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const _ranges = {
  ph:    { min: 6.5,  max: 8.5   },
  temp:  { min: 20,   max: 30    },
  light: { min: 5000, max: 45000 },
  flow:  { min: 0.5,  max: 5     },
};

let _last = {};

function _simValue(key, prev) {
  const r = _ranges[key];
  const mid = (r.max + r.min) / 2;
  const range = r.max - r.min;
  const drift = (Math.random() - 0.5) * range * 0.08;
  let v = (prev ?? mid) + drift;
  if (Math.random() < 0.07) v += (Math.random() > 0.5 ? 1 : -1) * range * 0.25;
  return parseFloat(Math.max(r.min * 0.85, Math.min(r.max * 1.15, v)).toFixed(3));
}

function _mockLatest() {
  ["ph", "temp", "light", "flow"].forEach((k) => {
    _last[k] = _simValue(k, _last[k]);
  });
  return { ..._last, ts: new Date().toISOString() };
}

export async function getLatest() {
  if (MOCK) return _mockLatest();
  return fetch(`${BASE}/api/v1/sensors/latest`).then((r) => r.json());
}

export async function injectCO2(duration = 5) {
  if (MOCK) {
    console.log(`[MOCK] CMD:CO2_ON → ${duration}s`);
    return { ok: true, cmd_sent: "CMD:CO2_ON", duration };
  }
  return fetch(`${BASE}/api/v1/control/co2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "inject", duration }),
  }).then((r) => r.json());
}

export async function stopCO2() {
  if (MOCK) {
    console.log("[MOCK] CMD:CO2_OFF");
    return { ok: true, cmd_sent: "CMD:CO2_OFF" };
  }
  return fetch(`${BASE}/api/v1/control/co2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "stop" }),
  }).then((r) => r.json());
}