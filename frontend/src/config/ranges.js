import { Droplets, Thermometer, Zap, Wind } from "lucide-react";

export const RANGES = {
  ph: {
    min: 6.5, max: 8.5,
    unit: "", label: "pH",
    color: "#00e5ff", icon: Droplets,
  },
  temp: {
    min: 20, max: 30,
    unit: "°C", label: "Temperatura",
    color: "#ffb347", icon: Thermometer,
  },
  light: {
    min: 5000, max: 45000,
    unit: " lux", label: "Luz",
    color: "#f9ff4b", icon: Zap,
  },
  flow: {
    min: 0.5, max: 5,
    unit: " L/m", label: "Caudal",
    color: "#7affb2", icon: Wind,
  },
};

export const SENSOR_KEYS = Object.keys(RANGES);

export function isOk(key, value) {
  return value >= RANGES[key].min && value <= RANGES[key].max;
}

export function timeLabel(date) {
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}