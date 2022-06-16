/* -------------------------------------------------------------------- */
/* Plugin Name           : TradingView-Webhook-Alert-Telegram-SnapShot  */
/* Author Name           : rasoul707                                    */
/* File Name             : capture.js                                   */
/* -------------------------------------------------------------------- */



const express = require('express');
const puppeteer = require('puppeteer-extra');
const UserAgent = require('user-agents');
const moment = require('moment');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const readline = require('readline');


const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
let browser, useragent;

const chromeOptions = {
    headless: true,
    defaultViewport: null,
    args: [
        "--incognito",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
    ],
};

const blockedResourceTypes = [
    'image',
    'media',
    'font',
    'texttrack',
    'object',
    'beacon',
    'csp_report',
    'imageset',
];

const skippedResources = [
    'quantserve',
    'adzerk',
    'doubleclick',
    'adition',
    'exelator',
    'sharethrough',
    'cdn.api.twitter',
    'google-analytics',
    'googletagmanager',
    // 'google',
    'fontawesome',
    'facebook',
    'analytics',
    'optimizely',
    'clicktale',
    'mixpanel',
    'zedo',
    'clicksor',
    'tiqcdn',
];


const runPythonBot = () => {
    return new Promise(async (resolve, reject) => {
        const { spawn } = require('child_process');
        const pyprog = spawn('python3', ['./main.py']);

        pyprog.stdout.on('data', function (data) {
            resolve("Py server run successfully")
        });

        pyprog.stderr.on('data', (data) => {
            resolve("Py server run failed: " + data.toString())
            setTimeout(() => {
                process.exit(1)
            }, 500)
        });
    })
}

const logPyServer = async () => {
    console.log(await runPythonBot())
}

app.listen(7007, () => {
    console.log('Server is running on port 7007');
    logPyServer();
});

const newPage = async () => {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.setRequestInterception(true);
    await page.setUserAgent(useragent);
    await page.setViewport({
        width: 1920,
        height: 1080,
    });

    page.on('request', request => {
        const requestUrl = request._url.split('?')[0].split('#')[0];
        if (
            blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
            skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
        ) {
            request.abort();
        } else {
            request.continue();
        }
    });
    return page
}

const rebootServer = () => {
    const exec = require('child_process').exec;
    function execute(command, callback) {
        exec(command, function (error, stdout, stderr) { callback(stdout); });
    }
    execute('sudo reboot', function (callback) {
        console.log(callback);
    })
}


app.get('/start', async function (req, res) {

    const authUrl = 'https://www.tradingview.com/accounts/signin/?next=https://www.tradingview.com';
    const username = req.query.username ?? ""
    const password = req.query.password ?? ""

    let status = ''
    let ok = false

    const userAgent = new UserAgent({ "deviceCategory": "desktop" })
    useragent = userAgent.toString()

    try {
        puppeteer.use(
            RecaptchaPlugin({
                provider: {
                    id: '2captcha',
                    token: 'c317ac6c93c1954bcdd14a0980f41602' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
                },
                visualFeedback: true
            })
        )
        browser = await puppeteer.launch(chromeOptions);
        const page = await newPage();


        await page.goto(authUrl, { timeout: 25000, waitUntil: 'networkidle2', });
        if (await page.url() === authUrl) {
            await page.waitForSelector('.tv-signin-dialog__toggle-email', { timeout: 20000 })
            await page.click('.tv-signin-dialog__toggle-email')
            await page.type('input[name="username"]', username)
            await page.type('input[name="password"]', password)
            await page.click('button[type="submit"]')
            await page.waitForTimeout(5000);
            if (page.url() === authUrl) {
                await page.solveRecaptchas()
                await page.waitForTimeout(5000);
                if (page.url() === authUrl) {
                    status = "errorLogin"
                    ok = false
                } else {
                    status = "login with captcha"
                    ok = true
                }
            }
            else {
                status = "login"
                ok = true
            }
        } else {
            status = "hasLogin"
            ok = true
        }

        await page.close();
        res.json({ ok, status, username, password, useragent });
        if (!ok) process.exit(1)
    }
    catch (err) {
        res.json({ ok: false, status: "Error", error: err.toString() })
        process.exit(1)
    }



});


