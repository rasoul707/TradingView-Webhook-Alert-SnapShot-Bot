const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const UserAgent = require('user-agents');

let browser, page;

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


app.get('/start', async function (req, res) {
    const userAgent = new UserAgent({ "deviceCategory": "desktop" })
    const useragent = userAgent.toString()
    browser = await puppeteer.launch(chromeOptions);
    page = await browser.newPage();
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

    const img = await page.screenshot();

    res.json({ ok, status, img, username, password, useragent });
});

app.get('/capture', async function (req, res) {
    var base = req.query.base;
    var exchange = req.query.exchange;
    var ticker = req.query.ticker;
    var interval = req.query.interval;
    const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval;
    await page.goto(url, { timeout: 25000, waitUntil: 'networkidle2', }).then(async () => {
        console.log('Success')


        const retrievedData = await page.evaluate(async () => {

            const isMac = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

            document.activeElement.dispatchEvent(
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Alt',
                    code: 'AltLeft',
                    location: window.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
                    getModifierState: (keyArg) => keyArg === 'Alt',
                    ctrlKey: false,
                    metaKey: false,
                    altKey: true,
                    charCode: 0,
                    keyCode: 18,
                    which: 18,
                })
            );

            const preventableEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'm',
                code: 'KeyM',
                location: window.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
                getModifierState: (keyArg) => keyArg === 'Alt',
                ctrlKey: false,
                metaKey: false,
                altKey: true,
                charCode: 0,
                keyCode: 77,
                which: 77,
            });

            const wasPrevented = (
                !document.activeElement.dispatchEvent(preventableEvent) ||
                preventableEvent.defaultPrevented
            );

            await sleep(2000);

            if (!wasPrevented) {
                // document.execCommand('selectall', false, null);
                console.log("cant zoom out")
            }

            document.activeElement.dispatchEvent(
                new KeyboardEvent('keyup', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Alt',
                    code: 'AltLeft',
                    location: window.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
                    getModifierState: () => false,
                    charCode: 0,
                    keyCode: 18,
                    which: 18,
                }),
            );

            return this._exposed_chartWidgetCollection.takeScreenshot()
        })
        // 
        res.end(retrievedData);
    }).catch((err) => {
        console.log('Failed', err)
        res.end('error')
    })


});

app.listen(7007);
