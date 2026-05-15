import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Activity, Thermometer, Droplets, Wind, Zap, Bell, Database,
  Terminal, Wifi, WifiOff, AlertTriangle, CheckCircle, Play,
  Square, Settings, Clock, TrendingUp, Layers
} from "lucide-react";
import { useSensors } from "./hooks/useSensors";
import { RANGES } from "./config/ranges";
import { injectCO2, stopCO2 } from "./services/api";
import RadialGauge from "./components/RadialGauge";

function SensorCard({ skey, history }) {
  const cfg = RANGES[skey];
  const Icon = cfg.icon;
  const latest = history[history.length - 1]?.[skey] ?? cfg.min;
  const ok = latest >= cfg.min && latest <= cfg.max;
  const spark = history.slice(-20).map((d, i) => ({ i, v: d[skey] }));

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0d1b2a 0%, #0a1520 100%)",
        border: `1px solid ${ok ? cfg.color + "33" : "#ff444466"}`,
        borderRadius: 16,
        padding: "20px 20px 16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: ok ? `0 0 20px ${cfg.color}0d` : "0 0 20px #ff44440d",
        transition: "all 0.4s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `${ok ? cfg.color : "#ff4444"}0a`,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Icon size={14} color={cfg.color} />
            <span
              style={{
                color: "#5a7a9a",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {cfg.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                color: cfg.color,
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "'DM Mono', monospace",
                lineHeight: 1,
              }}
            >
              {latest}
            </span>
            <span style={{ color: "#3a5060", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              {cfg.unit}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <RadialGauge
            value={latest}
            min={cfg.min * 0.85}
            max={cfg.max * 1.15}
            color={ok ? cfg.color : "#ff4444"}
            unit={cfg.unit}
            label={cfg.label}
          />
        </div>
      </div>

      <div style={{ height: 40, marginTop: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${skey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ok ? cfg.color : "#ff4444"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ok ? cfg.color : "#ff4444"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={ok ? cfg.color : "#ff4444"}
              strokeWidth={1.5}
              fill={`url(#g-${skey})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: 1, color: "#3a5060" }}>
          RANGO: {cfg.min} – {cfg.max}{cfg.unit}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 20,
            background: ok ? "#00e5ff11" : "#ff444411",
            border: `1px solid ${ok ? "#00e5ff33" : "#ff444433"}`,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: ok ? "#00e5ff" : "#ff4444",
              boxShadow: `0 0 6px ${ok ? "#00e5ff" : "#ff4444"}`,
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ fontSize: 9, color: ok ? "#00e5ff" : "#ff4444", fontFamily: "'DM Mono', monospace" }}>
            {ok ? "NORMAL" : "ALERTA"}
          </span>
        </div>
      </div>
    </div>
  );
}

function HistoryChart({ skey, history }) {
  const cfg = RANGES[skey];
  const data = history.map((d) => ({ t: d.label, v: d[skey] }));
  return (
    <div style={{ background: "#0d1b2a", borderRadius: 12, padding: "16px 20px", border: "1px solid #1a2f45" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}`,
          }}
        />
        <span style={{ color: "#7a9ab5", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 2 }}>
          {cfg.label.toUpperCase()} {cfg.unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 6" stroke="#1a2535" vertical={false} />
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "'DM Mono', monospace" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <ReferenceLine y={cfg.min} stroke={cfg.color} strokeDasharray="4 4" strokeOpacity={0.4} />
          <ReferenceLine y={cfg.max} stroke={cfg.color} strokeDasharray="4 4" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{
              background: "#0a1520",
              border: `1px solid ${cfg.color}44`,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
            }}
            itemStyle={{ color: cfg.color }}
            labelStyle={{ color: "#4a6080" }}
          />
          <Line type="monotone" dataKey="v" stroke={cfg.color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TerminalLog({ logs }) {
  return (
    <div
      style={{
        background: "#040d14",
        borderRadius: 10,
        padding: "12px 14px",
        height: 180,
        overflowY: "auto",
        border: "1px solid #0d2035",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
      }}
    >
      {logs.map((l, i) => (
        <div
          key={i}
          style={{
            marginBottom: 3,
            color:
              l.type === "error"
                ? "#ff6b6b"
                : l.type === "warn"
                  ? "#ffb347"
                  : l.type === "success"
                    ? "#7affb2"
                    : l.type === "cmd"
                      ? "#c77dff"
                      : "#3a7aaa",
          }}
        >
          <span style={{ color: "#2a4060" }}>{l.time} </span>
          {l.msg}
        </div>
      ))}
    </div>
  );
}

function CO2Panel({ co2Active, onToggle, onManualInject, autoMode, onAutoToggle }) {
  return (
    <div
      style={{
        background: "#0d1b2a",
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${co2Active ? "#c77dff44" : "#1a2f45"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Activity size={14} color="#c77dff" />
        <span
          style={{
            color: "#7a9ab5",
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: 2,
          }}
        >
          CONTROL CO₂
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: co2Active ? "#c77dff11" : "#0a1420",
          borderRadius: 8,
          marginBottom: 14,
          border: `1px solid ${co2Active ? "#c77dff33" : "#1a2535"}`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: co2Active ? "#c77dff" : "#2a3a4a",
            boxShadow: co2Active ? "0 0 12px #c77dff" : "none",
            transition: "all 0.3s",
            animation: co2Active ? "pulse 1.5s infinite" : "none",
          }}
        />
        <span style={{ color: co2Active ? "#c77dff" : "#3a5060", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          {co2Active ? "INYECCIÓN ACTIVA" : "SISTEMA EN ESPERA"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={onManualInject}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            border: "1px solid #c77dff44",
            background: "#c77dff0d",
            color: "#c77dff",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: 1,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Play size={11} /> INYECTAR
        </button>
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            border: `1px solid ${co2Active ? "#ff444444" : "#1a2f45"}`,
            background: co2Active ? "#ff44440d" : "#0a1420",
            color: co2Active ? "#ff6b6b" : "#3a5060",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Square size={11} /> {co2Active ? "DETENER" : "APAGADO"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#040d14",
          borderRadius: 8,
          border: "1px solid #0d2035",
        }}
      >
        <span style={{ color: "#4a6080", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1 }}>
          MODO AUTO (pH)
        </span>
        <div
          onClick={onAutoToggle}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            cursor: "pointer",
            position: "relative",
            transition: "all 0.3s",
            background: autoMode ? "#00e5ff" : "#1a2f45",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              left: autoMode ? 19 : 3,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.3s",
              boxShadow: autoMode ? "0 0 6px #00e5ff" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AlertsPanel({ alerts }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
      {alerts.length === 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 16,
            color: "#7affb2",
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
          }}
        >
          <CheckCircle size={14} /> Sin alertas activas
        </div>
      )}
      {alerts.map((a, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 8,
            alignItems: "center",
            background: a.resolved ? "#0a1520" : "#ff44440a",
            border: `1px solid ${a.resolved ? "#1a2535" : "#ff444433"}`,
          }}
        >
          <AlertTriangle size={13} color={a.resolved ? "#2a4060" : "#ff6b6b"} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: a.resolved ? "#3a5060" : "#ff8888", fontFamily: "'DM Mono', monospace" }}>
              {a.msg}
            </div>
            <div style={{ fontSize: 9, color: "#2a4060", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {a.time}
            </div>
          </div>
          {a.resolved && (
            <span style={{ fontSize: 9, color: "#7affb2", fontFamily: "'DM Mono', monospace" }}>RESUELTA</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [co2Active, setCo2Active] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [connected] = useState(true);
  const { history, alerts, logs, countdown, latest, activeAlerts, addLog } = useSensors();

  const handleManualInject = async () => {
    setCo2Active(true);
    addLog("[SERIAL TX] CMD:CO2_ON → Raspberry Pi Pico 2", "cmd");
    await injectCO2(5);
    setTimeout(() => {
      setCo2Active(false);
      addLog("[SERIAL TX] CMD:CO2_OFF", "cmd");
    }, 5000);
  };

  const handleCo2Toggle = async () => {
    const next = !co2Active;
    setCo2Active(next);
    if (next) await injectCO2(5);
    else await stopCO2();
    addLog(`[SERIAL TX] CMD:${next ? "CO2_ON" : "CO2_OFF"}`, "cmd");
  };

  useEffect(() => {
    if (autoMode && latest.ph > RANGES.ph.max && !co2Active) {
      setCo2Active(true);
      addLog(`[AUTO] pH alto (${latest.ph}) → inyección CO₂`, "warn");
    }
  }, [autoMode, latest.ph, co2Active, addLog]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "history", label: "Histórico", icon: TrendingUp },
    { id: "alerts", label: `Alertas${activeAlerts ? ` (${activeAlerts})` : ""}`, icon: Bell },
    { id: "control", label: "Control", icon: Settings },
    { id: "api", label: "API REST", icon: Database },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060e18",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        color: "#c5daea",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Exo+2:wght@300;400;600;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1a3050; border-radius: 2px; }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          borderBottom: "1px solid #0d2035",
          padding: "0 24px",
          background: "linear-gradient(90deg, #060e18 0%, #0a1825 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #00e5ff22, #7affb222)",
              border: "1px solid #00e5ff44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={16} color="#00e5ff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 800,
                color: "#e0f4ff",
                letterSpacing: 1,
              }}
            >
              ALGAX
            </div>
            <div style={{ fontSize: 9, color: "#2a5070", letterSpacing: 2 }}>BIOMONITOR v2.1</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#2a5070" }}>
            <Clock size={11} />
            <span style={{ fontSize: 10 }}>PRÓX. LECTURA: {countdown}s</span>
            <div style={{ width: 40, height: 2, background: "#0d2035", borderRadius: 1 }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 1,
                  background: "#00e5ff",
                  width: `${(countdown / 10) * 100}%`,
                  transition: "width 1s linear",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {connected ? <Wifi size={12} color="#7affb2" /> : <WifiOff size={12} color="#ff6b6b" />}
            <span style={{ fontSize: 9, color: connected ? "#7affb2" : "#ff6b6b" }}>
              {connected ? "SERIAL OK" : "DESCONECTADO"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #0d2035", padding: "0 24px", background: "#060e18" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const isAlert = t.id === "alerts" && activeAlerts > 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom: `2px solid ${active ? "#00e5ff" : "transparent"}`,
                color: active ? "#00e5ff" : isAlert ? "#ff6b6b" : "#3a5070",
                fontSize: 10,
                letterSpacing: 1,
                transition: "all 0.2s",
              }}
            >
              <Icon size={11} />
              {t.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 24 }}>
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {["ph", "temp", "light", "flow"].map((k) => (
                <SensorCard key={k} skey={k} history={history} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <HistoryChart skey="ph" history={history} />
              <HistoryChart skey="temp" history={history} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <HistoryChart skey="light" history={history} />
              <HistoryChart skey="flow" history={history} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Terminal size={12} color="#3a7aaa" />
                <span style={{ fontSize: 10, color: "#2a5070", letterSpacing: 2 }}>LOG SERIAL / BACKEND</span>
              </div>
              <TerminalLog logs={logs} />
            </div>
          </div>
        )}

        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {["ph", "temp", "light", "flow"].map((k) => (
              <HistoryChart key={k} skey={k} history={history} />
            ))}
          </div>
        )}

        {tab === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  padding: "10px 16px",
                  background: "#ff44440d",
                  border: "1px solid #ff444433",
                  borderRadius: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <AlertTriangle size={13} color="#ff6b6b" />
                <span style={{ color: "#ff8888", fontSize: 11 }}>{activeAlerts} ACTIVAS</span>
              </div>
              <div
                style={{
                  padding: "10px 16px",
                  background: "#7affb20d",
                  border: "1px solid #7affb233",
                  borderRadius: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <CheckCircle size={13} color="#7affb2" />
                <span style={{ color: "#7affb2", fontSize: 11 }}>{alerts.filter((a) => a.resolved).length} RESUELTAS</span>
              </div>
            </div>
            <AlertsPanel alerts={alerts} />
          </div>
        )}

        {tab === "control" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
            <CO2Panel
              co2Active={co2Active}
              onToggle={handleCo2Toggle}
              onManualInject={handleManualInject}
              autoMode={autoMode}
              onAutoToggle={() => setAutoMode((a) => !a)}
            />
            <div>
              <div style={{ fontSize: 9, color: "#2a5070", letterSpacing: 2, marginBottom: 10 }}>LOG DE COMANDOS</div>
              <TerminalLog logs={logs.filter((l) => l.type === "cmd" || l.type === "warn")} />
            </div>
          </div>
        )}

        {tab === "api" && (
          <div style={{ background: "#0d1b2a", borderRadius: 12, padding: 20, border: "1px solid #1a2f45" }}>
            <div style={{ fontSize: 11, color: "#7a9ab5", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
              Endpoints disponibles cuando el backend esté en http://localhost:8000
            </div>
            {[
              { method: "GET", path: "/api/v1/sensors/latest" },
              { method: "GET", path: "/api/v1/sensors/history?key=ph" },
              { method: "POST", path: "/api/v1/control/co2" },
              { method: "GET", path: "/api/v1/alerts" },
            ].map((e, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 12px",
                  background: "#0a1520",
                  borderRadius: 6,
                  marginBottom: 8,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                }}
              >
                <span style={{ color: e.method === "GET" ? "#7affb2" : "#ffb347", fontWeight: 700 }}>
                  {e.method}
                </span>{" "}
                <span style={{ color: "#3a7aaa" }}>{e.path}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
