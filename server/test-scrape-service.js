require("dotenv").config();

const {
  scrapeAndSaveProduct
} = require("./src/services/scrapeService");

async function main() {
  const result = await scrapeAndSaveProduct({
    productId: 1,
    url: "https://demo.inelabteamdev.com/product/891"
  });

  console.log("\n========== FINAL RESULT ==========");
  console.log(result);
}

main().catch(error => {
  console.error("Scrape service failed:");
  console.error(error);
});
