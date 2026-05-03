from fastapi import FastAPI
import threading

from data_source import leer_datos_simulados
from control import evaluar_co2
from database import guardar

app = FastAPI()

ultimo_dato = {}
historial = []
co2_estado = {"activo": False}


def loop_datos():
    for datos in leer_datos_simulados():
        print("Datos:", datos)

        # guardar último dato
        ultimo_dato.update(datos)

        # historial
        historial.append(datos)
        if len(historial) > 100:
            historial.pop(0)

        # guardar en Influx
        guardar(datos)

        # lógica CO2
        accion = evaluar_co2(datos)

        if accion:
            print("Acción:", accion)
            co2_estado["activo"] = (accion == "CO2_ON")


# hilo paralelo
threading.Thread(target=loop_datos, daemon=True).start()


@app.get("/")
def home():
    return {"msg": "Backend funcionando"}


@app.get("/datos")
def obtener_datos():
    return ultimo_dato


@app.get("/historial")
def obtener_historial():
    return historial


@app.get("/estado")
def estado():
    return co2_estado


@app.post("/co2/on")
def activar_manual():
    co2_estado["activo"] = True
    return {"msg": "CO2 activado manualmente"}


@app.post("/co2/off")
def apagar_manual():
    co2_estado["activo"] = False
    return {"msg": "CO2 apagado manualmente"}
