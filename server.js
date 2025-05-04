import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import puppeteer from 'puppeteer-core';

const app = express();
app.use(cors());

app.get('/ads', async (req, res) => {
  const keyword = req.query.q || 'free shipping';
  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[role="article"]', { timeout: 20000 });

    const results = await page.evaluate(() => {
      const data = [];
      const blocks = document.querySelectorAll('[role="article"]');
      blocks.forEach(block => {
        const adLink = block.querySelector('a[href*="/ads/library/?id="]')?.href || '';
        const campaignText = [...block.querySelectorAll('span')].map(s => s.textContent).find(text => text.includes('ad campaigns')) || '';
        const campaignMatch = campaignText.match(/part of (\d+) ad campaigns/);
        const campaignCount = campaignMatch ? parseInt(campaignMatch[1]) : 0;
        const startDate = [...block.querySelectorAll('span')].map(s => s.textContent).find(text => text.includes('Ad started running on'))?.replace('Ad started running on ', '') || '';
        const pageName = block.querySelector('a[aria-label]')?.getAttribute('aria-label') || '';

        if (adLink) {
          data.push({ ad_link: adLink, campaigns: campaignCount, start_date: startDate, page_name: pageName });
        }
      });

      return data;
    });

    res.json(results);
  } catch (err) {
    console.error('Scrape failed:', err.message);
    res.status(500).json({ error: 'Scrape failed' });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
