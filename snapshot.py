import cv2
import numpy as np
import config
import requests

# def __saveImage():
#     url = 'https://www.tradingview.com/x/ky8cGtAo'
#     response = requests.get(url)
#     soup = BeautifulSoup(response.text, features="lxml")
#     imgs = soup.find_all('img')
#     imageUrl = None
#     for img in imgs:
#         if img.attrs['alt'] == "TradingView Chart":
#             imageUrl = img.attrs['src']


def saveImage(url):
    id = url.split("/")[-1]
    m = id[0:1].lower()
    imageUrl = 'https://s3.tradingview.com/snapshots/' + m + '/' + id + '.png'
    imgPath = "snapshots/" + m + "-" + id + ".png"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:71.0) Gecko/20100101 Firefox/71.0'
    }
    r = requests.get(imageUrl, headers=headers)
    print(r.content)
    with open(imgPath, 'wb') as outfile:
        outfile.write(r.content)
    # cropImage(imgPath)
    return config.baseUrl + "snapshots/" + m + "-" + id


def getSnapshot(exchange, symbol, timeframe, candles, send2Admin):
    snapLink = generateSnapshot(
        ["-", exchange, symbol, timeframe],
        candles,
        send2Admin
    )
    imageLink = saveImage(snapLink)
    if not imageLink:
        return 'err'
    return imageLink


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


def addWatermark(imgPath, type):
    centerWatermark = cv2.imread("assets/center_watermark.png")
    smallWatermark = cv2.imread("assets/small_watermark.png")
    image = cv2.imread(imgPath)

    background = image
    overlay = centerWatermark

    rows, cols, channels = overlay.shape

    overlay = cv2.addWeighted(
        background[250:250+rows, 0:0+cols],
        1,
        overlay,
        1,
        0
    )

    background[250:250+rows, 0:0+cols] = overlay

    cv2.imshow('res', background)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def cropImage(imgPath):
    image = cv2.imread(imgPath)
    crop_image = image[24:994, 0:1514]
    cv2.imwrite("snapshots/k-ky8cGtAo-cropped.png", crop_image)