const dateTimeRange = (interval, candles) => {
    interval = interval.toUpperCase();
    const types = ['H', 'D', 'W', 'M', 'Y']
    const temp = interval.slice(-1)
    const now = moment()


    let _start = {}
    let _end = {}
    let duration
    let number
    candles = parseInt(candles)
    if (!candles || isNaN(candles)) candles = 1

    if (!types.includes(temp)) {
        duration = 'm'
        number = parseInt(interval)
    }
    else {
        duration = temp
        number = parseInt(interval.substring(0, interval.length - 1))
    }


    if (!number || isNaN(number)) number = 1

    if (duration === 'S') {
        _start = { seconds: candles * number }
        _end = { seconds: number * 10 }
        now.endOf('second')
    } if (duration === 'm') {
        _start = { minutes: candles * number }
        _end = { minutes: number * 10 }
        now.endOf('minute').add(1, 'second')
    }
    if (duration === 'H') {
        _start = { hours: candles * number }
        _end = { hours: number * 10 }
        now.endOf('hour').add(1, 'second')
    }
    if (duration === 'D') {
        _start = { days: candles * number }
        _end = { days: number * 10 }
        now.endOf('day').add(1, 'second')
    }
    if (duration === 'W') {
        _start = { weeks: candles * number }
        _end = { weeks: number * 10 }
        now.endOf('week').add(1, 'second')
    }
    if (duration === 'M') {
        _start = { months: candles * number }
        _end = { months: number * 10 }
        now.endOf('month').add(1, 'second')
    }
    if (duration === 'Y') {
        _start = { years: candles * number }
        _end = { years: number * 10 }
        now.endOf('year').add(1, 'second')
    }

    const start = now.clone().subtract(_start)
    const end = now.clone().add(_end)
    return { start, end }
}


let errorsCount = 0


app.get('/capture', async function (req, res) {
    var base = req.query.base;
    var exchange = req.query.exchange;
    var ticker = req.query.ticker;
    var interval = req.query.interval;
    var candles = req.query.candles;
    const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval;

    const ts = new Date().getTime();
    console.log(ts, "New Capture")

    const page = await newPage();
    // const recorder = new PuppeteerScreenRecorder(page);
    // await recorder.start("screens/" + ts + ".mp4");

    try {



        await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded', });

        await page.waitForTimeout(1000);

        await page.waitForSelector('#header-toolbar-symbol-search', { visible: true, timeout: 50000 });
        await page.waitForSelector('[data-name="legend-series-item"] .loader-OYqjX7Sg', { hidden: true, timeout: 50000 });

        await page.waitForTimeout(1000);

        page.keyboard.press('AltLeft');
        await page.keyboard.press('KeyR');


        if (candles) {

            const { start, end } = dateTimeRange(interval, candles)

            const start_date = start.format("YYYYMMDD")
            const end_date = end.format("YYYYMMDD")
            const start_time = start.format("HHmm")
            const end_time = end.format("HHmm")


            page.keyboard.press('AltLeft');
            await page.keyboard.press('KeyG');

            await page.waitForTimeout(1000)

            await page.waitForSelector('[data-name="go-to-date-dialog"] div[data-name="tab-item-customrange"]', { visible: true, timeout: 50000 });
            await page.click('[data-name="go-to-date-dialog"] div[data-name="tab-item-customrange"]')


            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(1) > :nth-child(1) input');
            await page.waitForTimeout(200);
            await page.keyboard.press('End');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(start_date, { delay: 100 });




            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(1) > :nth-child(2) input');
            await page.waitForTimeout(200);
            await page.keyboard.press('Backspace');
            await page.keyboard.type(start_time, { delay: 100 });


            // 
            await page.click('[data-name="go-to-date-dialog"] div[data-name="tab-item-customrange"]')
            // 

            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(2) > :nth-child(1) input');
            await page.waitForTimeout(200);
            await page.keyboard.press('End');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(end_date, { delay: 100 });




            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(2) > :nth-child(2) input');
            await page.waitForTimeout(200);
            await page.keyboard.press('Backspace');
            await page.keyboard.type(end_time, { delay: 100 });



            // 
            await page.click('[data-name="go-to-date-dialog"] div[data-name="tab-item-customrange"]')
            // 


            await page.waitForTimeout(2000)
            await page.click('[data-name="go-to-date-dialog"] button[data-name="submit-button"]')
            await page.waitForTimeout(2000)
        }


        const token = await page.evaluate(async () => {
            return this._exposed_chartWidgetCollection.takeScreenshot()
        })

        res.json({ ok: true, token });
        console.log(ts, "Capture completed")

        // await recorder.stop();
        await page.close();
        errorsCount = 0;
    } catch (err) {
        console.log(ts, "Error capture: ", err.toString())
        res.json({ ok: false, error: err.toString() })
        errorsCount++;
        // await recorder.stop();
        // await page.close();
        // if (errorsCount === 3) process.exit(1)
        // if (errorsCount === 5) rebootServer()

    }


});


/******************************/

app.get('/video/:vid', async (req, res) => {
    const { vid } = req.params
    const fileName = 'screens/' + vid + ".mp4";
    const filePath = fileName;
    res.sendFile(filePath, { root: __dirname });
});

/*******************************/