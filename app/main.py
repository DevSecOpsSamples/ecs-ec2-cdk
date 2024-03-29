from flask import Flask
from flask import request
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__)
csrf = CSRFProtect()
csrf.init_app(app)


@app.route("/")
def ping_root():
    return return_requests()


@app.route("/<string:path1>")
def ping_path1(path1):
    return return_requests()


@app.route("/<string:path1>/<string:path2>")
def ping_path2(path1, path2):
    return return_requests()


@app.route("/<string:path1>/<string:path2>/<string:path3>")
def ping_path3(path1, path2, path3):
    return return_requests()


@app.route("/<string:path1>/<string:path2>/<string:path3>/<string:path4>")
def ping_path4(path1, path2, path3, path4):
    return return_requests()


def return_requests():
    return {
        "host": request.host,
        "url": request.url,
        "method": request.method,
        "message": "Hello, World"
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
