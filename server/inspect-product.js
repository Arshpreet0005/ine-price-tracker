const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto("https://demo.inelabteamdev.com/product/891", {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  const revealButton = page.getByRole("button", {
    name: /reveal price/i
  });

  if (await revealButton.count()) {
    await revealButton.click();
  }

  await page.waitForTimeout(5000);

  const priceElements = await page.locator("text=/₹/").all();

  console.log(`Found ${priceElements.length} elements containing ₹`);

  for (let i = 0; i < priceElements.length; i++) {
    const element = priceElements[i];

    const visible = await element.isVisible().catch(() => false);

    console.log(`\n========== ELEMENT ${i} ==========`);
    console.log("VISIBLE:", visible);
    console.log("TEXT:", await element.innerText().catch(() => ""));
    console.log(
      "CLASS:",
      await element.getAttribute("class").catch(() => "")
    );
    console.log(
      "STYLE:",
      await element.getAttribute("style").catch(() => "")
    );
    console.log(
      "OUTER HTML:",
      await element.evaluate(el => el.outerHTML).catch(() => "")
    );
  }

  console.log("\n========== BODY TEXT ==========");
  console.log(await page.locator("body").innerText());

  await browser.close();
}

main().catch(console.error);