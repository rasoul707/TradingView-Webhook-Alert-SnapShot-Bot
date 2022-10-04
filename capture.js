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
const { spawn } = require('child_process')
const fs = require('fs');
const watermark = require('jimp-watermark');
const path = require("path")




const app = express();
let browser, useragent;

const chromeOptions = {
    headless: true,
    defaultViewport: null,
    args: [
        // "--incognito",
        "--no-sandbox",
        // "--single-process",
        // "--no-zygote",
        // "--disable-setuid-sandbox",
        // "--disable-dev-shm-usage",
        // "--disable-accelerated-2d-canvas",
        // "--disable-gpu",
        "--window-size=1920x1080",
    ],
    userDataDir: "./user_data"
};

const blockedResourceTypes = [
    // 'image',
    // 'media',
    // 'font',
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


const exitProc = () => {
    console.log("Exiting process...")
    setTimeout(() => {
        process.exit(1)
    }, 1000)
}


const runPythonBot = () => {
    spawn('python3', ['main.py'], { encoding: 'utf-8' });
    console.log("Py server running");
}



app.listen(7707, () => {
    console.log('Server is running on port 7707');
    // runPythonBot();
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
        const requestUrl = request.url().split('?')[0].split('#')[0];
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

    const authUrl = 'https://www.tradingview.com/accounts/signin/?next=https://www.tradingview.com';
    const username = req.query.username
    const password = req.query.password

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


        await page.goto(authUrl, { waitUntil: 'networkidle2', });

        // ****
        if (await page.url() === authUrl) {
            await page.waitForSelector('.tv-signin-dialog__toggle-email')

            // ****
            await page.click('.tv-signin-dialog__toggle-email')

            await page.type('input[name="username"]', username)
            await page.type('input[name="password"]', password)


            // ****

            await page.click('button[type="submit"]')
            await page.waitForTimeout(5000);


            // ****

            if (page.url() === authUrl) {
                await page.solveRecaptchas()
                await page.waitForTimeout(5000);


                // ****

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
            status = "loggedIn"
            ok = true
        }

        await page.close();
        res.json({ ok, status, username, password, useragent });
        // await browser.close()
        if (!ok) exitProc()
    }
    catch (err) {
        res.json({ ok: false, status: "Error", error: err.toString() })
        // await browser.close()
        exitProc()
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






async function downloadSnapshot(token) {
    return new Promise(async (resolve, reject) => {
        const id = token
        const m = token.substring(0, 1).toLowerCase()
        const imageUrl = `https://s3.tradingview.com/snapshots/${m}/${id}.png`
        const imagePath = `snapshots/${m}-${id}.png`
        // request.head(imageUrl, function (err, res, body) {
        //     console.log('content-type:', res.headers['content-type']);
        //     console.log('content-length:', res.headers['content-length']);
        //     console.log('err', err)
        //     request(imageUrl).pipe(fs.createWriteStream(imagePath)).on('close', () => { resolve(true) });
        // })
        // fetch(imageUrl)
        //     .then(res => {
        //         const dest = fs.createWriteStream(imagePath);
        //         res.body.pipe(dest)
        //         setTimeout(() => { resolve(true) }, 3000)
        //     })
        //     .catch(async (err) => {
        //         console.log('IMGErr', err)
        //         resolve(await downloadSnapshot(token))
        //     })
        // const _page = await newPage();
        // let img = await _page.goto(imageUrl)
        // if (img._status === 200) {
        //     fs.writeFileSync(imagePath, await img.buffer())
        //     setTimeout(() => { resolve(img) }, 3000)
        // }
        // console.log("err img")
        // img = await downloadSnapshot(token)
        // resolve(img)
        resolve(true)
    })
}


const getImageDir = (ticker, path) => {
    const t = new Date() - 0
    const d = new Date(t)
    const d1 = new Date(t - 1000)
    const d2 = new Date(t + 1000)

    const f = d.toISOString()
    const m = f.split("T")
    const md = m[0].split("-")
    const mt = m[1].split(".")[0].split(":")
    const imgPath = `${path}/${ticker}_${md[0]}-${md[1]}-${md[2]}_${mt[0]}-${mt[1]}-${mt[2]}.png`


    const f1 = d1.toISOString()
    const m1 = f1.split("T")
    const m1d = m1[0].split("-")
    const m1t = m1[1].split(".")[0].split(":")
    const img1Path = `${path}/${ticker}_${m1d[0]}-${m1d[1]}-${m1d[2]}_${m1t[0]}-${m1t[1]}-${m1t[2]}.png`


    const f2 = d2.toISOString()
    const m2 = f2.split("T")
    const m2d = m2[0].split("-")
    const m2t = m2[1].split(".")[0].split(":")
    const img2Path = `${path}/${ticker}_${m2d[0]}-${m2d[1]}-${m2d[2]}_${m2t[0]}-${m2t[1]}-${m2t[2]}.png`


    return [imgPath, img1Path, img2Path]
}




const getNewImageDir = (imgToken, path) => {
    const m = imgToken.substring(0, 1).toLowerCase()
    const imgName = m + "-" + imgToken + ".png"
    return path + "/" + imgName
}



const moveImage = async (oldpath, newpath, page) => {
    return new Promise((resolve, reject) => {
        fs.rename(oldpath[0], newpath, (err) => {
            if (err) {
                fs.rename(oldpath[1], newpath, (err) => {
                    if (err) {
                        fs.rename(oldpath[2], newpath, async (err) => {
                            if (err) {
                                await page.waitForTimeout(2000)
                                fs.rename(oldpath[0], newpath, (err) => {
                                    if (err) {
                                        fs.rename(oldpath[1], newpath, (err) => {
                                            if (err) {
                                                fs.rename(oldpath[2], newpath, async (err) => {
                                                    if (err) reject(err)
                                                    else resolve(true)
                                                })
                                            }
                                            else resolve(true)
                                        })
                                    } else resolve(true)
                                })
                            } else resolve(true)
                        })
                    } else resolve(true)
                })
            } else resolve(true)
        })
        resolve(true)
    })
}

app.get('/capture', async function (req, res) {

    const base = req.query.base
    const exchange = req.query.exchange
    const ticker = req.query.ticker
    const interval = req.query.interval
    const zoom = req.query.zoom

    const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval


    const ts = new Date().getTime()
    console.log(ts, "New Capture")
    let token = null

    try {
        const page = await newPage()
        await page.goto(url, { waitUntil: 'networkidle2', }).catch(err => { throw "NavigateFailed" + err })


        if (zoom) {
            for (let i = 0; i < zoom; i++) {
                page.keyboard.press('ControlLeft')
                await page.keyboard.press('ArrowUp')
            }
        }

        const downloadPath = path.resolve('./snap_downloads')
        await page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath })


        token = await page.evaluate(async () => this._exposed_chartWidgetCollection.takeScreenshot())


        page.keyboard.press('ControlLeft')
        page.keyboard.press('AltLeft')
        await page.keyboard.press('KeyS')


        const oldImageDir = getImageDir(ticker, 'snap_downloads')
        const newImageDir = getNewImageDir(token, 'snapshots')


        await page.waitForTimeout(2000)


        await moveImage(oldImageDir, newImageDir, page).catch((err) => { throw "moveError" + err })


        console.log(ts, "Capture completed")
        res.json({ ok: true, token })
    }
    catch (error) {
        console.log(ts, "Error capture: ", error.toString())
        res.json({ ok: false, error: error.toString(), token })
    }

})









// app.get('/capture', async function (req, res) {
// var base = req.query.base;
// var exchange = req.query.exchange;
// var ticker = req.query.ticker;
// var interval = req.query.interval;
// var zoom = req.query.zoom;
// const url = 'https://www.tradingview.com/' + base + '?symbol=' + exchange + ':' + ticker + '&interval=' + interval;

// const ts = new Date().getTime();
// console.log(ts, "New Capture")




//     try {
//         // browser = await puppeteer.launch(chromeOptions);
//         const page = await newPage();

//         await page.goto(url, { waitUntil: 'networkidle2', })

//         await page.waitForTimeout(1000)

//         // await page.waitForSelector('#header-toolbar-symbol-search', { visible: true, });
//         // await page.waitForSelector('[data-name="legend-series-item"] .loader-OYqjX7Sg', { hidden: true, });

//         // await page.waitForTimeout(1000);

//         // page.keyboard.press('AltLeft');
//         // await page.keyboard.press('KeyR');







//         console.log("GGGG")

//         const downloadPath = path.resolve('./snapshots');
//         await page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });


//         page.keyboard.press('ControlLeft')
//         page.keyboard.press('AltLeft')
//         await page.keyboard.press('KeyS')


// const token = await page.evaluate(async () => {
//     return this._exposed_chartWidgetCollection.takeScreenshot()
// })
//         // await downloadSnapshot(token)




//         await page.close()

//         res.json({ ok: true, token })
//         console.log(ts, "Capture completed")
//     } catch (err) {
//         console.log(ts, "Error capture: ", err.toString())
//         res.json({ ok: false, error: err.toString() })
//     }

//     // await browser.close()

// });


/******************************/








app.get('/snapshots/watermark', async (req, res) => {
    const filePath = req.query.filePath
    const topWatermark = req.query.topWatermark
    try {
        const options = {
            'opacity': 1,
            'ratio': 1,
            'dstPath': filePath
        }
        if (topWatermark === "True") {
            watermark.addWatermark(
                filePath,
                'assets/top_watermark.png',
                options
            )
        } else {
            watermark.addWatermark(
                filePath,
                'assets/back_watermark.png',
                options
            )
        }
        res.json({ ok: true })
    }
    catch (e) {
        res.json({ ok: false })
    }
})




app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));


app.get('/snapshots/:id', async (req, res) => {
    const { id } = req.params
    const fileName = id + '.png'
    const filePath = 'snapshots/' + fileName
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath, { root: __dirname })
    }
    else {
        res.sendFile('assets/center_watermark.png', { root: __dirname })
    }
})

app.get('/preview/:id', async (req, res) => {
    const { id } = req.params
    const fileName = id
    try {
        res.render('preview', {
            title: "The title",
            subtitle: "The subtitle",
            description: "The description",
            url: '/preview/' + fileName,
            image: '/snapshots/' + fileName,
        });
    }
    catch (e) {
        res.render('preview', {
            title: "The title",
            subtitle: "The subtitle",
            description: "The description",
            url: '/preview/' + fileName,
            image: '/snapshots/' + fileName,
        });
    }
})

/*******************************/