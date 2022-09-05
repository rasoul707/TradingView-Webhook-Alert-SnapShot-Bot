import cv2
import numpy as np
import config
import requests


def getSnapshot(exchange, symbol, timeframe, candles, topWatermark, send2Admin):
    snapLink = generateSnapshot(
        ["-", exchange, symbol, timeframe],
        candles,
        send2Admin
    )
    if not snapLink:
        return 'err'
    id = snapLink.split("/")[-1]
    m = id[0:1].lower()
    impath = "snapshots/" + m + "-" + id
    cropImage(impath + ".png")
    watermark(impath + ".png", topWatermark)
    return config.baseUrl + impath


def generateSnapshot(arg, cl, send2Admin):
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
            return url

        send2Admin('<b>Error</b> =>\n' + result['error'])
        return ''


def cropImage(imgPath):
    image = cv2.imread(imgPath)
    crop_image = image[23:987, 6:1527]
    cv2.imwrite(imgPath, crop_image)


def watermark(imgPath, topWatermark):
    print("gggg")
    print(imgPath)
    # print(topWatermark)
    # requestUrl = f'http://localhost:7007/snapshots/watermark?filePath={imgPath}&topWatermark={topWatermark}'
    # print(requestUrl)
    # requests.get(requestUrl)
