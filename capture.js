const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
var FormData = require('form-data');

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

async function elementHasClass(el, className) {
    const classNames = (
        await (await el.getProperty('className')).jsonValue()
    ).split(/\s+/);

    return classNames.includes(className);
}

app.get('/start', async function (req, res) {
    browser = await puppeteer.launch(chromeOptions);
    page = await browser.newPage();
    await page.setRequestInterception(true);
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36");
    await page.setViewport({
        width: 1920,
        height: 1080,
    });



    // await page.type('#username', 'username');
    // await page.type('#password', 'password');

    // await page.click('#submit');

    // await page.waitForNavigation(); // <------------------------- Wait for Navigation

    // console.log('New Page URL:', page.url());

    // $(".tv-header__user-menu-button--anonymous").click()
    // $(".tv-header__user-menu-button--logged").click()
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





    const response = await page.goto(authUrl, { timeout: 25000, waitUntil: 'networkidle2', });
    if (await page.url() === authUrl) {
        console.log("login nashode");
        await page.click('.tv-signin-dialog__toggle-email')
        await page.type('input[name="username"]', 'username');
        await page.type('input[name="password"]', 'password');

    } else {
        console.log('login shode')
    }





    // const img = await page.screenshot();

    res.json(data);
});

app.get('/capture', async function (req, res) {
    var base = req.query.base;
    var exchange = req.query.exchange;
    var ticker = req.query.ticker;
    var interval = req.query.interval;
    const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval;
    console.log(url)
    await page.goto(url, { timeout: 25000, waitUntil: 'networkidle2', });
    const retrievedData = await page.evaluate(() => {
        return this._exposed_chartWidgetCollection.takeScreenshot()
    })

    res.end(retrievedData);
});

app.listen(7007);
