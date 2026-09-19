require("dotenv").config();

const {
  createProduct,
  getProducts
} = require("./src/services/productService");

async function main() {
  const product = await createProduct({
    storeProductId: 891,
    name: "Vista Workstation Studio",
    url: "https://demo.inelabteamdev.com/product/891",
    brand: "Vista",
    sku: "VIS-10891"
  });

  console.log("\nCreated product:");
  console.log(product);

  const products = await getProducts();

  console.log("\nAll tracked products:");
  console.log(products);
}

main().catch(error => {
  console.error("Test failed:");
  console.error(error);
});