const { chromium } = require("playwright");

const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeProduct(url) {
  const browser = await chromium.launch({
    headless: false
  });

  try {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const page = await browser.newPage();

      try {
        console.log(`\n--- Scrape attempt ${attempt}/${MAX_ATTEMPTS} ---`);

        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });

        await page.waitForTimeout(2000);

        const revealButton = page.getByRole("button", {
          name: /reveal price/i
        });

        if (await revealButton.count() === 0) {
          throw new Error("REVEAL PRICE button not found");
        }

        await revealButton.waitFor({
          state: "visible",
          timeout: 10000
        });

        await page.waitForFunction(() => {
          const button = document.querySelector(
            'button[aria-label="Reveal price"]'
          );

          return button && !button.disabled;
        }, {
          timeout: 10000
        });

        await revealButton.click({
          timeout: 10000
        });

        await page.waitForFunction(() => {
          const text = document.body.innerText;

          return (
          /%\s*off/i.test(text) ||
          /IN STOCK/i.test(text) ||
          /OUT OF STOCK/i.test(text) ||
          /JUST\s*[\d,]+\s*LEFT/i.test(text) ||
          /SELLING FAST\s*[—-]\s*[\d,]+\s*LEFT/i.test(text) ||
          /Couldn['’]t load the price/i.test(text) ||
          /challenge_failed/i.test(text)
        );
        
        }, {
          timeout: 20000
        });

        const bodyText = await page.locator("body").innerText();

        // Explicit failure from the store
        if (
          bodyText.includes("Couldn’t load the price") ||
          bodyText.includes("Couldn't load the price") ||
          bodyText.includes("challenge_failed")
        ) {
          throw new Error("Store failed to reveal price");
        }

        // Current selling price appears immediately before "% off".
        const currentPriceMatch = bodyText.match(
          /₹([\d.,\u200B\u200C\u200D\s]+)\s*\n\s*\d+%\s*off/i
        );

        if (!currentPriceMatch) {
          throw new Error("Current selling price was not found");
        }

        // Store can expose stock in different formats:
        // "IN STOCK · 185 LEFT"
        // "162 IN STOCK"
        // "OUT OF STOCK"

        const stockMatch =
        bodyText.match(/IN STOCK\s*·\s*([\d,]+)\s*LEFT/i) ||
        bodyText.match(/([\d,]+)\s*IN STOCK/i) ||
        bodyText.match(/JUST\s*([\d,]+)\s*LEFT/i) ||
        bodyText.match(/SELLING FAST\s*[—-]\s*([\d,]+)\s*LEFT/i);

      const outOfStock = /OUT OF STOCK/i.test(bodyText);

        if (!stockMatch && !outOfStock) {
          throw new Error("Stock status was not found");
        }

        const rawPrice = currentPriceMatch[1]
        .replace(/[\u200B\u200C\u200D\s]/g, "")
        .trim();

        // The mock store uses Indian/international-style separators.
        // Current tracker values are stored as whole rupees.
        const normalizedPrice = rawPrice.replace(/[.,]/g, "");

        const price = Number(normalizedPrice);

        const stock = stockMatch
          ? Number(stockMatch[1].replace(/,/g, ""))
          : 0;

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("Invalid price");
        }

        console.log("\nSUCCESS");
        console.log({
          price,
          stock,
          inStock: !outOfStock,
          attempt
        });

        await page.close();

        return {
          success: true,
          price,
          stock,
          inStock: !outOfStock,
          attempts: attempt
        };

      } catch (error) {
        lastError = error;

        console.error(
          `Attempt ${attempt} failed: ${error.message}`
        );

        await page.close();

        if (attempt < MAX_ATTEMPTS) {
          const delay = 1000 * Math.pow(2, attempt - 1);

          console.log(`Retrying in ${delay}ms...`);

          await sleep(delay);
        }
      }
    }

    return {
      success: false,
      attempts: MAX_ATTEMPTS,
      error: lastError?.message || "Unknown scraping error"
    };

  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeProduct
};