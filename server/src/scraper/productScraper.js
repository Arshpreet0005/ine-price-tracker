const { chromium } = require("playwright");

const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dismissCookieOverlay(page) {
  const acceptButton = page.getByRole("button", {
    name: /accept cookies/i
  });

  if (await acceptButton.count()) {
    await acceptButton.first().click({
      timeout: 5000
    }).catch(() => {});
  }
}

function parsePrice(value) {
  if (!value) {
    return null;
  }

  let normalized = value
    .replace(/[\u200B\u200C\u200D\u00A0\s]/g, "")
    .replace(/[^\d.,]/g, "");

  if (!normalized) {
    return null;
  }

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (
    lastComma > lastDot &&
    /^\d{1,3}(\.\d{3})+,\d{2}$/.test(normalized)
  ) {
    normalized = normalized
      .replace(/\./g, "")
      .replace(/,\d{2}$/, "");
  } else if (/\.\d{2}$/.test(normalized)) {
    normalized = normalized.replace(/\.\d{2}$/, "");
  } else if (/,\d{2}$/.test(normalized)) {
    normalized = normalized.replace(/,\d{2}$/, "");
  }

  const price = Number(normalized.replace(/[.,]/g, ""));

  return Number.isFinite(price) && price > 0
    ? price
    : null;
}

function parseStock(value) {
  const outOfStock = /out of stock/i.test(value);

  if (outOfStock) {
    return {
      stock: 0,
      inStock: false
    };
  }

  const stockMatch =
    value.match(/in stock\s*[\u00B7-]\s*([\d,]+)\s*left/i) ||
    value.match(/only\s*([\d,]+)\s*left/i) ||
    value.match(/([\d,]+)\s*in stock/i) ||
    value.match(/just\s*([\d,]+)\s*left/i) ||
    value.match(/selling fast\s*[\u2014-]\s*([\d,]+)\s*left/i) ||
    value.match(/hurry,\s*just\s*([\d,]+)\s*left/i);

  if (!stockMatch) {
    return null;
  }

  return {
    stock: Number(stockMatch[1].replace(/,/g, "")),
    inStock: true
  };
}

async function revealPrice(page) {
  const priceBlock = page.locator(".price-block").first();

  await priceBlock.waitFor({
    state: "visible",
    timeout: 10000
  });

  await dismissCookieOverlay(page);

  const box = await priceBlock.boundingBox();

  if (!box) {
    throw new Error("Price block bounds were not available");
  }

  await page.mouse.move(box.x + 12, box.y + 12);

  for (let i = 0; i < 12; i++) {
    await page.mouse.move(
      box.x + 24 + i * Math.max(8, Math.floor(box.width / 24)),
      box.y + 22 + (i % 3) * 10,
      {
        steps: 2
      }
    );

    await page.waitForTimeout(70);
  }

  await page.waitForTimeout(800);

  await dismissCookieOverlay(page);

  const revealButton = page.getByRole("button", {
    name: /reveal price/i
  });

  await page.waitForFunction(() => {
    const button = document.querySelector(
      'button[aria-label="Reveal price"]'
    );

    return button && !button.disabled;
  }, null, {
    timeout: 10000
  });

  await revealButton.click({
    timeout: 10000
  });

  await page.waitForFunction(() => {
    return (
      document.querySelector(".price-block.price-success") ||
      /Couldn['\u2019]t load the price/i.test(document.body.innerText) ||
      /challenge_failed/i.test(document.body.innerText)
    );
  }, null, {
    timeout: 20000
  });
}

async function readRevealedProduct(page) {
  const result = await page.evaluate(() => {
    const block = document.querySelector(".price-block.price-success");

    if (!block) {
      return {
        success: false,
        text: document.body.innerText,
        error: "Price block was not revealed"
      };
    }

    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const main = block.querySelector(".price-main");
    const visibleMainText = Array.from(main?.children || [])
      .filter(isVisible)
      .map(element => element.innerText.trim())
      .filter(Boolean);

    const stockText = Array.from(
      block.querySelectorAll(".stock-badge")
    )
      .map(element => element.innerText.trim())
      .find(Boolean);

    return {
      success: true,
      priceText: visibleMainText.find(text =>
        /[\u20B9]|Rs\./i.test(text) &&
        !/%\s*off/i.test(text)
      ),
      stockText,
      text: block.innerText
    };
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  if (
    /Couldn['\u2019]t load the price/i.test(result.text) ||
    /challenge_failed/i.test(result.text)
  ) {
    throw new Error("Store failed to reveal price");
  }

  const price = parsePrice(result.priceText);

  if (!price) {
    throw new Error("Current selling price was not found");
  }

  const stockResult = parseStock(result.stockText || result.text);

  if (!stockResult) {
    throw new Error("Stock status was not found");
  }

  return {
    price,
    stock: stockResult.stock,
    inStock: stockResult.inStock
  };
}

async function scrapeProduct(url) {
  const browser = await chromium.launch({
    headless: true
  });

  try {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const page = await browser.newPage({
        viewport: {
          width: 1280,
          height: 900
        }
      });

      try {
        console.log(`\n--- Scrape attempt ${attempt}/${MAX_ATTEMPTS} ---`);

        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });

        await page.waitForLoadState("networkidle", {
          timeout: 15000
        }).catch(() => {});

        await revealPrice(page);

        const product = await readRevealedProduct(page);

        console.log("\nSUCCESS");
        console.log({
          price: product.price,
          stock: product.stock,
          inStock: product.inStock,
          attempt
        });

        await page.close();

        return {
          success: true,
          price: product.price,
          stock: product.stock,
          inStock: product.inStock,
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
