"""Simple MQTT test to debug connection issues."""

import paho.mqtt.client as mqtt
import time
import random
import string

BROKER = "aalsdb.kaist.ac.kr"
PORT = 1883

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}", flush=True)
    client.subscribe("xiot/#", qos=0)
    print("Subscribed to xiot/#", flush=True)

def on_disconnect(client, userdata, rc):
    print(f"Disconnected with result code {rc}", flush=True)

def on_message(client, userdata, msg):
    print(f"Message: {msg.topic} -> {msg.payload.decode()}", flush=True)

# Random client ID
client_id = "xiot-" + ''.join(random.choices(string.ascii_lowercase, k=8))
print(f"Client ID: {client_id}", flush=True)

# Use clean session
client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION1,
    client_id=client_id,
    clean_session=True,
    protocol=mqtt.MQTTv311
)
client.on_connect = on_connect
client.on_disconnect = on_disconnect
client.on_message = on_message

print(f"Connecting to {BROKER}:{PORT}...", flush=True)
client.connect(BROKER, PORT, keepalive=60)

print("Starting loop...", flush=True)
client.loop_forever()
