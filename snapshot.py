import cv2
import numpy as np
import config
import requests


def getSnapshot(chart_id, exchange, symbol, timeframe, zoom, topWatermark, send2Admin):
    snapLink = generateSnapshot(
        [chart_id, exchange, symbol, timeframe],
        zoom,
        send2Admin
    )
    if not snapLink:
        return 'Capture Error'

    id = snapLink.split("/")[-1]
    m = id[0:1].lower()
    try:
        impath = f"snapshots/{m}-{id}"
        filepath = f"{impath}.png"
        # cropImage(filepath)
        watermark(filepath, topWatermark)
        return config.baseUrl + f"preview/{m}-{id}"
    except Exception as ee:
        return snapLink


def generateSnapshot(arg, zoom, send2Admin):
    cmd = [x if i == 0 else x.upper() for i, x in enumerate(arg)] if len(
        arg) >= 4 and len(arg) <= 5 and (arg[0] == '-' or (len(arg[0]) == 8 and not arg[0].islower() and not arg[0].isupper())) else [config.chart_id, config.exchange, config.symbol, config.timeframe] if len(arg) == 0 else 'error'
    if isinstance(cmd, str):
        return cmd
    else:
        requestUrl = f'http://localhost:7707/capture?base=chart/{cmd[0]}&exchange={cmd[1]}&ticker={cmd[2]}&interval={cmd[3]}&zoom={zoom}'
        result = requests.get(requestUrl).json()

        if result['error']:
            send2Admin('<b>Error</b> =>\n' + result['error'])

        if result['token']:
            token = result['token']
            url = f'https://www.tradingview.com/x/{token}'
            return url

        return ''


def cropImage(imgPath):
    image = cv2.imread(imgPath)
    crop_image = image[23:987, 6:1527]
    cv2.imwrite(imgPath, crop_image)


def watermark(imgPath, topWatermark):
    requestUrl = f'http://localhost:7707/snapshots/watermark?filePath={imgPath}&topWatermark={topWatermark}'
    requests.get(requestUrl)
