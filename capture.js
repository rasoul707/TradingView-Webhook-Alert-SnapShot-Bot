const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const UserAgent = require('user-agents');
const fetch = require('node-fetch');


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


// const types

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
        if (candles > 0) {
            page.keyboard.press('AltLeft');
            await page.keyboard.press('KeyG');

            start_date = "2022-04-24"
            end_date = "2022-05-26"
            start_time = "18:30"
            end_time = "21:30"

            //     document.querySelectorAll('.row-9XF0QIKT:nth-child(1) input')[0].value = start_date
            //     document.querySelectorAll('.row-9XF0QIKT:nth-child(2) input')[0].value = end_date

            //     document.querySelectorAll('.row-9XF0QIKT:nth-child(1) input')[1].value = start_time
            //     document.querySelectorAll('.row-9XF0QIKT:nth-child(2) input')[1].value = end_time

            //     document.querySelector('.submitButton-xe9kH1lJ button').click()
            await page.waitFor(".row-9XF0QIKT");
            await page.type('.row-9XF0QIKT:nth-child(1) input', '20220422', { delay: 500 });
            // await page.$eval('table tr td:nth-child(2)', el => { return el.innerHTML });
        }
        else {

        }

        const retrievedData = await page.evaluate(async () => {
            return this._exposed_chartWidgetCollection.takeScreenshot()
        })
        console.log('Success')

        const img = await page.screenshot();
        const n = await fetch('https://api.upload.io/v1/files/basic', {
            method: 'POST',
            headers: {
                Authorization: "Bearer public_12a1xk8CY7DbH49KvyPFABVpCSws",
                "Content-Type": "image/png"
            },
            body: img
        })
        console.log(await n.json())


        res.end(retrievedData);
    }).catch((err) => {
        console.log('Failed', err)
        res.end('error')
    })


    await page.close();

});

app.listen(7007);
