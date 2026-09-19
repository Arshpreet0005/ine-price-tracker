const {
  scrapeProduct
} = require("./src/scraper/productScraper");

const URL =
  "https://demo.inelabteamdev.com/product/891";

async function main() {
  const result = await scrapeProduct(URL);

  console.log("\n========== SCRAPER SERVICE RESULT ==========");
  console.log(result);
}

main().catch(error => {
  console.error("Unexpected error:", error);
});