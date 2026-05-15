import json
import select
import sys
import time

import ds18x20
import onewire
from machine import ADC, I2C, Pin

led_debug = Pin(25, Pin.OUT)
led_debug.value(1)

i2c = I2C(1, scl=Pin(15), sda=Pin(14), freq=100000)
BH1750_ADDR = 0x23
i2c.writeto(BH1750_ADDR, b"\x10")

dat = Pin(13)
ow = onewire.OneWire(dat)
ds = ds18x20.DS18X20(ow)
roms = ds.scan()

ph_adc = ADC(26)
ph_suave = None

reles = {
    "valvula": Pin(10, Pin.OPEN_DRAIN),
    "resistencia": Pin(9, Pin.OPEN_DRAIN),
}
for r in reles.values():
    r.value(1)


def leer_luz():
    try:
        data = i2c.readfrom(BH1750_ADDR, 2)
        return round((data[0] << 8 | data[1]) / 1.2, 2)
    except Exception as _:
        return None


def leer_temperaturas():
    try:
        ds.convert_temp()
        time.sleep(0.75)
        return [round(ds.read_temp(rom), 2) for rom in roms]
    except Exception as _:
        return []


def leer_ph():
    global ph_suave
    samples = []
    for _ in range(15):
        samples.append(ph_adc.read_u16())
        time.sleep(0.02)
    samples = sorted(samples)[2:-2]
    voltage = (sum(samples) / len(samples)) * 3.3 / 65535
    ph = 7 + ((1.7 - voltage) / 0.118)
    ph_suave = ph if ph_suave is None else ph_suave + 0.2 * (ph - ph_suave)
    return round(ph_suave, 3)


def activar(nombre):
    if nombre in reles:
        reles[nombre].value(0)
        return True
    return False


def desactivar(nombre):
    if nombre in reles:
        reles[nombre].value(1)
        return True
    return False


def handle_command(line):
    try:
        req = json.loads(line)

        cmd = req.get("cmd")

        if cmd == "read":
            response = {
                "ok": True,
                "data": {
                    "lux": leer_luz(),
                    "temp_c": leer_temperaturas(),
                    "ph": leer_ph(),
                },
                "relays": {k: v.value() == 0 for k, v in reles.items()},
            }

        elif cmd == "relay":
            name = req["name"]

            action = req["action"]

            ok = False

            if action == "on":
                ok = activar(name)

            elif action == "off":
                ok = desactivar(name)

            response = {"ok": ok}

        elif cmd == "ping":
            response = {"ok": True}

        else:
            response = {"ok": False, "error": "unknown"}

        print(json.dumps(response))

    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))


poll = select.poll()
poll.register(sys.stdin, select.POLLIN)

while True:
    if poll.poll(0):
        line = sys.stdin.readline()
        if line:
            handle_command(line)
    time.sleep(0.05)
