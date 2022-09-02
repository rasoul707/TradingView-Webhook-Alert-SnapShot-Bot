# ------------------------------------------------------------------- #
# Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot #
# Author Name           : rasoul707                                   #
# File Name             : helper.py                                   #
# ------------------------------------------------------------------- #

from re import S
from telegram import Bot
import requests
import config
from snapshot import getSnapshot

tgbot = Bot(token=config.BOT_TOKEN)


def sendAlert(data, key):
    msg = ""

    try:
        msg = data["msg"]
        msg = msg.encode("latin-1", "backslashreplace")\
            .decode("unicode_escape")
    except:
        msg = ""

    tf = getTimeFrame(data["tf"])
    sgFa = getStrategy(data["sg"], 'fa')
    sgEn = getStrategy(data["sg"], 'en')
    cl = getCandles(data["cl"])

    sy = getSymbol(data["sy"])
    if sy == False:
        return

    if type(sy) == list:
        i = 0
        for symbol in sy:
            try:
                exchange = data["ex"]
            except:
                exchange = getExchange(symbol)

            timeframe = tf
            candles = int(cl[i])

            image = getSnapshot(
                exchange, symbol, timeframe, candles, send2Admin
            )

            ######
            send2Channel(
                symbol,
                exchange,
                timeframe,
                candles,
                sgFa,
                image,
                msg,
                "fa"
            )
            send2Channel(
                symbol,
                exchange,
                timeframe,
                candles,
                sgEn,
                image,
                msg,
                "en"
            )
            ######
            i += 1
    else:
        symbol = sy
        try:
            exchange = data["ex"]
        except:
            exchange = getExchange(symbol)

        timeframe = tf
        candles = int(cl[0])

        image = getSnapshot(
            exchange, symbol, timeframe, candles, send2Admin
        )

        ######
        send2Channel(
            symbol,
            exchange,
            timeframe,
            candles,
            sgFa,
            image,
            msg,
            "fa"
        )
        send2Channel(
            symbol,
            exchange,
            timeframe,
            candles,
            sgEn,
            image,
            msg,
            "en"
        )
        ######


#
#
#


alertsList = []


def addAlert(symbol, exchange, timeframe, candles, strategySlug):
    alertsList.append({
        symbol,
        exchange,
        timeframe,
        candles,
        strategySlug
    })


def checkAlert():
    pass


def send2Channel(symbol, exchange, timeframe, candles, strategy, image, msg, lang):

    message = "" + \
        "<b>جفت ارز: </b>" + getSymbolName(symbol, lang) + "\n" + \
        "<b>تایم فریم: </b>" + timeframe.upper() + "\n" + \
        "<b>استراتژی: </b>" + strategy + "\n" + \
        msg + "\n" + \
        "<a href='" + image + "'>🔻</a>"
    channel = config.persianChannel

    if lang == 'en':
        message = "" + \
            "<b>Pair: </b>" + getSymbolName(symbol, lang) + "\n" + \
            "<b>Timeframe: </b>" + timeframe.upper() + "\n" + \
            "<b>Strategy: </b>" + strategy + "\n" + \
            msg + "\n" + \
            "<a href='" + image + "'>🔻</a>"
        channel = config.englishChannel

    try:
        tgbot.sendMessage(
            channel,
            message,
            parse_mode="HTML",
        )
    except KeyError:
        send2Admin(message)
    except Exception as e:
        print("[X] Telegram Error:\n>", e)


##########


#
#
#
###


def getTimeFrame(tf):
    return tf.upper()


def getExchange(sy):
    m = sy[-4:]
    if m != "USDT":
        return "FOREXCOM".upper()
    return "BINANCE".upper()


candleCode = {
    10: 50,
    11: 65,
    12: 80,
    13: 95,
    14: 110,
    15: 125,
    16: 140,
    17: 155,
    18: 170,
    19: 185,
    20: 200,
    21: 215,
    22: 230,
    23: 245,
    24: 260,
    25: 275,
    26: 290,
    27: 305,
    28: 320,
    29: 335,
    30: 350,
    31: 365,
    32: 380,
    33: 395,
    34: 410,
    35: 425,
    36: 440,
    37: 455,
    38: 470,
    39: 485,
    40: 500,
}


def getCandles(cl):
    try:
        cl = str(cl)
        codes = []
        l = len(cl)
        if l % 2 != 0:
            return cl
        for x in range(int(l/2)):
            codes.append(candleCode[int(cl[2*x:2*x+2])])
        return codes
    except:
        return cl


#
#
#
###


