from flask import Flask, request, jsonify, abort
from manager import ListenerManager
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
manager = ListenerManager()

@app.route('/listener/create', methods=['POST'])
def create_listener():
    data = request.get_json(force=True)
    # Required parameters: broker, port, topics
    if not all(k in data for k in ('broker', 'port', 'topics')):
        abort(400, 'Required fields: broker, port, topics')

    broker = data['broker']
    port = data['port']
    topics = data['topics']
    # keepalive controls how long the listener stays alive (seconds)
    keepalive = data.get('keepalive', 3600)

    listener_id = manager.create_listener(
        broker=broker,
        port=port,
        keepalive=keepalive,
        topics=topics,
    )
    return jsonify({'id': listener_id}), 201

@app.route('/listener/<listener_id>', methods=['GET'])
def get_listener_messages(listener_id):
    msgs = manager.get_messages(listener_id)
    if msgs is None:
        abort(404, 'Listener not found')
    return jsonify({'messages': msgs}), 200

@app.route('/listener/<listener_id>', methods=['DELETE'])
def delete_listener(listener_id):
    success = manager.delete_listener(listener_id)
    if not success:
        abort(404, 'Listener not found')
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
