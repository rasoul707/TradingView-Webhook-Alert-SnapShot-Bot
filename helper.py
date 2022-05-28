# ------------------------------------------------------------------- #
# Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot #
# Author Name           : rasoul707                                   #
# File Name             : helper.py                                     #
# ------------------------------------------------------------------- #


from email import message
from telegram import Bot
import requests
import config

tgbot = Bot(token=config.BOT_TOKEN)


def sendAlert(data, key):
    msg = data["msg"]
    msg = msg.encode("latin-1", "backslashreplace").decode("unicode_escape")

    ex = data["ex"]
    sy = data["sy"]
    tf = data["tf"]
    sg = data["sg"]
    cl = data["cl"]
    snapLink = snapshot([
        "-",
        ex,
        sy,
        tf
    ], cl)

    if not snapLink:
        return 'err'

    message = "[🔻]("+snapLink+") " + "**" + sy.upper()+" | "+tf.upper()+"**" + "\n" + \
        "استراتژی: " + sg + "\n" + msg
    try:
        tgbot.sendMessage(
            config.channels[config.keys.index(key)],
            message,
            parse_mode="MARKDOWN",
        )
    except KeyError:
        sen2Admin(message)
    except Exception as e:
        print("[X] Telegram Error:\n>", e)


def snapshot(arg, cl):
    cmd = [x if i == 0 else x.upper() for i, x in enumerate(arg)] if len(
        arg) >= 4 and len(arg) <= 5 and (arg[0] == '-' or (len(arg[0]) == 8 and not arg[0].islower() and not arg[0].isupper())) else [config.chart_id, config.exchange, config.symbol, config.timeframe] if len(arg) == 0 else 'error'
    if isinstance(cmd, str):
        return cmd
    else:
        requestUrl = f'http://localhost:7007/capture?base=chart/&exchange={cmd[1]}&ticker={cmd[2]}&interval={cmd[3]}&candles={cl}'
        result = requests.get(requestUrl).json()
        if result['ok']:
            token = result['token']
            url = f'https://www.tradingview.com/x/{token}'
            sen2Admin('Suc =>\n'+result['images'].join('\n')+'\n\n'+url)
            return url
        sen2Admin('Err =>\n')
        return ''


def sen2Admin(msg):

    try:
        tgbot.sendMessage(
            config.admin,
            msg,
            parse_mode="MARKDOWN",
        )
    except Exception as e:
        print("[X] Telegram Send Admin Error:\n>", e)
