from flask import Flask
from routes import main_bp


server = Flask('Server')
server.register_blueprint(main_bp)


if __name__ == '__main__':
    server.run(
        port=6000,
        host='0.0.0.0',
        debug=False,
        use_reloader=False
    )