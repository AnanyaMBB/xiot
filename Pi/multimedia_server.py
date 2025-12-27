#!/usr/bin/env python3
"""
XIOT Unified Multimedia Server for Raspberry Pi

This server handles:
1. Video streaming (MJPEG) - HTTP endpoint /video
2. Audio from Pi to Interface (MP3 stream) - HTTP endpoint /audio
3. Audio from Interface to Pi (WebM via WebSocket) - WS endpoint /ws/audio
4. LCD display commands via MQTT - Subscribe to lcd/display topic
5. Sensor data publishing via MQTT

Requirements:
    pip install aiohttp paho-mqtt Pillow numpy spidev gpiozero

Run with:
    python multimedia_server.py
"""

import asyncio
import json
import subprocess
import sys
import time
import threading
import signal
from datetime import datetime

# Web server
from aiohttp import web

# MQTT
import paho.mqtt.client as mqtt

# Check if running on Pi (for hardware features)
try:
    import spidev
    import smbus2
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    from gpiozero import DigitalOutputDevice, PWMOutputDevice
    ON_PI = True
except ImportError:
    ON_PI = False
    smbus2 = None
    print("[WARN] Not running on Pi or missing dependencies - LCD/I2C features disabled")


# =============================================================================
# CONFIGURATION
# =============================================================================

# Server ports
HTTP_PORT = 8080

# MQTT Configuration
MQTT_BROKER = "aalsdb.kaist.ac.kr"  # Your MQTT broker
MQTT_PORT = 1883
MQTT_LCD_TOPIC = "lcd/display"
MQTT_SENSOR_TOPIC = "xiot/PI-001/sensors"
MQTT_ACTUATOR_TOPIC = "xiot/PI-001/actuators"
MQTT_DISCOVERY_TOPIC = "xiot/PI-001/discover"  # Trigger device discovery

# I2C Configuration
I2C_BUS = 1

# Audio device (find with: arecord -l)
MIC_DEVICE = "plughw:3,0"  # Adjust based on your setup

# LCD GPIO pins
RST_PIN = 22
DC_PIN = 25
BL_PIN = 24


# =============================================================================
# LCD DRIVER (2-inch SPI LCD)
# =============================================================================

