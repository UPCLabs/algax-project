import serial


def leer_serial():
    ser = serial.Serial('COM3', 9600)

    while True:
        line = ser.readline().decode().strip()
        print("Dato recibido:", line)
