import os

INFLUX_URL = os.getenv("INFLUX_URL", "http://influxdb:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")

LECTURA_INTERVALO = int(os.getenv("LECTURA_INTERVALO", "10"))
HISTORIAL_LIMITE = int(os.getenv("HISTORIAL_LIMITE", "500"))

SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyACM0")
SERIAL_BAUDRATE = 115200

SIMULACION = os.getenv("SIMULACION", "false").lower() == "true"
