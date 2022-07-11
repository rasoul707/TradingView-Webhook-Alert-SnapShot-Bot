# TradingView-Webhook-Alert-SnapShot-Bot
Send SnapShot of your chart in tradingview when alert activated to your channel

## Usage
You set webhook on your tradingview like this: ```http://YOUR_SERVER_IP:80/wh?key=KEY```
You can set a lot of key and channel in ```config.py```
in message box you must type a message like this:
```
{
    "sy": "nearusdt",
    "ex": "binance",
    "tf": "1h",
    "cl": 50,
    "sg": "Strategy Name",
    "msg": "Your description"
}
```
sy => symbol name

ex => exchange

tf => timeframe (```1H```,```4H```,```W```,```15```,```55```, ...)

cl => candles count you want to show

sg => strategy name

msg => message

You can use TradingView shortcut, like this:
```
{
    "sy": "{{ticker}}",
    "ex": "{{exchange}}",
    "tf": "{{interval}}",
    "cl": 50,
    "sg": "Strategy Name",
    "msg": "Your description"
}
```
then when alert activated, snapshot of defined chart will send to your channel that related to key that you entered
P

## Run
- First: ```node capture.js &```
- Second: ```python3 main.py &```


### Stop
```CTRL + C```


### Installing:
 - Python 3.8 or newer. (```apt install python3-pip```)
 - [Requests](https://pypi.org/project/requests/), Included in installation.
 - Install requirements: ```pip install -r requirements.txt```
 - Node Js v15.11.0 or newer ```sudo apt install nodejs```
 - Type ```node -v``` to check version
 - ExpressJs 4.17.1 or newer ```npm install```
 - ```apt-get upgrade```
 - ```apt-get update```
 - ```apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget```
 - ```apt-get install -y libgbm-dev```
 - Create a bot with ```@BotFather``` in telegram
 - Edit ```config.py``` and enter your configuration
 - and then Read Run



```sudo crontab -e```

```
07 00 * * * sudo reboot
07 08 * * * sudo reboot
07 16 * * * sudo reboot
```



```sudo nano /etc/systemd/system/tvalertbot.service```
```
[Unit]
Description="TV AlertBot"
StartLimitIntervalSec=500
StartLimitBurst=5


[Service]
ExecStart=/usr/bin/node capture.js
WorkingDirectory=/root/TradingView-Webhook-Alert-SnapShot-Bot/
Restart=on-failure
RestartSec=3s
User=root
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=MyApp


[Install]
WantedBy=multi-user.target
```
Be Happy :)
