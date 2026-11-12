/**
 * Wakes the free Render API.
 * Render answers a sleeping service with a "waking up" HTML page and starts the server only when that
 * page runs in a real browser — a plain ping (cron-job.org, Vercel proxy) cannot wake it.
 * So we open the URL in headless Chrome and wait until the API answers {"status":"ok"}.
 */
import puppeteer from 'puppeteer-core';

const url = process.env.WAKE_URL;
const executablePath = process.env.CHROME_PATH;
const DEADLINE_MS = 4 * 60_000;

const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage();
const deadline = Date.now() + DEADLINE_MS;
let awake = false;

while (Date.now() < deadline) {
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
    const body = await page.evaluate(() => document.body.innerText);
    if (res?.status() === 200 && body.includes('"status":"ok"')) {
      awake = true;
      break;
    }
    console.log(`Still waking up (HTTP ${res?.status()})…`);
  } catch (error) {
    console.log(`Retrying: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 15_000)); // the wake-up page keeps working meanwhile
}

await browser.close();
console.log(awake ? '✅ API is awake' : '❌ API did not wake up in time');
process.exit(awake ? 0 : 1);
