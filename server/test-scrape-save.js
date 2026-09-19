require("dotenv").config();

const {
  savePriceHistory,
  saveScrapeLog
} = require("./src/services/productService");

const {
  scrapeProduct
} = require("./src/scraper/productScraper");

async function main() {
  const productId = 1;

  const result = await scrapeProduct(
    "https://demo.inelabteamdev.com/product/891"
  );

  console.log("\n========== SCRAPER RESULT ==========");
  console.log(result);

  if (result.success) {
    const history = await savePriceHistory({
      productId,
      price: result.price,
      stock: result.stock,
      inStock: result.inStock
    });

    await saveScrapeLog({
      productId,
      status: result.attempts > 1 ? "retried" : "success",
      attempts: result.attempts
    });

    console.log("\n========== PRICE HISTORY ==========");
    console.log(history);

    console.log("\nScrape result saved successfully.");
  } else {
    await saveScrapeLog({
      productId,
      status: "failed",
      attempts: result.attempts,
      errorMessage: result.error
    });

    console.log("\nScrape failure saved to scrape_logs.");
  }
}

main().catch(error => {
  console.error("\nIntegration test failed:");
  console.error(error);
});