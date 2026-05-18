import serial
import json
import random
import math

from config import SERIAL_PORT, SERIAL_BAUDRATE, SIMULACION

_ser = None
_sim_t = 0.0


def _get_serial():
    global _ser
    if _ser is None and not SIMULACION:
        try:
            _ser = serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=3)
        except Exception as e:
            print(f"[hardware] No se pudo abrir puerto serial: {e}")
    return _ser


def _datos_simulados():
    global _sim_t
    _sim_t += 0.1

    ph = 7.0 + 0.6 * math.sin(_sim_t * 0.3) + random.gauss(0, 0.05)
    temp = 25.0 + 3.0 * math.sin(_sim_t * 0.15) + random.gauss(0, 0.2)
    lux = 550 + 250 * math.sin(_sim_t * 0.2) + random.gauss(0, 20)

    return {
        "ok": True,
        "data": {
            "ph":     round(ph, 3),
            "temp_c": [round(temp, 2)],
            "lux":    round(max(0, lux), 1),
        }
    }


def enviar_comando(comando):
    if SIMULACION:
        return {"ok": True}

    ser = _get_serial()
    if ser is None:
        return {"ok": False, "error": "sin puerto serial"}

    try:
        ser.write((json.dumps(comando) + "\n").encode())
        respuesta = ser.readline().decode().strip()
        if not respuesta:
            return {"ok": False, "error": "sin respuesta"}
        return json.loads(respuesta)
    except Exception as e:
        return {"ok": False, "error": str(e)}


def obtener_datos():
    if SIMULACION:
        return _datos_simulados()

    response = enviar_comando({"cmd": "read"})
    if not response.get("ok"):
        return None
    return response
