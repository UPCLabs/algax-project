from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

from config import INFLUX_URL, INFLUX_TOKEN, INFLUX_ORG, INFLUX_BUCKET

client = InfluxDBClient(
    url=INFLUX_URL,
    token=INFLUX_TOKEN,
    org=INFLUX_ORG
)

write_api = client.write_api(write_options=SYNCHRONOUS)
query_api = client.query_api()


def guardar_datos(payload):
    sensores = payload["sensores"]

    point = (
        Point("sensores")
        .field("ph",          sensores["ph"])
        .field("temp",        sensores["temp"])
        .field("lux",         sensores["lux"])
        .field("co2",         int(payload["estado"]["co2"]))
        .field("led",         int(payload["estado"]["led"]))
        .field("resistencia", int(payload["estado"]["resistencia"]))
    )

    write_api.write(
        bucket=INFLUX_BUCKET,
        org=INFLUX_ORG,
        record=point
    )


def obtener_historial_db(limite: int = 500):
    query = f"""
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "sensores")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
      |> tail(n: {limite})
    """

    try:
        tables = query_api.query(query, org=INFLUX_ORG)
        resultado = []

        for table in tables:
            for record in table.records:
                resultado.append({
                    "timestamp": record.get_time().isoformat(),
                    "sensores": {
                        "ph":   record.values.get("ph"),
                        "temp": record.values.get("temp"),
                        "lux":  record.values.get("lux"),
                    },
                    "estado": {
                        "co2":         bool(record.values.get("co2")),
                        "led":         bool(record.values.get("led")),
                        "resistencia": bool(record.values.get("resistencia")),
                    }
                })

        return resultado

    except Exception as e:
        print(f"[influx] Error al consultar historial: {e}")
        return []
