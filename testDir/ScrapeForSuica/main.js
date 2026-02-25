// dotenvをインポートして使用
require('dotenv').config();
const puppeteer = require('puppeteer');

const JREID = process.env.JRE_ID;
const PASSWORD = process.env.PASSWORD;

(async () => {
    const url = 'https://www.mobilesuica.com/';
    const browser = await puppeteer.launch({
        headless: false
    });
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    await page.goto(url);
    await page.waitForSelector('.acc-title');
    await page.click('.acc-title');
    await page.waitForSelector('.to-jresite-btn');
    const href = await page.$eval('.to-jresite-btn', el => el.getAttribute('href'));
    // StartApplication('URL') の URL 部分だけ抜き出す
    const url2 = href.match(/StartApplication\('(.+?)'\)/)[1];
    await page.goto(url2);
    // ID を入力
    await page.waitForSelector('input[name="id"]');
    await page.type('input[name="id"]', JREID, { delay: 100 });

    // パスワードを入力
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', PASSWORD, { delay: 100 });

    // ① 入力欄からフォーカスを外すために画面の適当な場所をクリック
    await page.mouse.click(10, 10);  // 画面左上あたりをクリック

    // ② ボタンが enabled になるまで待つ
    await page.waitForFunction(() => {
    const btn = document.querySelector('.c-btn.c-form-btn__submit');
    return btn && !btn.disabled;
    });
    // ③ ログインボタンをクリック
    await page.click('.c-btn.c-form-btn__submit');
    // ④ 遷移を待つ
    await page.waitForNavigation();
})();