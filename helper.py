# ------------------------------------------------------------------- #
# Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot #
# Author Name           : rasoul707                                   #
# File Name             : helper.py                                     #
# ------------------------------------------------------------------- #


from telegram import Bot
import requests
import config


def sendAlert(data, key):
    msg = data["msg"]
    msg = msg.encode("latin-1", "backslashreplace").decode("unicode_escape")
    tgbot = Bot(token=config.BOT_TOKEN)
    try:
        tgbot.sendMessage(
            config.channels[config.keys.index(key)],
            msg,
            parse_mode="MARKDOWN",
        )
    except KeyError:
        tgbot.sendMessage(
            config.admin,
            msg,
            parse_mode="MARKDOWN",
        )
    except Exception as e:
        print("[X] Telegram Error:\n>", e)


def snapshot(arg):
    cmd = [x if i == 0 else x.upper() for i, x in enumerate(arg)] if len(
        arg) >= 4 and len(arg) <= 5 and (arg[0] == '-' or (len(arg[0]) == 8 and not arg[0].islower() and not arg[0].isupper())) else ['-', 'BINANCE', 'BTCUSDT', '1D'] if len(arg) == 0 else 'error'
    if isinstance(cmd, str):
        return cmd
    else:
        ChartID = f'chart/{cmd[0]}/' if len(
            cmd[0]) == 8 and not cmd[0].islower() and not cmd[0].isupper() else 'chart/'
        theme = 'light' if len(cmd) == 4 else 'dark' if len(
            cmd) == 5 and cmd[4].lower() == 'dark' else 'light'
        requesturl = f'http://localhost:7007/capture?base={ChartID}&exchange={cmd[1]}&ticker={cmd[2]}&interval={cmd[3]}&theme={theme}'
        return f'https://www.tradingview.com/x/{requests.get(requesturl).text}'
