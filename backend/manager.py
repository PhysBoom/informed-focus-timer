import threading
from listener import Listener

class ListenerManager:
    """
    Singleton manager for all MQTT listeners.
    Creates, stores, retrieves, and deletes listeners by UUID.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                    cls._instance._listeners = {}
        return cls._instance

    def create_listener(self, broker: str, port: int, keepalive: int, topics: list) -> str:
        """
        Instantiate a Listener, schedule its deletion after `keepalive` seconds,
        and return its unique ID.
        """
        listener = Listener(broker, port, keepalive, topics)
        self._listeners[listener.id] = listener

        # Schedule cleanup after keepalive seconds
        timer = threading.Timer(keepalive, self.delete_listener, args=[listener.id])
        timer.daemon = True
        timer.start()

        return listener.id

    def get_messages(self, listener_id: str) -> list | None:
        """
        Return buffered messages for the given listener ID, or None if not found.
        """
        listener = self._listeners.get(listener_id)
        if not listener:
            return None
        return listener.get_messages()

    def delete_listener(self, listener_id: str) -> bool:
        """
        Shutdown and remove a listener. Returns True if existed, False otherwise.
        """
        listener = self._listeners.pop(listener_id, None)
        if listener:
            listener.shutdown()
            return True
        return False
