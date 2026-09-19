require("dotenv").config();

const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const { getProducts } = require("./services/productService");
const { scrapeAndSaveProduct } = require("./services/scrapeService");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "INE Price Tracker API is running"
  });
});

app.use("/api/products", productRoutes);

// Cron scraping endpoint (protected via query ?cron_secret= or X-Cron-Secret header)
app.post("/api/cron/scrape", async (req, res) => {
  try {
    const cronSecret = req.query.cron_secret || req.get("X-Cron-Secret") || "";

    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: invalid or missing CRON_SECRET"
      });
    }

    const products = await getProducts();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const product of products) {
      processed++;
      try {
        const result = await scrapeAndSaveProduct({
          productId: product.id,
          url: product.url
        });

        if (result.success) {
          succeeded++;;
        } else {
          failed++;
          console.log(`Cron scrape failed for product ${product.id}: ${result.error}`);
        }
      } catch (err) {
        failed++;
        console.error(`Cron scrape error for product ${product.id}:`, err);
      }
    }

    res.json({
      success: true,
      processed,
      succeeded,
      failed,
      message: `Cron scrape completed: ${succeeded} success, ${failed} failed out of ${processed} products`
    });
  } catch (error) {
    console.error("POST /api/cron/scrape failed:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});