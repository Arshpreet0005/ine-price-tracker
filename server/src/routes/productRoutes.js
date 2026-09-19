const express = require("express");

const {
  getProducts,
  createProduct,
  getProductById,
  getPriceHistory,
  getScrapeLogs
} = require("../services/productService");

const {
  scrapeAndSaveProduct
} = require("../services/scrapeService");

const {
  discoverStoreProducts
} = require("../services/storeDiscoveryService");

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const products = await getProducts();

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error("GET /api/products failed:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  try {
    const {
      storeProductId,
      name,
      url,
      brand,
      sku
    } = req.body;

    if (!storeProductId || !name || !url) {
      return res.status(400).json({
        success: false,
        error: "storeProductId, name and url are required"
      });
    }

    const product = await createProduct({
      storeProductId,
      name,
      url,
      brand,
      sku
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("POST /api/products failed:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/products/discover
// IMPORTANT: This MUST be before /:id
router.get("/discover", async (req, res) => {
  try {
    const result = await discoverStoreProducts();

    res.json(result);
  } catch (error) {
    console.error(
      "GET /api/products/discover failed:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID"
      });
    }

    const product = await getProductById(productId);

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(
      `GET /api/products/${req.params.id} failed:`,
      error
    );

    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/products/:id/scrape
router.post("/:id/scrape", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID"
      });
    }

    const product = await getProductById(productId);

    const result = await scrapeAndSaveProduct({
      productId: product.id,
      url: product.url
    });

    if (!result.success) {
      return res.status(502).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error(
      `POST /api/products/${req.params.id}/scrape failed:`,
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/products/:id/history
router.get("/:id/history", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID"
      });
    }

    const history = await getPriceHistory(productId);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error(
      `GET /api/products/${req.params.id}/history failed:`,
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/products/:id/logs
router.get("/:id/logs", async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid product ID"
      });
    }

    const logs = await getScrapeLogs(productId);

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error(
      `GET /api/products/${req.params.id}/logs failed:`,
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;