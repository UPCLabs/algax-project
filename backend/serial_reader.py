"""Lectura real desde Raspberry por serial"""

import serial


def parsear_datos(linea):
    datos = {}
    partes = linea.split(",")

    for parte in partes:
        clave, valor = parte.split("=")
        datos[clave] = float(valor)

    return datos


def leer_datos_serial():
    ser = serial.Serial('/dev/ttyUSB0', 9600)

    while True:
        line = ser.readline().decode().strip()

        try:
            datos = parsear_datos(line)
            yield datos
        except:
            print("Error parseando:", line)
