const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const UserAgent = require('user-agents');
const fetch = require('node-fetch');
const moment = require('moment');

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
    'google',
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


const sleep = ms => new Promise(r => setTimeout(r, ms));

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


app.get('/start', async function (req, res) {
    const userAgent = new UserAgent({ "deviceCategory": "desktop" })
    useragent = userAgent.toString()

    browser = await puppeteer.launch(chromeOptions);
    const page = await newPage();

    const authUrl = 'https://www.tradingview.com/accounts/signin/?next=https://www.tradingview.com';
    const username = req.query.username
    const password = req.query.password

    let status = ''
    let ok = false
    await page.goto(authUrl, { timeout: 25000, waitUntil: 'networkidle2', });
    if (await page.url() === authUrl) {
        await page.click('.tv-signin-dialog__toggle-email')
        await page.type('input[name="username"]', username)
        await page.type('input[name="password"]', password)
        await page.click('button[type="submit"]')
        await sleep(5000);
        if (page.url() === authUrl) {
            status = "error"
            ok = false
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
    res.json({ ok, status, img: "", username, password, useragent });
});


const dateTimeRange = (interval, candles) => {
    interval = interval.toUpperCase();
    const types = ['H', 'D', 'W', 'M', 'Y']
    const temp = interval.slice(-1)
    const now = moment()

    let start = now.clone()
    let _start = {}
    let _end = {}
    candles = parseInt(candles)
    if (!candles || isNaN(candles)) candles = 1
    if (types.includes(temp)) {
        let duration = temp
        let number = parseInt(interval.substring(0, interval.length - 1))
        if (!number || isNaN(number)) number = 1
        number = candles * number

        if (duration === 'H') {
            _start = { hours: number }
            _end = { hours: 10 }
        }
        if (duration === 'D') {
            _start = { days: number }
            _end = { days: 10 }
        }
        if (duration === 'W') {
            _start = { weeks: number }
            _end = { weeks: 10 }
        }
        if (duration === 'M') {
            _start = { months: number }
            _end = { months: 10 }
        }
        if (duration === 'Y') {
            _start = { years: number }
            _end = { years: 10 }
        }
    }
    else {
        let number = parseInt(interval)
        number = candles * number
        _start = { minutes: number }
        _end = { minutes: 10 }
    }
    start.subtract(_start)
    end = now.clone().add(_end)
    return { start, end }
}


app.get('/capture', async function (req, res) {
    var base = req.query.base;
    var exchange = req.query.exchange;
    var ticker = req.query.ticker;
    var interval = req.query.interval;
    var candles = req.query.candles;



    const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval;
    const page = await newPage();
    await page.goto(url, { timeout: 25000, waitUntil: 'networkidle2', }).then(async () => {
        page.keyboard.press('AltLeft');
        await page.keyboard.press('KeyR');

        if (candles) {
            page.keyboard.press('AltLeft');
            await page.keyboard.press('KeyG');

            const { start, end } = dateTimeRange(interval, candles)

            console.log(start, end)

            start_date = start.format("YYYYMMDD")
            end_date = end.format("YYYYMMDD")
            start_time = start.format("HH:mm")
            end_time = end.format("HH:mm")


            await page.waitFor(".row-9XF0QIKT");


            await page.focus('.row-9XF0QIKT:nth-child(1) input');
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
            await page.keyboard.type(start_date, { delay: 200 });


            await page.focus('.row-9XF0QIKT:nth-child(2) input');
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
            await page.keyboard.type(end_date, { delay: 200 });


            await page.focus('.row-9XF0QIKT:nth-child(1) input:not([data-name="start-date-range"])');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(start_time, { delay: 200 });


            await page.focus('.row-9XF0QIKT:nth-child(2) input:not([data-name="end-date-range"])');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(end_time, { delay: 200 });

            await page.click('[data-name="go-to-date-dialog"] button[data-name="submit-button"]')



        }
        else {

        }

        const retrievedData = await page.evaluate(async () => {
            return this._exposed_chartWidgetCollection.takeScreenshot()
        })
        console.log('Success')

        // const img = await page.screenshot();
        // const n = await fetch('https://api.upload.io/v1/files/basic', {
        //     method: 'POST',
        //     headers: {
        //         Authorization: "Bearer public_12a1xk8CY7DbH49KvyPFABVpCSws",
        //         "Content-Type": "image/png"
        //     },
        //     body: img
        // })
        // console.log(await n.json())


        res.end(retrievedData);
    }).catch((err) => {
        console.log('Failed', err)
        res.end('error')
    })


    await page.close();

});

app.listen(7007);
