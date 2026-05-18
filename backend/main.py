from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from datetime import datetime
import asyncio

from config import LECTURA_INTERVALO, HISTORIAL_LIMITE
from hardware_service import obtener_datos, enviar_comando
from influx_service import guardar_datos, obtener_historial_db
from control_rules import evaluar_reglas
from websocket_manager import manager

app = FastAPI()

estado_actuadores = {
    "co2":         False,
    "led":         False,
    "resistencia": False,
}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except Exception:
        manager.disconnect(websocket)


@app.get("/historial")
def obtener_historial(limite: int = HISTORIAL_LIMITE):
    return obtener_historial_db(limite)


@app.get("/estado")
def estado():
    return estado_actuadores


def _relay(name: str, action: str):
    enviar_comando({"cmd": "relay", "name": name, "action": action})
    estado_actuadores[name] = action == "on"
    return {"ok": True}


@app.post("/co2/on")
def co2_on():
    return _relay("co2", "on")


@app.post("/co2/off")
def co2_off():
    return _relay("co2", "off")


@app.post("/led/on")
def led_on():
    return _relay("led", "on")


@app.post("/led/off")
def led_off():
    return _relay("led", "off")


@app.post("/resistencia/on")
def resistencia_on():
    return _relay("resistencia", "on")


@app.post("/resistencia/off")
def resistencia_off():
    return _relay("resistencia", "off")


# ── Inyección manual de datos (simulación / pruebas) ──────────────────────────

class DatoManual(BaseModel):
    ph:   float
    temp: float
    lux:  float


@app.post("/simulacion/dato")
async def inyectar_dato(dato: DatoManual):
    sensores = {"ph": dato.ph, "temp": dato.temp, "lux": dato.lux}

    acciones = evaluar_reglas(sensores, estado_actuadores)
    for accion in acciones:
        estado_actuadores[accion["relay"]] = accion["action"] == "on"

    payload = {
        "timestamp": datetime.now().isoformat(),
        "sensores":  sensores,
        "estado":    estado_actuadores.copy(),
    }

    guardar_datos(payload)
    await manager.broadcast(payload)
    return payload


async def loop_principal():
    while True:
        response = obtener_datos()

        if response and response.get("ok"):
            sensores = {
                "ph":   response["data"]["ph"],
                "temp": response["data"]["temp_c"][0],
                "lux":  response["data"]["lux"],
            }

            acciones = evaluar_reglas(sensores, estado_actuadores)
            for accion in acciones:
                enviar_comando({
                    "cmd":    "relay",
                    "name":   accion["relay"],
                    "action": accion["action"],
                })
                estado_actuadores[accion["relay"]] = accion["action"] == "on"

            payload = {
                "timestamp": datetime.now().isoformat(),
                "sensores":  sensores,
                "estado":    estado_actuadores.copy(),
            }

            guardar_datos(payload)
            await manager.broadcast(payload)
            print(payload)

        await asyncio.sleep(LECTURA_INTERVALO)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(loop_principal())


@app.get("/")
def home():
    return {"msg": "Algax backend funcionando"}
