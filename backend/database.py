import os
from influxdb_client import InfluxDBClient, Point, WritePrecision

URL = "http://influxdb:8086"
TOKEN = os.getenv("INFLUX_TOKEN")
ORG = os.getenv("INFLUX_ORG")
BUCKET = os.getenv("INFLUX_BUCKET")

client = InfluxDBClient(url=URL, token=TOKEN, org=ORG)
write_api = client.write_api()


def guardar(datos):
    try:
        point = Point("sensores") \
            .field("ph", float(datos["ph"])) \
            .field("temp", float(datos["temp"])) \
            .field("light", int(datos["light"])) \
            .field("flow", float(datos["flow"]))

        write_api.write(bucket=BUCKET, org=ORG, record=point)

        print("Guardado en Influx")

    except Exception as e:
        print("Error guardando:", e)