class LCD_2Inch:
    """Driver for 2-inch SPI LCD display (ST7789)"""
    
    def __init__(self):
        if not ON_PI:
            return
            
        self.dc = DigitalOutputDevice(DC_PIN, active_high=True, initial_value=False)
        self.rst = DigitalOutputDevice(RST_PIN, active_high=True, initial_value=False)
        self.bl = PWMOutputDevice(BL_PIN, frequency=1000)
        self.bl.value = 0.9

        self.bus = 0
        self.dev = 0
        self.spi_speed = 8000000
        self.spi = spidev.SpiDev()
        self.spi.open(self.bus, self.dev)
        self.spi.max_speed_hz = self.spi_speed
        self.spi.mode = 0b00

        self.w = 240
        self.h = 320

    def write_cmd(self, cmd):
        self.dc.off()
        self.spi.writebytes([cmd])

    def write_data(self, value):
        self.dc.on()
        self.spi.writebytes([value])

    def reset(self):
        self.rst.on()
        time.sleep(0.01)
        self.rst.off()
        time.sleep(0.01)
        self.rst.on()
        time.sleep(0.01)

    def lcd_init(self):
        self.reset()
        self.write_cmd(0x36); self.write_data(0x00)
        self.write_cmd(0x3A); self.write_data(0x05)
        self.write_cmd(0x21)
        self.write_cmd(0x2A)
        self.write_data(0x00); self.write_data(0x00)
        self.write_data(0x01); self.write_data(0x3F)
        self.write_cmd(0x2B)
        self.write_data(0x00); self.write_data(0x00)
        self.write_data(0x00); self.write_data(0xEF)
        self.write_cmd(0xB2)
        for x in [0x0C, 0x0C, 0x00, 0x33, 0x33]:
            self.write_data(x)
        self.write_cmd(0xB7); self.write_data(0x35)
        self.write_cmd(0xBB); self.write_data(0x1F)
        self.write_cmd(0xC0); self.write_data(0x2C)
        self.write_cmd(0xC2); self.write_data(0x01)
        self.write_cmd(0xC3); self.write_data(0x12)
        self.write_cmd(0xC4); self.write_data(0x20)
        self.write_cmd(0xC6); self.write_data(0x0F)
        self.write_cmd(0xD0)
        self.write_data(0xA4); self.write_data(0xA1)
        self.write_cmd(0x11)
        self.write_cmd(0x29)

    def set_windows(self, sx, sy, ex, ey):
        self.write_cmd(0x2A)
        self.write_data(sx >> 8); self.write_data(sx & 0xff)
        self.write_data(ex >> 8); self.write_data((ex - 1) & 0xff)
        self.write_cmd(0x2B)
        self.write_data(sy >> 8); self.write_data(sy & 0xff)
        self.write_data(ey >> 8); self.write_data((ey - 1) & 0xff)
        self.write_cmd(0x2C)

    def img_show(self, img):
        image = np.asarray(img)
        pixel = np.zeros((self.w, self.h, 2), dtype=np.uint8)
        pixel[..., 0] = np.add(np.bitwise_and(image[..., 0], 0xf8), np.right_shift(image[..., 1], 5))
        pixel[..., 1] = np.add(np.bitwise_and(np.left_shift(image[..., 1], 3), 0xe0), np.right_shift(image[..., 2], 3))
        pixel = pixel.flatten().tolist()

        self.write_cmd(0x36)
        self.write_data(0x70)
        self.set_windows(0, 0, self.h, self.w)
        self.dc.on()
        for i in range(0, len(pixel), 4096):
            self.spi.writebytes(pixel[i:i + 4096])

    def clear(self, color="WHITE"):
        img = Image.new("RGB", (self.h, self.w), color)
        self.img_show(img)


# =============================================================================
# LCD DISPLAY MANAGER
# =============================================================================

