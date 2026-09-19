const { chromium } = require("playwright");

const STORE_URL = "https://demo.inelabteamdev.com/";

async function dismissCookieOverlay(page) {
  const overlay = page.locator(".cookie-overlay");

  if (await overlay.count()) {
    try {
      await overlay.first().click({ force: true });
      await page.waitForTimeout(300);
    } catch (error) {
      console.log("Cookie overlay could not be dismissed");
    }
  }
}

async function discoverProduct(page, index, cardCount) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(STORE_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      await page.waitForTimeout(1500);

      await dismissCookieOverlay(page);

      const cards = page.locator("article.tile");

      await cards.nth(index).waitFor({
        state: "visible",
        timeout: 10000
      });

      const card = cards.nth(index);

      const name = (
        await card.locator(".tile-name").innerText()
      ).trim();

      const brand = (
        await card.locator(".tile-brand").innerText()
      ).trim();

      const sku = (
        await card.locator(".tile-sku").innerText()
      )
        .replace(/^SKU\s+/i, "")
        .trim();

      console.log(
        `\nProcessing ${index + 1}/${cardCount}: ${name} (attempt ${attempt})`
      );

      const button = card.locator(".tile-cta");

      await button.click({
        timeout: 10000
      });

      // Give the store's client-side navigation time to finish.
      await page.waitForTimeout(1500);

      let productUrl = page.url();
      let match = productUrl.match(/\/product\/(\d+)/);

      // Sometimes the first click does not navigate.
      // Try clicking again once if we are still on the homepage.
      if (!match) {
        console.log(`No product URL after click, retrying...`);

        await page.waitForTimeout(1000);

        await dismissCookieOverlay(page);

        await button.click({
          timeout: 10000,
          force: true
        });

        await page.waitForTimeout(1500);

        productUrl = page.url();
        match = productUrl.match(/\/product\/(\d+)/);
      }

      if (!match) {
        console.log(
          `Could not determine product ID for: ${name}`
        );
        console.log(`Current URL: ${productUrl}`);

        if (attempt < 3) {
          console.log(`Retrying product: ${name}`);
          continue;
        }

        return null;
      }

      const storeProductId = Number(match[1]);

      return {
        storeProductId,
        name,
        brand,
        sku,
        url: productUrl
      };
    } catch (error) {
      console.log(
        `Attempt ${attempt} failed for product ${index + 1}: ${error.message}`
      );

      if (attempt < 3) {
        await page.waitForTimeout(1000);
      }
    }
  }

  return null;
}

async function discoverStoreProducts() {
  const browser = await chromium.launch({
  headless: true
});

  try {
    const page = await browser.newPage();

    const products = [];

    await page.goto(STORE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    await dismissCookieOverlay(page);

    const cardCount = await page.locator("article.tile").count();

    console.log(`Found ${cardCount} product cards`);

    for (let i = 0; i < cardCount; i++) {
      const product = await discoverProduct(
        page,
        i,
        cardCount
      );

      if (product) {
        // Prevent accidental duplicates.
        const alreadyExists = products.some(
          (item) =>
            item.storeProductId === product.storeProductId
        );

        if (!alreadyExists) {
          products.push(product);

          console.log(
            `Discovered: ${product.name} -> ${product.storeProductId}`
          );
        }
      }
    }

    console.log("\n===== DISCOVERED PRODUCTS =====");
    console.log(JSON.stringify(products, null, 2));

    await page.close();

    return {
      success: true,
      products
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  discoverStoreProducts
};