import threading
import time
import uuid
from paho.mqtt.client import Client

class Listener:
    """
    Encapsulates an MQTT client that collects messages on background thread.
    """
    def __init__(self, broker: str, port: int, keepalive: int, topics: list):
        self.id = str(uuid.uuid4())
        self.broker = broker
        self.port = port
        self.keepalive = keepalive
        self.topics = topics
        self.messages = []
        self._lock = threading.Lock()

        # Setup MQTT client
        self._client = Client(client_id=self.id)
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message

        # Run network loop in a daemon thread
        self._thread = threading.Thread(target=self._run)
        self._thread.daemon = True
        self._thread.start()

    def _run(self):
        """
        Connect and process the network loop forever.
        """
        self._client.connect(self.broker, self.port, keepalive=self.keepalive)
        self._client.loop_forever()

    def _on_connect(self, client, userdata, flags, rc):
        """
        Subscribe to all topics on successful connect.
        """
        if rc == 0:
            for topic in self.topics:
                client.subscribe(topic)
        else:
            # could log failure code here
            pass

    def _on_message(self, client, userdata, msg):
        """
        Buffer incoming messages in a thread-safe list.
        """
        payload = msg.payload.decode('utf-8', errors='replace')
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        with self._lock:
            self.messages.append({
                'time': timestamp,
                'topic': msg.topic,
                'payload': payload,
            })

    def get_messages(self) -> list:
        """
        Return buffered messages and clear the buffer.
        """
        with self._lock:
            msgs = list(self.messages)
            self.messages.clear()
        return msgs

    def shutdown(self):
        """
        Disconnect the client and stop the network loop.
        """
        try:
            self._client.disconnect()
            self._client.loop_stop()
        except Exception:
            pass