const supabase = require("../config/supabase");

async function createProduct({
  storeProductId,
  name,
  url,
  brand,
  sku
}) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      store_product_id: storeProductId,
      name,
      url,
      brand,
      sku
    })
    .select()
    .single();

  if (error) {
    // PostgreSQL error code 23505 = unique_violation
    if (
      error.code === "23505" &&
      error.message.includes("products_store_product_id_key")
    ) {
      throw new Error("Product is already being tracked");
    }

    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
}

async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data;
}

async function savePriceHistory({
  productId,
  price,
  stock,
  inStock
}) {
  const { data, error } = await supabase
    .from("price_history")
    .insert({
      product_id: productId,
      price,
      stock,
      in_stock: inStock
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to save price history: ${error.message}`
    );
  }

  return data;
}

async function saveScrapeLog({
  productId,
  status,
  attempts,
  errorMessage = null
}) {
  const { data, error } = await supabase
    .from("scrape_logs")
    .insert({
      product_id: productId,
      status,
      attempts,
      error_message: errorMessage
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to save scrape log: ${error.message}`
    );
  }

  return data;
}

async function getProductById(productId) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data;
}

async function getPriceHistory(productId) {
  const { data, error } = await supabase
    .from("price_history")
    .select("*")
    .eq("product_id", productId)
    .order("scraped_at", {
      ascending: false
    });

  if (error) {
    throw new Error(
      `Failed to fetch price history: ${error.message}`
    );
  }

  return data;
}

async function getScrapeLogs(productId) {
  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*")
    .eq("product_id", productId)
    .order("scraped_at", {
      ascending: false
    });

  if (error) {
    throw new Error(
      `Failed to fetch scrape logs: ${error.message}`
    );
  }

  return data;
}

async function getAllScrapeLogs() {
  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*")
    .order("scraped_at", {
      ascending: false
    });

  if (error) {
    throw new Error(
      `Failed to fetch scrape logs: ${error.message}`
    );
  }

  return data;
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  savePriceHistory,
  saveScrapeLog,
  getPriceHistory,
  getScrapeLogs,
  getAllScrapeLogs
};
