const {
  savePriceHistory,
  saveScrapeLog
} = require("./productService");

const {
  scrapeProduct
} = require("../scraper/productScraper");

async function scrapeAndSaveProduct({
  productId,
  url
}) {
  const result = await scrapeProduct(url);

  if (result.success) {
    await savePriceHistory({
      productId,
      price: result.price,
      stock: result.stock,
      inStock: result.inStock
    });

    await saveScrapeLog({
      productId,
      status: result.attempts > 1
        ? "retried"
        : "success",
      attempts: result.attempts
    });

    return {
      success: true,
      price: result.price,
      stock: result.stock,
      inStock: result.inStock,
      attempts: result.attempts
    };
  }

  await saveScrapeLog({
    productId,
    status: "failed",
    attempts: result.attempts,
    errorMessage: result.error
  });

  return {
    success: false,
    attempts: result.attempts,
    error: result.error
  };
}

module.exports = {
  scrapeAndSaveProduct
};