class LCDManager:
    """Manages LCD display with scrolling text and alarm features"""
    
    def __init__(self, font_path=None):
        self.lcd = None
        self.current_text = "XIOT Ready..."
        self.current_color = "BLACK"
        self.scrolling = False
        self.scroll_thread = None
        self.alarm_mode = False
        self.alarm_proc = None
        self.font_path = font_path or "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        
        if ON_PI:
            try:
                self.lcd = LCD_2Inch()
                self.lcd.lcd_init()
                self.lcd.clear("BLACK")
                print("[LCD] Initialized successfully")
            except Exception as e:
                print(f"[LCD] Failed to initialize: {e}")
                self.lcd = None

    def start_alarm_sound(self, filepath="./alarm.wav"):
        self.stop_alarm_sound()
        try:
            if filepath.endswith(".wav"):
                self.alarm_proc = subprocess.Popen(["aplay", "-q", filepath])
            elif filepath.endswith(".mp3"):
                self.alarm_proc = subprocess.Popen(["mpg123", "-q", filepath])
        except Exception as e:
            print(f"[LCD] Error starting alarm: {e}")

    def stop_alarm_sound(self):
        if self.alarm_proc and self.alarm_proc.poll() is None:
            self.alarm_proc.terminate()
            try:
                self.alarm_proc.wait(timeout=1)
            except subprocess.TimeoutExpired:
                self.alarm_proc.kill()
        self.alarm_proc = None

    def scroll_text(self):
        if not self.lcd:
            return
            
        try:
            font = ImageFont.truetype(self.font_path, 60)
        except:
            font = ImageFont.load_default()

        pulse_state = 0
        pulse_colors = {
            "YELLOW": [(255, 255, 0), (180, 180, 0)],
            "RED": [(255, 0, 0), (180, 0, 0)]
        }

        while self.scrolling:
            if not self.current_text:
                time.sleep(0.1)
                continue

            try:
                bbox = font.getbbox(self.current_text)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            except:
                text_width = len(self.current_text) * 30
                text_height = 60
                
            img_height = self.lcd.w

            for offset in range(0, text_width + self.lcd.h, 5):
                if not self.scrolling:
                    return

                if self.alarm_mode and self.current_color.upper() in pulse_colors:
                    bg_color = pulse_colors[self.current_color.upper()][pulse_state % 2]
                else:
                    bg_color = self.current_color

                base_img = Image.new("RGB", (text_width * 2 + self.lcd.h, img_height), bg_color)
                draw = ImageDraw.Draw(base_img)
                y = (img_height - text_height) // 2
                draw.text((0, y), self.current_text, fill="WHITE", font=font)
                draw.text((text_width + self.lcd.h, y), self.current_text, fill="WHITE", font=font)

                frame = base_img.crop((offset, 0, offset + self.lcd.h, self.lcd.w))
                self.lcd.img_show(frame.rotate(180))
                time.sleep(0.001)

                if self.alarm_mode and offset % 20 == 0:
                    pulse_state += 1

    def show_text(self, text, color="WHITE", alarm=False):
        # Stop current scroll
        self.scrolling = False
        if self.scroll_thread and self.scroll_thread.is_alive():
            self.scroll_thread.join(timeout=1)

        # Handle alarm
        if alarm and not self.alarm_mode:
            self.start_alarm_sound()
        elif not alarm and self.alarm_mode:
            self.stop_alarm_sound()

        self.current_text = text
        self.current_color = color
        self.alarm_mode = alarm
        self.scrolling = True

        self.scroll_thread = threading.Thread(target=self.scroll_text, daemon=True)
        self.scroll_thread.start()
        print(f"[LCD] Displaying: '{text}' on {color}, alarm={alarm}")

    def stop(self):
        self.scrolling = False
        self.stop_alarm_sound()
        if self.scroll_thread:
            self.scroll_thread.join(timeout=2)


# =============================================================================
# VIDEO STREAMING (MJPEG)
# =============================================================================

