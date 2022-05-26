# ------------------------------------------------------------------- #
# Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot #
# Author Name           : rasoul707                                   #
# File Name             : main.py                                     #
# ------------------------------------------------------------------- #


import json
import time
from flask import Flask, request
import requests
import config
from helper import *


app = Flask(__name__)


def get_timestamp():
    timestamp = time.strftime("%Y-%m-%d %X")
    return timestamp


@app.route("/wh", methods=["POST"])
def webhook():
    try:
        if request.method == "POST":
            data = request.get_json()
            key = request.args.get('key')

            if key in config.keys:
                print(get_timestamp(), "New Alert Received & Sent!")
                sendAlert(data, key)
                return "Sent alert", 200
            else:
                print("[X]", get_timestamp(),
                      "New Alert Received & Refused! [Key Not Found]")
                return "Refused alert", 400

    except Exception as e:
        print("[X]", get_timestamp(), "Error:\n>", e)
        return "Error", 400


if __name__ == "__main__":
    from waitress import serve
    capture_start = requests.get(
        'http://localhost:7007/start?username=' + config.username + '&password=' + config.password)
    print(capture_start.json)
    serve(app, host="0.0.0.0", port=80)
