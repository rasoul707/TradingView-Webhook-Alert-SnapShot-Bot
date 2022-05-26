# ------------------------------------------------------------------- #
# Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot #
# Author Name           : rasoul707                                   #
# File Name             : helper.py                                     #
# ------------------------------------------------------------------- #


from email import message
from telegram import Bot
import requests
import config


def sendAlert(data, key):
    msg = data["msg"]
    msg = msg.encode("latin-1", "backslashreplace").decode("unicode_escape")
    tgbot = Bot(token=config.BOT_TOKEN)

    ex = data["ex"]
    sy = data["sy"]
    tf = data["tf"]
    snapLink = snapshot([
        "-",
        ex,
        sy,
        tf
    ])

    message = "**"+sy.upper()+" | "+tf.upper()+"**" + "\n" + \
        "[.]("+snapLink+")" + msg
    try:
        tgbot.sendMessage(
            config.channels[config.keys.index(key)],
            message,
            parse_mode="MARKDOWN",
        )
    except KeyError:
        tgbot.sendMessage(
            config.admin,
            message,
            parse_mode="MARKDOWN",
        )
    except Exception as e:
        print("[X] Telegram Error:\n>", e)


def snapshot(arg):
    cmd = [x if i == 0 else x.upper() for i, x in enumerate(arg)] if len(
        arg) >= 4 and len(arg) <= 5 and (arg[0] == '-' or (len(arg[0]) == 8 and not arg[0].islower() and not arg[0].isupper())) else [config.chart_id, config.exchange, config.symbol, config.timeframe] if len(arg) == 0 else 'error'
    if isinstance(cmd, str):
        return cmd
    else:
        requesturl = f'http://localhost:7007/capture?base=chart/&exchange={cmd[1]}&ticker={cmd[2]}&interval={cmd[3]}'
        return f'https://www.tradingview.com/x/{requests.get(requesturl).text}'


def sen2Admin(msg):
    tgbot = Bot(token=config.BOT_TOKEN)

    try:
        tgbot.sendMessage(
            config.admin,
            msg,
            parse_mode="MARKDOWN",
        )
    except Exception as e:
        print("[X] Telegram Send Admin Error:\n>", e)
