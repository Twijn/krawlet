import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function takeScreenshots() {
	const browser = await chromium.launch();

	// Desktop screenshot (1280x720 as specified in site.webmanifest)
	const desktopContext = await browser.newContext({
		viewport: { width: 1280, height: 720 }
	});
	const desktopPage = await desktopContext.newPage();
	await desktopPage.goto(BASE_URL, { waitUntil: 'load' });
	// Wait a bit for any client-side rendering
	await desktopPage.waitForTimeout(2000);
	await desktopPage.screenshot({
		path: join(__dirname, '../static/images/screenshot-desktop.png'),
		fullPage: false
	});
	console.log('✓ Desktop screenshot saved to static/images/screenshot-desktop.png');
	await desktopContext.close();

	// Mobile screenshot (750x1334 as specified in site.webmanifest)
	const mobileContext = await browser.newContext({
		viewport: { width: 750, height: 1334 }
	});
	const mobilePage = await mobileContext.newPage();
	await mobilePage.goto(BASE_URL, { waitUntil: 'load' });
	// Wait a bit for any client-side rendering
	await mobilePage.waitForTimeout(2000);
	await mobilePage.screenshot({
		path: join(__dirname, '../static/images/screenshot-mobile.png'),
		fullPage: false
	});
	console.log('✓ Mobile screenshot saved to static/images/screenshot-mobile.png');
	await mobileContext.close();

	await browser.close();
	console.log('\nAll screenshots captured successfully!');
}

takeScreenshots().catch((error) => {
	console.error('Error taking screenshots:', error);
	process.exit(1);
});
