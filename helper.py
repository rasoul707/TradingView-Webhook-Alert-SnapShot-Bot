# ------------------------------------------------------------------- #
# Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot #
# Author Name           : rasoul707                                   #
# File Name             : helper.py                                     #
# ------------------------------------------------------------------- #


from telegram import Bot
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
