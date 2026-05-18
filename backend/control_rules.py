def evaluar_reglas(sensores, estado_actuadores):

    acciones = []

    ph = sensores["ph"]
    temp = sensores["temp"]
    lux = sensores["lux"]

    if ph > 7.5 and not estado_actuadores["co2"]:

        acciones.append({
            "relay": "co2",
            "action": "on"
        })

    elif ph < 6.5 and estado_actuadores["co2"]:

        acciones.append({
            "relay": "co2",
            "action": "off"
        })

    if temp < 22 and not estado_actuadores["resistencia"]:

        acciones.append({
            "relay": "resistencia",
            "action": "on"
        })

    elif temp > 28 and estado_actuadores["resistencia"]:

        acciones.append({
            "relay": "resistencia",
            "action": "off"
        })

    if lux < 300 and not estado_actuadores["led"]:

        acciones.append({
            "relay": "led",
            "action": "on"
        })

    elif lux > 800 and estado_actuadores["led"]:

        acciones.append({
            "relay": "led",
            "action": "off"
        })

    return acciones
