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
        await page.waitForTimeout(5000);
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
    res.json({ ok, status, username, password, useragent });
});


const dateTimeRange = (interval, candles) => {
    interval = interval.toUpperCase();
    const types = ['H', 'D', 'W', 'M', 'Y']
    const temp = interval.slice(-1)
    const now = moment()


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
            now.endOf('hour').add(1, 'second')
        }
        if (duration === 'D') {
            _start = { days: number }
            _end = { days: 10 }
            now.endOf('day').add(1, 'second')
        }
        if (duration === 'W') {
            _start = { weeks: number }
            _end = { weeks: 10 }
            now.endOf('week').add(1, 'second')
        }
        if (duration === 'M') {
            _start = { months: number }
            _end = { months: 10 }
            now.endOf('month').add(1, 'second')
        }
        if (duration === 'Y') {
            _start = { years: number }
            _end = { years: 10 }
            now.endOf('year').add(1, 'second')
        }
    }
    else {
        let number = parseInt(interval)
        number = candles * number
        _start = { minutes: number }
        _end = { minutes: 10 }
        now.endOf('minute').add(1, 'second')
    }
    const start = now.clone().subtract(_start)
    const end = now.clone().add(_end)
    return { start, end }
}


const uploadImg = async (_page, ii) => {
    const img = await _page.screenshot();
    const n = await fetch('https://api.upload.io/v1/files/basic', {
        method: 'POST',
        headers: {
            Authorization: "Bearer public_12a1xk8CY7DbH49KvyPFABVpCSws",
            "Content-Type": "image/png"
        },
        body: img
    })
    console.log(ii, await n.json())
}

app.get('/capture', async function (req, res) {
    var base = req.query.base;
    var exchange = req.query.exchange;
    var ticker = req.query.ticker;
    var interval = req.query.interval;
    var candles = req.query.candles;


    const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval;
    const page = await newPage();
    console.log("#", url)
    await page.goto(url, { timeout: 25000, waitUntil: 'networkidle2', }).then(async () => {


        page.keyboard.press('AltLeft');
        await page.keyboard.press('KeyR');


        if (candles) {
            await page.waitForTimeout(200);
            page.keyboard.press('AltLeft');
            await page.keyboard.press('KeyG');


            const { start, end } = dateTimeRange(interval, candles)

            const start_date = start.format("YYYYMMDD")
            const end_date = end.format("YYYYMMDD")
            const start_time = start.format("HHmm")
            const end_time = end.format("HHmm")

            console.log(start_date, start_time, end_date, end_time)


            await page.waitForTimeout(1000);
            await page.click('[data-name="go-to-date-dialog"] div[data-name="tab-item-customrange"]')
            await page.waitForTimeout(200);




            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(1) > :nth-child(1) input');
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


            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(1) > :nth-child(2) input');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(start_time, { delay: 200 });





            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(2) > :nth-child(1) input');
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


            await page.focus('[data-name="go-to-date-dialog"] .bodyWrapper-70bfoXiO > div > :nth-child(2) > :nth-child(2) input');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(end_time, { delay: 200 });




            await uploadImg(page, 1)
            await page.click('[data-name="go-to-date-dialog"] button[data-name="submit-button"]')
            await page.waitForTimeout(200);
        }


        const token = await page.evaluate(async () => {
            return this._exposed_chartWidgetCollection.takeScreenshot()
        })
        console.log('Success')


        res.end(token);
    }).catch((err) => {
        console.log('Failed', err)
        res.end('error')
    })


    await page.close();

});

app.listen(7007);
