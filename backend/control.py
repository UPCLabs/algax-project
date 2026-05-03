co2_activo = False


def evaluar_co2(datos):
    global co2_activo

    ph = datos["ph"]
    accion = None

    if ph > 7.5 and not co2_activo:
        co2_activo = True
        accion = "CO2_ON"

    elif ph < 6.5 and co2_activo:
        co2_activo = False
        accion = "CO2_OFF"

    return accion