async def video_stream_handler(request):
    """Handle MJPEG video stream requests"""
    response = web.StreamResponse(
        status=200,
        headers={
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    )
    await response.prepare(request)

    print(f"[VIDEO] Client connected: {request.remote}")

    try:
        while True:
            # Capture one JPEG frame using libcamera
            try:
                frame = subprocess.check_output(
                    "libcamera-still -n --width 640 --height 480 -o - --immediate --timeout 1",
                    shell=True,
                    stderr=subprocess.DEVNULL
                )
            except subprocess.CalledProcessError:
                # Fallback: create a placeholder frame
                from PIL import Image
                import io
                img = Image.new('RGB', (640, 480), color='gray')
                draw = ImageDraw.Draw(img)
                draw.text((200, 220), "No Camera", fill='white')
                buf = io.BytesIO()
                img.save(buf, format='JPEG')
                frame = buf.getvalue()

            await response.write(b"--frame\r\n")
            await response.write(b"Content-Type: image/jpeg\r\n\r\n")
            await response.write(frame)
            await response.write(b"\r\n")
            
            await asyncio.sleep(0.033)  # ~30 FPS

    except (ConnectionResetError, asyncio.CancelledError):
        print(f"[VIDEO] Client disconnected: {request.remote}")
    
    return response


# =============================================================================
# AUDIO STREAMING (Pi -> Interface)
# =============================================================================

class AudioStreamer:
    """Streams audio from Pi microphone to clients"""
    
    def __init__(self):
        self.ffmpeg_proc = None
        self.clients = set()
        self._lock = threading.Lock()
        
    def start(self):
        """Start the ffmpeg process for audio capture"""
        if self.ffmpeg_proc and self.ffmpeg_proc.poll() is None:
            return
            
        try:
            self.ffmpeg_proc = subprocess.Popen(
                [
                    "ffmpeg",
                    "-f", "alsa",
                    "-i", MIC_DEVICE,
                    "-c:a", "libmp3lame",
                    "-b:a", "128k",
                    "-f", "mp3",
                    "pipe:1"
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=4096
            )
            print(f"[AUDIO OUT] Started capturing from {MIC_DEVICE}")
        except Exception as e:
            print(f"[AUDIO OUT] Failed to start: {e}")
            
    def stop(self):
        """Stop the ffmpeg process"""
        if self.ffmpeg_proc:
            self.ffmpeg_proc.terminate()
            try:
                self.ffmpeg_proc.wait(timeout=2)
            except:
                self.ffmpeg_proc.kill()
            self.ffmpeg_proc = None
            
    def read_chunk(self):
        """Read a chunk of audio data"""
        if self.ffmpeg_proc and self.ffmpeg_proc.poll() is None:
            return self.ffmpeg_proc.stdout.read(4096)
        return None


audio_streamer = AudioStreamer()


async def audio_out_handler(request):
    """Handle audio stream from Pi to interface"""
    response = web.StreamResponse(
        status=200,
        headers={
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        }
    )
    await response.prepare(request)
    
    print(f"[AUDIO OUT] Client connected: {request.remote}")
    audio_streamer.start()
    
    try:
        while True:
            chunk = await asyncio.get_event_loop().run_in_executor(
                None, audio_streamer.read_chunk
            )
            if chunk:
                await response.write(chunk)
            else:
                await asyncio.sleep(0.01)
                
    except (ConnectionResetError, asyncio.CancelledError):
        print(f"[AUDIO OUT] Client disconnected: {request.remote}")
    
    return response


# =============================================================================
# AUDIO RECEIVING (Interface -> Pi via WebSocket)
# =============================================================================

async def audio_in_websocket_handler(request):
    """Handle WebSocket audio from interface to Pi speaker"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    print(f"[AUDIO IN] WebSocket client connected: {request.remote}")
    
    # Start ffmpeg to play received audio
    ffmpeg = subprocess.Popen(
        [
            "/usr/bin/ffmpeg",
            "-loglevel", "quiet",
            "-f", "webm",
            "-i", "pipe:0",
            "-f", "alsa", "default"
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        bufsize=0
    )
    
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.BINARY:
                if ffmpeg.poll() is None:
                    try:
                        ffmpeg.stdin.write(msg.data)
                    except BrokenPipeError:
                        print("[AUDIO IN] FFmpeg pipe closed")
                        break
            elif msg.type == web.WSMsgType.ERROR:
                print(f"[AUDIO IN] WebSocket error: {ws.exception()}")
                break
                
    except Exception as e:
        print(f"[AUDIO IN] Error: {e}")
    finally:
        if ffmpeg.stdin and not ffmpeg.stdin.closed:
            ffmpeg.stdin.close()
        if ffmpeg and ffmpeg.poll() is None:
            ffmpeg.terminate()
            try:
                ffmpeg.wait(timeout=2)
            except subprocess.TimeoutExpired:
                ffmpeg.kill()
        print(f"[AUDIO IN] WebSocket client disconnected: {request.remote}")
    
    return ws


# =============================================================================
# MQTT HANDLER (LCD Commands)
# =============================================================================

class ActuatorController:
    """Handle I2C communication with actuator adapters"""
    
    # Commands matching ATtiny defines
    CMD_OFF = 0x00
    CMD_ON = 0x01
    CMD_TOGGLE = 0x02
    CMD_SET = 0x03  # For PWM/servo: followed by value byte
    
    def __init__(self):
        self.bus = None
        if ON_PI and smbus2:
            try:
                self.bus = smbus2.SMBus(I2C_BUS)
                print(f"[ACTUATOR] I2C bus {I2C_BUS} initialized")
            except Exception as e:
                print(f"[ACTUATOR] Failed to initialize I2C: {e}")
    
    def parse_i2c_address(self, addr_str):
        """Parse I2C address from string like '0x08' or '8'"""
        if not addr_str:
            return None
        try:
            if isinstance(addr_str, int):
                return addr_str
            if addr_str.startswith('0x') or addr_str.startswith('0X'):
                return int(addr_str, 16)
            return int(addr_str)
        except ValueError:
            return None
    
    def send_command(self, i2c_address, command, value=None, actuator_type='led'):
        """Send command to actuator via I2C"""
        if not self.bus:
            print(f"[ACTUATOR] I2C bus not available")
            return False
        
        addr = self.parse_i2c_address(i2c_address)
        if addr is None:
            print(f"[ACTUATOR] Invalid I2C address: {i2c_address}")
            return False
        
        try:
            if command == 'on':
                self.bus.write_byte(addr, self.CMD_ON)
                print(f"[ACTUATOR] Sent ON to 0x{addr:02X}")
            elif command == 'off':
                self.bus.write_byte(addr, self.CMD_OFF)
                print(f"[ACTUATOR] Sent OFF to 0x{addr:02X}")
            elif command == 'toggle':
                self.bus.write_byte(addr, self.CMD_TOGGLE)
                print(f"[ACTUATOR] Sent TOGGLE to 0x{addr:02X}")
            elif command == 'set' and value is not None:
                # For PWM/servo, send SET command followed by value
                val = int(value)
                if val < 0:
                    val = 0
                elif val > 255:
                    val = 255
                self.bus.write_byte_data(addr, self.CMD_SET, val)
                print(f"[ACTUATOR] Sent SET {val} to 0x{addr:02X}")
            else:
                print(f"[ACTUATOR] Unknown command: {command}")
                return False
            
            return True
            
        except IOError as e:
            print(f"[ACTUATOR] I2C error sending to 0x{addr:02X}: {e}")
            return False
    
    def close(self):
        """Close I2C bus"""
        if self.bus:
            self.bus.close()


class MQTTHandler:
    """Handles MQTT communication for LCD, sensors, and actuators"""
    
    def __init__(self, lcd_manager, actuator_controller=None):
        self.lcd_manager = lcd_manager
        self.actuator_controller = actuator_controller
        self.client = mqtt.Client(
            client_id=f"xiot-pi-{datetime.now().strftime('%H%M%S')}",
            clean_session=True,
            protocol=mqtt.MQTTv311
        )
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        self.connected = False
        
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"[MQTT] Connected to {MQTT_BROKER}:{MQTT_PORT}")
            self.connected = True
            # Subscribe to LCD, actuator, and discovery topics
            client.subscribe(MQTT_LCD_TOPIC)
            client.subscribe(MQTT_ACTUATOR_TOPIC)
            client.subscribe(MQTT_DISCOVERY_TOPIC)
            print(f"[MQTT] Subscribed to {MQTT_LCD_TOPIC}")
            print(f"[MQTT] Subscribed to {MQTT_ACTUATOR_TOPIC}")
            print(f"[MQTT] Subscribed to {MQTT_DISCOVERY_TOPIC}")
        else:
            print(f"[MQTT] Connection failed: {rc}")
            
    def _on_disconnect(self, client, userdata, rc):
        print(f"[MQTT] Disconnected (rc={rc})")
        self.connected = False
        
    def _on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode())
            topic = msg.topic
            
            if topic == MQTT_LCD_TOPIC:
                self._handle_lcd_message(data)
            elif topic == MQTT_ACTUATOR_TOPIC:
                self._handle_actuator_message(data)
            elif topic == MQTT_DISCOVERY_TOPIC:
                self._handle_discovery_message(data)
            else:
                print(f"[MQTT] Unknown topic: {topic}")
                
        except json.JSONDecodeError as e:
            print(f"[MQTT] Invalid JSON: {e}")
        except Exception as e:
            print(f"[MQTT] Error processing message: {e}")
    
    def _handle_lcd_message(self, data):
        """Handle LCD display commands"""
        text = data.get("text", "")
        color = data.get("color", "WHITE")
        alarm = data.get("alarm", False)
        
        if self.lcd_manager:
            self.lcd_manager.show_text(text, color, alarm)
    
    def _handle_actuator_message(self, data):
        """Handle actuator commands from interface"""
        i2c_address = data.get("i2c_address")
        command = data.get("command")
        value = data.get("value")
        actuator_type = data.get("actuator_type", "led")
        actuator_id = data.get("actuator_id", "unknown")
        
        print(f"[MQTT] Actuator command: {command} for {actuator_id} at {i2c_address}")
        
        if self.actuator_controller:
            success = self.actuator_controller.send_command(
                i2c_address, command, value, actuator_type
            )
            if success:
                print(f"[MQTT] Actuator command executed successfully")
            else:
                print(f"[MQTT] Actuator command failed")
        else:
            print(f"[MQTT] No actuator controller available")
    
    def _handle_discovery_message(self, data):
        """Handle device discovery trigger from interface"""
        action = data.get("action", "scan")
        
        if action == "scan":
            print(f"[MQTT] Device discovery triggered from interface")
            self._run_discovery()
        else:
            print(f"[MQTT] Unknown discovery action: {action}")
    
    def _run_discovery(self):
        """Run device discovery script in background"""
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        discovery_script = os.path.join(script_dir, "device_discovery.py")
        
        if os.path.exists(discovery_script):
            try:
                # Run discovery in background thread to not block MQTT
                def run_async():
                    result = subprocess.run(
                        [sys.executable, discovery_script],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    if result.returncode == 0:
                        print(f"[DISCOVERY] Completed successfully")
                        if result.stdout:
                            for line in result.stdout.strip().split('\n')[-5:]:
                                print(f"[DISCOVERY] {line}")
                    else:
                        print(f"[DISCOVERY] Failed: {result.stderr}")
                
                thread = threading.Thread(target=run_async, daemon=True)
                thread.start()
                print(f"[DISCOVERY] Started in background")
            except Exception as e:
                print(f"[DISCOVERY] Failed to start: {e}")
        else:
            print(f"[DISCOVERY] Script not found: {discovery_script}")
            
    def start(self):
        """Start MQTT client in background"""
        try:
            self.client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            print(f"[MQTT] Failed to connect: {e}")
            
    def stop(self):
        """Stop MQTT client"""
        self.client.loop_stop()
        self.client.disconnect()
        
    def publish_sensor(self, sensors_data):
        """Publish sensor data"""
        if self.connected:
            payload = {
                "baseboard_id": "PI-001",
                "sensors": sensors_data,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            self.client.publish(MQTT_SENSOR_TOPIC, json.dumps(payload))


# =============================================================================
# STATIC ENDPOINTS
# =============================================================================

async def index_handler(request):
    """Simple index page showing available endpoints"""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>XIOT Pi Multimedia Server</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: #eee; }
            h1 { color: #00d4ff; }
            .endpoint { background: #16213e; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .endpoint h3 { margin: 0 0 10px 0; color: #00d4ff; }
            code { background: #0f3460; padding: 2px 8px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>XIOT Multimedia Server</h1>
        <p>Unified server for video, audio, and display control.</p>
        
        <div class="endpoint">
            <h3>Video Stream (MJPEG)</h3>
            <p>GET <code>/video</code></p>
            <p>Live camera feed in MJPEG format</p>
        </div>
        
        <div class="endpoint">
            <h3>Audio Stream (Pi -> Interface)</h3>
            <p>GET <code>/audio</code></p>
            <p>MP3 audio stream from Pi microphone</p>
        </div>
        
        <div class="endpoint">
            <h3>Audio Input (Interface -> Pi)</h3>
            <p>WebSocket <code>/ws/audio</code></p>
            <p>Send WebM audio blobs to play on Pi speaker</p>
        </div>
        
        <div class="endpoint">
            <h3>LCD Display Control</h3>
            <p>MQTT Topic: <code>lcd/display</code></p>
            <p>Send JSON: <code>{"text": "Hello", "color": "RED", "alarm": false}</code></p>
        </div>
        
        <div class="endpoint">
            <h3>Health Check</h3>
            <p>GET <code>/health</code></p>
        </div>
    </body>
    </html>
    """
    return web.Response(text=html, content_type='text/html')


async def health_handler(request):
    """Health check endpoint"""
    return web.json_response({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": {
            "video": True,
            "audio_out": audio_streamer.ffmpeg_proc is not None,
            "lcd": ON_PI
        }
    })


# =============================================================================
# CORS MIDDLEWARE
# =============================================================================

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        return web.Response(headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        })
    response = await handler(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


# =============================================================================
# MAIN APPLICATION
# =============================================================================

def create_app(lcd_manager, mqtt_handler):
    """Create and configure the aiohttp application"""
    app = web.Application(middlewares=[cors_middleware])
    
    # Routes
    app.router.add_get('/', index_handler)
    app.router.add_get('/health', health_handler)
    app.router.add_get('/video', video_stream_handler)
    app.router.add_get('/audio', audio_out_handler)
    app.router.add_get('/ws/audio', audio_in_websocket_handler)
    
    # Store references for cleanup
    app['lcd_manager'] = lcd_manager
    app['mqtt_handler'] = mqtt_handler
    
    return app


async def on_shutdown(app):
    """Cleanup on shutdown"""
    print("\n[SERVER] Shutting down...")
    
    if app.get('lcd_manager'):
        app['lcd_manager'].stop()
        
    if app.get('mqtt_handler'):
        app['mqtt_handler'].stop()
    
    if app.get('actuator_controller'):
        app['actuator_controller'].close()
        
    audio_streamer.stop()
    print("[SERVER] Cleanup complete")


def main():
    print("=" * 60)
    print("XIOT Unified Multimedia Server")
    print("=" * 60)
    
    # Initialize LCD manager
    lcd_manager = LCDManager()
    
    # Initialize actuator controller for I2C communication
    actuator_controller = ActuatorController()
    
    # Initialize MQTT handler with LCD and actuator support
    mqtt_handler = MQTTHandler(lcd_manager, actuator_controller)
    mqtt_handler.start()
    
    # Create app
    app = create_app(lcd_manager, mqtt_handler)
    app['actuator_controller'] = actuator_controller
    app.on_shutdown.append(on_shutdown)
    
    # Show startup message on LCD
    if lcd_manager.lcd:
        lcd_manager.show_text("XIOT Ready", "GREEN")
    
    print(f"\nServer starting on port {HTTP_PORT}...")
    print(f"  Video:      http://0.0.0.0:{HTTP_PORT}/video")
    print(f"  Audio Out:  http://0.0.0.0:{HTTP_PORT}/audio")
    print(f"  Audio In:   ws://0.0.0.0:{HTTP_PORT}/ws/audio")
    print(f"  LCD MQTT:   {MQTT_BROKER}:{MQTT_PORT} -> {MQTT_LCD_TOPIC}")
    print(f"  Actuators:  {MQTT_BROKER}:{MQTT_PORT} -> {MQTT_ACTUATOR_TOPIC}")
    print("=" * 60)
    
    # Run server
    web.run_app(app, host='0.0.0.0', port=HTTP_PORT, print=None)


if __name__ == "__main__":
    main()