def getStrategy(sg, lang):
    try:
        code = int(sg[-1])
        name = sg[0:-1]
        if lang == 'en':
            if name == "SRF":
                if code == 1:
                    return "Price inside important Support zone 🟢"
                if code == 2:
                    return "Price inside important Resistance zone 🔴"
            if name == "DIV":
                if code == 1:
                    return "Bullish Divergence 🟢"
                if code == 2:
                    return "Bearish Divergence 🔴"
                if code == 3:
                    return "Bullish Hidden Divergence 🟢"
                if code == 4:
                    return "Bearish Hidden Divergence 🔴"
            if name == "FIB":
                if code == 1:
                    return "Price at 0.618 fibonacci level"
                if code == 2:
                    return "Price at 1.618 fibonacci level"
            if name == "SHE":
                if code == 1:
                    return "Break Bearish trendline 🟢"
                if code == 2:
                    return "Break Bullish trendline 🔴"
            if name == "PUL":
                if code == 1:
                    return "Pullback to Past bearish trendline 🟢"
                if code == 2:
                    return "Pullback to Past Bullish trendline 🔴"
            if name == "CHA":
                if code == 1:
                    return "Price at the Bottom of the regression channel 🟢"
                if code == 2:
                    return "Price at the Top of the regression channel 🔴"
        else:
            if name == "SRF":
                if code == 1:
                    return "قیمت در محدوده حمایت مهم 🟢"
                if code == 2:
                    return "قیمت در محدوده مقاومت مهم 🔴"
            if name == "DIV":
                if code == 1:
                    return "واگرایی صعودی 🟢"
                if code == 2:
                    return "واگرایی نزولی 🔴"
                if code == 3:
                    return "واگرایی مخفی صعودی 🟢"
                if code == 4:
                    return "واگرایی مخفی نزولی 🔴"
            if name == "FIB":
                if code == 1:
                    return "قیمت در محدوده 0.618 فیبوناچی"
                if code == 2:
                    return "قیمت در محدوده 1.618 فیبوناچی"
            if name == "SHE":
                if code == 1:
                    return "شکست خط روند نزولی 🟢"
                if code == 2:
                    return "شکست خط روند صعودی 🔴"
            if name == "PUL":
                if code == 1:
                    return "پولبک به خط روند نزولی گذشته 🟢"
                if code == 2:
                    return "پولبک به خط روند صعودی گذشته 🔴"
            if name == "CHA":
                if code == 1:
                    return "کف کانال قیمتی 🟢"
                if code == 2:
                    return "سقف کانال قیمتی 🔴"

        return sg
    except:
        return sg


#
#
#
###
symbolCode = {
    10: 'BTCUSDT',
    11: 'ETHUSDT',
    12: 'BNBUSDT',
    13: 'XRPUSDT',
    14: 'SHIBUSDT',
    15: 'ADAUSDT',
    16: 'EURUSD',
    17: 'USDJP',
    18: 'XAUUSD',
    19: 'ATOMUSDT',
    20: 'MATICUSDT',
    21: 'SOLUSDT',
    22: 'LTCUSDT',
    23: 'TRXUSDT',
    24: 'DOGEUSDT',
    25: 'LINKUSDT',
    26: 'NEARUSDT',
    27: 'AVAXUSDT',
    28: 'DOTUSDT',
    29: 'USDCAD',
    30: 'NZDUSD',
    31: 'AUDUSD',
    32: 'GBPUSD',
    33: 'USDCHF',
}


def getSymbol(sy):
    if type(sy) == int or type(sy) == str and sy.isnumeric():
        sy = str(sy)
        codes = []
        l = len(sy)
        if l % 2 != 0:
            return False
        try:
            for x in range(int(l/2)):
                codes.append(symbolCode[int(sy[2*x:2*x+2])].upper())
        except:
            return False
        return codes
    elif type(sy) == str:
        return sy.upper()
    return "BTCUSDT".upper()


persianSymbols = {
    "BTCUSDT": "بیت کوین / دلار (BTCUSDT)",
    "ETHUSDT": "اتریوم / دلار (ETHUSDT)",
    "BNBUSDT": "بایننس‌ کوین / دلار (BNBUSDT)",
    "XRPUSDT": "ریپل / دلار (XRPUSDT)",
    "SHIBUSDT": "شیبا / دلار (SHIBUSDT)",
    "ADAUSDT": "کاردانو / دلار (ADAUSDT)",
    "EURUSD": " 🇪🇺 یورو / دلار (EURUSD)",
    "USDJPY": "🇯🇵 دلار / ین ژاپن (USDJPY)",
    "XAUUSD": "⚱ طلا / دلار (XAUUSD)",
}


englishSymbols = {

}


def getSymbolName(sy, lang):
    if lang == 'fa':
        try:
            return persianSymbols[sy]
        except:
            return sy
    else:
        try:
            return englishSymbols[sy]
        except:
            return sy


#
#
#
####


####

def send2Admin(msg):
    try:
        tgbot.sendMessage(
            config.admin,
            msg,
            parse_mode="HTML",
        )
    except Exception as e:
        print("[X] Telegram Send Admin Error:\n>", e)
