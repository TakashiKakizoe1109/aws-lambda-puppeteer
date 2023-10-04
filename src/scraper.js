const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

async function Scraper(url, puppeteerOptions = {}) {
    const _ = {
        browser: null,
        page: null,
        response: null,

        setBrowserAndPage: async function (options) {
            const defaultOptions = {
                args: [
                    ...chromium.args,
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-accelerated-2d-canvas",
                    "--no-first-run",
                    "--no-zygote",
                    "--single-process",
                    "--disable-gpu",
                ],
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
                defaultViewport: {width: 1440, height: 900},
                slowMo: 0,
                deviceScaleFactor: 1,
                isMobile: false,
                hasTouch: false,
                isLandscape: false,
                handleSIGINT: true,
                handleSIGTERM: true,
                handleSIGHUP: true,
                timeout: 30000,
                devtools: false,
            };

            this.browser = await puppeteer.launch({
                ...defaultOptions, // Spread default options
                ...options,  // Override/extend with user-provided options
            });
            this.page = await _.browser.newPage();
        },

        closePageAndBrowser: async function () {
            if (this.page) {
                await this.page.close();
            }
            if (this.browser) {
                await this.browser.close();
            }
        },

        avoidBotDetection: async function () {

            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'); // ChangeUA

            await this.page.evaluateOnNewDocument(() => {

                Object.defineProperty(navigator, "webdriver", {get: () => false,}); // WebDriver auto access
                Object.defineProperty(navigator, "plugins", {
                    get: () => {
                        return [1, 2, 3, 4, 5];
                    },
                }); // Plugin Count
                Object.defineProperty(navigator, "languages", {get: () => ["ja", "en-US", "en"],}); // languages
                Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
                    get: function () {
                        return window;
                    },
                }); // iframe test

                // Chrome detection
                window.navigator.chrome = {runtime: {},};
                window.chrome = {runtime: {},};
                window.console.debug = () => {
                    return null;
                }; // console.debug

                // window.navigator.permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.__proto__.query = (parameters) =>
                    parameters.name === "notifications"
                        ? Promise.resolve({
                            state: Notification.permission,
                        })
                        : originalQuery(parameters);

                const oldCall = Function.prototype.call;

                function call() {
                    return oldCall.apply(this, arguments);
                }

                Function.prototype.call = call;
                const nativeToStringFunctionString = Error.toString().replace(
                    /Error/g,
                    "toString"
                );
                const oldToString = Function.prototype.toString;

                function functionToString() {
                    if (this === window.navigator.permissions.query) {
                        return "function query() { [native code] }";
                    }
                    if (this === functionToString) {
                        return nativeToStringFunctionString;
                    }
                    return oldCall.call(oldToString, this);
                }

                Function.prototype.toString = functionToString;

                // WebGL
                const getParameter = WebGLRenderingContext.getParameter;
                WebGLRenderingContext.prototype.getParameter = function (parameter) {
                    if (parameter === 37445) {
                        return 'Intel Open Source Technology Center';
                    }
                    if (parameter === 37446) {
                        return 'Mesa DRI Intel(R) Ivybridge Mobile ';
                    }
                    return getParameter(parameter);
                };

                // Random mousemove
                let lastTime = 0;
                const events = ['mousemove', 'mousedown', 'mouseup'];

                function simulateMouseEvents() {
                    const event = new Event(events[Math.floor(Math.random() * events.length)]);
                    document.dispatchEvent(event);
                    lastTime = Date.now();
                }

                setInterval(() => {
                    if (Date.now() - lastTime > 4000) { // over 4s stop
                        simulateMouseEvents();
                    }
                }, 2000); // 2s
            });
        },

        requestControl: async function () {
            await this.page.setRequestInterception(true);
            this.page.on('request', interceptedRequest => {
                const requestUrl = interceptedRequest.url();
                const blockedPatterns = [
                    'www.google-analytics.com',
                    'www.googletagmanager.com',
                    'clarity.ms',
                ];
                if (
                    interceptedRequest.resourceType() === 'xhr' &&
                    blockedPatterns.some(pattern => requestUrl.includes(pattern))
                ) {
                    interceptedRequest.abort();  // abort
                } else {
                    interceptedRequest.continue();  // continue
                }
            });
        },

    };

    try {
        await _.setBrowserAndPage(puppeteerOptions);
        await _.avoidBotDetection();
        await _.requestControl();

        await _.page.goto(url);
        await _.page.waitForTimeout(1500);

        const title = await _.page.title();
        let description = '';
        try {
            description = await _.page.$eval('meta[name="description"]', (element) => element.content);
        } catch (error) {
            console.warn('Description meta tag not found');
        }

        _.response = {
            statusCode: 200,
            body: JSON.stringify({
                title: title,
                description: description,
            }),
        };
    } catch (error) {
        console.error(error);
        _.response = {
            statusCode: 500,
            body: JSON.stringify({
                error: 'An error occurred while trying to fetch the page details',
            }),
        };
    } finally {
        await _.closePageAndBrowser();
    }

    return _.response;
}

module.exports = {
    Scraper,
};
