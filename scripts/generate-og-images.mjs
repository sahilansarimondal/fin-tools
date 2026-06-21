import puppeteer from 'puppeteer-core';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const pages = [
  {
    file: 'og-barista-fire-calculator.png',
    title: 'Barista FIRE Calculator',
    subtitle: 'Plan Your Semi-Retirement with Part-Time Work',
  },
  {
    file: 'og-barista-fire.png',
    title: 'Barista FIRE',
    subtitle: 'What It Is, How to Calculate, and Best Jobs',
  },
  {
    file: 'og-fire-calculator.png',
    title: 'FIRE Calculator',
    subtitle: 'Plan Your Early Retirement',
  },
  {
    file: 'og-lean-fire-calculator.png',
    title: 'Lean FIRE Calculator',
    subtitle: 'Minimalist Approach to Early Retirement',
  },
  {
    file: 'og-fat-fire-calculator.png',
    title: 'Fat FIRE Calculator',
    subtitle: 'Luxury Retirement Planning',
  },
  {
    file: 'og-coast-fire-number.png',
    title: 'Coast FIRE Number',
    subtitle: 'Let Compound Interest Do the Work',
  },
  {
    file: 'og.png',
    title: 'True Finance Tools',
    subtitle: 'Financial Independence Calculators',
  },
];

const htmlTemplate = (title, subtitle) => `<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${OG_WIDTH}px;
      height: ${OG_HEIGHT}px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #007cf0 0%, #00dfd8 50%, #7928ca 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 48px 56px;
      max-width: 1000px;
      width: 90%;
      box-shadow: 0 24px 48px rgba(0,0,0,0.15);
      text-align: center;
    }
    .label {
      display: inline-block;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #0070f3;
      background: #d3e5ff;
      padding: 4px 12px;
      border-radius: 100px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 42px;
      font-weight: 600;
      letter-spacing: -1.5px;
      line-height: 1.1;
      color: #171717;
      margin-bottom: 12px;
    }
    p {
      font-size: 20px;
      font-weight: 400;
      color: #4d4d4d;
      line-height: 1.4;
    }
    .footer {
      margin-top: 32px;
      font-size: 14px;
      color: #888888;
    }
    .logo {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: -0.3px;
      color: #171717;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="label">True Finance Tools</div>
    <h1>${title}</h1>
    <p>${subtitle}</p>
    <div class="footer">
      <span class="logo">truefinancetools.com</span>
    </div>
  </div>
</body>
</html>`;

async function generate() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const page of pages) {
    const html = htmlTemplate(page.title, page.subtitle);
    const tempFile = join('/tmp', page.file.replace('.png', '.html'));
    writeFileSync(tempFile, html);

    const tab = await browser.newPage();
    await tab.setViewport({ width: OG_WIDTH, height: OG_HEIGHT });
    await tab.goto(`file://${tempFile}`, { waitUntil: 'networkidle0' });
    await tab.screenshot({
      path: join(publicDir, page.file),
      clip: { x: 0, y: 0, width: OG_WIDTH, height: OG_HEIGHT },
    });
    await tab.close();
    console.log(`Generated ${page.file}`);
  }

  await browser.close();
  console.log('\nAll OG images generated in public/');
}

generate().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
