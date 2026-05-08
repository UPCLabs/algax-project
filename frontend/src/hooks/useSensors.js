import { useState, useEffect, useCallback } from "react";
import { getLatest } from "../services/api";
import { RANGES, SENSOR_KEYS, isOk, timeLabel } from "../config/ranges";

export function useSensors() {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [countdown, setCountdown] = useState(10);

  const addLog = useCallback((msg, type = "info") => {
    const time = new Date().toLocaleTimeString("es-CO", { hour12: false });
    setLogs((prev) => [...prev.slice(-150), { msg, type, time }]);
  }, []);

  const poll = useCallback(async () => {
    try {
      const data = await getLatest();
      const reading = {
        ...data,
        label: timeLabel(new Date(data.ts)),
      };

      setHistory((h) => [...h.slice(-120), reading]);
      addLog(
        `[SERIAL RX] {ph:${data.ph}, temp:${data.temp}, light:${data.light}, flow:${data.flow}}`,
        "info"
      );
      addLog(`[INFLUXDB] Punto escrito → measurement=sensors`, "success");

      SENSOR_KEYS.forEach((k) => {
        const ok = isOk(k, data[k]);
        if (!ok) {
          const r = RANGES[k];
          const msg = `${r.label} fuera de rango: ${data[k]}${r.unit}`;
          addLog(`[ALERT] ${msg}`, "error");
          setAlerts((prev) => {
            const exists = prev.find((a) => a.key === k && !a.resolved);
            if (exists) return prev;
            return [
              ...prev,
              { id: Date.now(), key: k, msg, time: reading.label, resolved: false },
            ];
          });
        } else {
          setAlerts((prev) =>
            prev.map((a) =>
              a.key === k && !a.resolved ? { ...a, resolved: true } : a
            )
          );
        }
      });

      setCountdown(10);
    } catch (err) {
      addLog(`[ERROR] ${err.message}`, "error");
    }
  }, [addLog]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    const id = setInterval(() => setCountdown((c) => (c <= 1 ? 10 : c - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const latest = history[history.length - 1] || {};
  const activeAlerts = alerts.filter((a) => !a.resolved).length;

  return { history, alerts, logs, countdown, latest, activeAlerts, addLog };
}