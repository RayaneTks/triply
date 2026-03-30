import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:3014';
const outputDir = path.resolve('.tmp', 'mobile-qa');
fs.mkdirSync(outputDir, { recursive: true });

const scenarios = [
  { name: 'iphone-13', device: devices['iPhone 13'] },
  { name: 'pixel-7', device: devices['Pixel 7'] },
];

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    console.error(`[launch] playwright chromium failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  throw new Error('Unable to launch a Playwright browser');
}

async function runScenario(browser, scenario) {
  const context = await browser.newContext({
    ...scenario.device,
    baseURL: baseUrl,
    locale: 'fr-FR',
    colorScheme: 'light',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const consoleIssues = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleIssues.push(`[console] ${message.text()}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      consoleIssues.push(`[response ${response.status()}] ${response.url()}`);
    }
  });
  page.on('pageerror', (error) => {
    consoleIssues.push(`[pageerror] ${error.message}`);
  });

  const capture = async (name) => {
    await page.screenshot({
      path: path.join(outputDir, `${scenario.name}-${name}.png`),
      fullPage: true,
    });
  };

  await page.goto('/', { waitUntil: 'networkidle' });
  const startButton = page.getByRole('button', { name: /Creer mon voyage/i });
  await startButton.waitFor();
  await capture('home');
  await page.waitForTimeout(1200);

  await startButton.evaluate((button) => button.click());
  await page.waitForTimeout(800);
  await capture('after-primary');
  const guidanceButton = page.getByRole('button', { name: /Triply m aide|Planification guidee/i });
  await guidanceButton.waitFor();
  await capture('guidance');

  await guidanceButton.evaluate((button) => button.click());
  await page.getByRole('heading', { name: /Depart et destination/i }).first().waitFor();
  await capture('planner-step-1');

  const assistantCloseButton = page.getByRole('button', { name: /Fermer l assistant/i }).last();
  const assistantAlreadyOpen = await assistantCloseButton.isVisible().catch(() => false);

  if (!assistantAlreadyOpen) {
    await page.getByRole('button', { name: /Ouvrir l assistant|Assistant/i }).first().click();
  }

  await page.getByText(/Mon voyage/i).waitFor({ timeout: 5000 });
  await capture('assistant-open');
  await assistantCloseButton.click();

  await page.getByRole('link', { name: /^Voyages$/i }).click();
  await page.getByRole('heading', { name: /Mes voyages/i }).waitFor();
  await capture('voyages');

  await page.getByRole('link', { name: /^Profil$/i }).click();
  await page.getByRole('heading', { name: /Profil/i }).waitFor();
  await capture('profil');

  await context.close();

  return {
    scenario: scenario.name,
    consoleIssues,
  };
}

const browser = await launchBrowser();
const results = [];

try {
  for (const scenario of scenarios) {
    results.push(await runScenario(browser, scenario));
  }
} finally {
  await browser.close();
}

const reportPath = path.join(outputDir, 'report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

const issueCount = results.reduce((total, item) => total + item.consoleIssues.length, 0);
console.log(JSON.stringify({ outputDir, reportPath, issueCount, results }, null, 2));
