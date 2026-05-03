import time
import random

MODO = "simulado"  # luego cambias a "serial"


def leer_datos_simulados():
    while True:
        datos = {
            "ph": round(random.uniform(6.0, 8.5), 2),
            "temp": round(random.uniform(20, 30), 2),
            "light": random.randint(100, 500),
            "flow": round(random.uniform(0.5, 2.0), 2)
        }

        yield datos
        time.sleep(2)
