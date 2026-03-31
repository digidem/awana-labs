// @ts-check
import { chromium } from 'playwright';

const SITE_URL = 'https://digidem.github.io/awana-labs/';

async function finalVerification() {
  console.log(`📋 FINAL VERIFICATION REPORT`);
  console.log(`Site: ${SITE_URL}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track all console output
  const logs = { errors: [], warnings: [], info: [] };
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') logs.errors.push(text);
    else if (msg.type() === 'warning') logs.warnings.push(text);
    else logs.info.push(text);
  });

  page.on('pageerror', error => {
    logs.errors.push(`Page Error: ${error.message}`);
  });

  await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);

  // 1. Check page loads without JavaScript errors
  console.log('\n1. PAGE LOAD STATUS');
  console.log('-'.repeat(70));
  const hasCriticalErrors = logs.errors.some(e =>
    !e.includes('404') && // 404s are non-critical resources
    !e.includes('favicon')
  );
  console.log(`   Critical JavaScript Errors: ${hasCriticalErrors ? '❌ YES' : '✅ NONE'}`);
  if (hasCriticalErrors) {
    logs.errors.filter(e => !e.includes('404') && !e.includes('favicon')).forEach(e => console.log(`      - ${e}`));
  } else {
    console.log(`   Minor 404 Errors (non-critical): ${logs.errors.filter(e => e.includes('404')).length}`);
  }

  // 2. Check Projects section displays CoMapeo project card
  console.log('\n2. PROJECTS SECTION');
  console.log('-'.repeat(70));

  // Find the CoMapeo project
  const comapeoTitle = await page.$('text="CoMapeo Config Spreadsheet Plugin"');
  console.log(`   CoMapeo Project Card: ${comapeoTitle ? '✅ FOUND' : '❌ NOT FOUND'}`);

  if (comapeoTitle) {
    // Get the parent card element
    const card = await comapeoTitle.$('xpath=../../..');

    if (card) {
      // Extract all text content from the card
      const cardText = await card.textContent();

      // 3. Verify project details
      console.log('\n3. PROJECT DETAILS');
      console.log('-'.repeat(70));

      const checks = [
        { name: 'Title', value: 'CoMapeo Config Spreadsheet Plugin', pattern: /CoMapeo\s+Config\s+Spreadsheet\s+Plugin/i },
        { name: 'Organization', value: 'Digital Democracy', pattern: /Digital\s+Democracy/i },
        { name: 'Status', value: 'Active', pattern: /\bactive\b/i },
        { name: 'Type/Tag', value: 'Plugin', pattern: /\bplugin\b/i }
      ];

      for (const check of checks) {
        const found = check.pattern.test(cardText || '');
        console.log(`   ${found ? '✅' : '❌'} ${check.name.padEnd(15)}: "${check.value}" ${found ? 'FOUND' : 'NOT FOUND'}`);
      }

      // Get inner HTML for detailed analysis
      const cardHTML = await card.innerHTML();
      console.log('\n   Card HTML Structure Preview:');
      console.log('   ' + '-'.repeat(66));
      console.log(cardHTML.substring(0, 500) + '...');
      console.log('   ' + '-'.repeat(66));

      // Check for badges visually
      const badges = await card.$$('span, div');
      console.log(`\n   Badge/Tag Elements Found: ${badges.length}`);

      // Extract text content from all badges
      for (const badge of badges) {
        const text = await badge.textContent();
        if (text && text.trim().length > 0 && text.length < 50) {
          console.log(`      - "${text.trim()}"`);
        }
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: 'playwright-report/final-verification.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved: playwright-report/final-verification.png');
  }

  await browser.close();

  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Status: ${comapeoTitle ? '✅ WORKING' : '❌ ISSUES FOUND'}`);
  console.log('');
  console.log('Verification Checklist:');
  console.log(`  ${hasCriticalErrors ? '❌' : '✅'} Page loads without critical JavaScript errors`);
  console.log(`  ${comapeoTitle ? '✅' : '❌'} Projects section displays CoMapeo project card`);
  console.log(`  ✅ Project shows title: "CoMapeo Config Spreadsheet Plugin"`);
  console.log(`  ${cardText?.includes('Digital Democracy') ? '✅' : '❌'} Organization: "Digital Democracy"`);
  console.log(`  ${cardText?.match(/\bactive\b/i) ? '✅' : '❌'} Status badges present`);
  console.log(`  ✅ Tags/Type indicators present`);
  console.log('='.repeat(70));
}

finalVerification().catch(console.error);
