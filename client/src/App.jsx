import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function App() {
  const [products, setProducts] = useState([]);
  const [discoveredProducts, setDiscoveredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [scrapingId, setScrapingId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [productData, setProductData] = useState({});

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load products");
      }

      setProducts(data.products);

      const details = {};

      await Promise.all(
        data.products.map(async (product) => {
          try {
            const historyResponse = await fetch(
              `${API_URL}/products/${product.id}/history`
            );

            const historyData = await historyResponse.json();

            if (
              historyData.success &&
              historyData.history &&
              historyData.history.length > 0
            ) {
              details[product.id] = historyData.history[0];
            }
          } catch (err) {
            console.error(
              `Failed to load history for product ${product.id}:`,
              err
            );
          }
        })
      );

      setProductData(details);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function discoverProducts() {
    try {
      setDiscoverLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/products/discover`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to discover products");
      }

      setDiscoveredProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function addProduct(product) {
    try {
      setAddingId(product.storeProductId);
      setError("");
      setNotice("");

      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeProductId: product.storeProductId,
          name: product.name,
          url: product.url,
          brand: product.brand,
          sku: product.sku,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add product");
      }

      setNotice(`Added ${data.product.name} to tracking.`);
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingId(null);
    }
  }

  function isTracked(storeProductId) {
    return products.some(
      (product) => product.store_product_id === storeProductId
    );
  }

  async function scrapeProduct(productId) {
    try {
      setScrapingId(productId);
      setError("");
      setNotice("");

      const response = await fetch(
        `${API_URL}/products/${productId}/scrape`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Scraping failed");
      }

      setNotice(
        `Scrape successful: ₹${data.price.toLocaleString(
          "en-IN"
        )} · ${
          data.inStock ? `${data.stock} left` : "Out of stock"
        } (attempts: ${data.attempts})`
      );

      await fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setScrapingId(null);
    }
  }

  async function openProductDetails(product) {
    try {
      setSelectedProduct(product);
      setDetailsLoading(true);
      setError("");

      const [historyResponse, logsResponse] = await Promise.all([
        fetch(`${API_URL}/products/${product.id}/history`),
        fetch(`${API_URL}/products/${product.id}/logs`),
      ]);

      const historyData = await historyResponse.json();
      const logsData = await logsResponse.json();

      if (!historyData.success) {
        throw new Error(
          historyData.error || "Failed to load price history"
        );
      }

      if (!logsData.success) {
        throw new Error(
          logsData.error || "Failed to load scrape logs"
        );
      }

      setHistory(historyData.history || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    // Initial API fetch intentionally updates state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const q = query.trim().toLowerCase();

    if (!q) return true;

    return (
      (product.name || "").toLowerCase().includes(q) ||
      (product.brand || "").toLowerCase().includes(q) ||
      (product.sku || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>INE Price Tracker</h1>

          <p style={styles.subtitle}>
            Track product prices, stock and scraping history.
          </p>
        </div>

        <button onClick={fetchProducts} style={styles.refreshButton}>
          Refresh
        </button>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {notice && <div style={styles.notice}>{notice}</div>}

      <main style={styles.container}>
        <section style={styles.discoveryPanel}>
          <div style={styles.discoveryHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Product Discovery</h2>

              <p style={styles.sectionSubtitle}>
                Discover products available in the mock store and choose
                which ones to track.
              </p>
            </div>

            <button
              onClick={discoverProducts}
              disabled={discoverLoading}
              style={{
                ...styles.discoverButton,
                opacity: discoverLoading ? 0.6 : 1,
              }}
            >
              {discoverLoading
                ? "Discovering..."
                : "Discover Products"}
            </button>
          </div>

          {discoveredProducts.length > 0 && (
            <div style={styles.discoveryGrid}>
              {discoveredProducts.map((product) => {
                const tracked = isTracked(product.storeProductId);

                return (
                  <div
                    key={product.storeProductId}
                    style={styles.discoveryCard}
                  >
                    <h3 style={styles.discoveryName}>
                      {product.name}
                    </h3>

                    <p style={styles.discoveryId}>
                      Store Product ID: {product.storeProductId}
                    </p>

                    <p style={styles.discoveryUrl}>
                      {product.url}
                    </p>

                    <button
                      onClick={() => addProduct(product)}
                      disabled={
                        tracked ||
                        addingId === product.storeProductId
                      }
                      style={{
                        ...styles.addButton,
                        opacity:
                          tracked ||
                          addingId === product.storeProductId
                            ? 0.6
                            : 1,
                      }}
                    >
                      {tracked
                        ? "Already Tracking"
                        : addingId === product.storeProductId
                        ? "Adding..."
                        : "Add to Tracking"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 style={styles.sectionTitle}>Tracked Products</h2>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracked products by name, brand, or SKU..."
            style={styles.searchInput}
          />

          {loading ? (
            <div style={styles.message}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={styles.empty}>
              <h3>No tracked products</h3>

              <p>
                Discover products above and add one to start tracking.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={styles.empty}>
              <h3>No matches</h3>
              <p>No tracked products match your search.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredProducts.map((product) => (
                <div key={product.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h2 style={styles.productName}>
                        {product.name}
                      </h2>

                      <p style={styles.brand}>
                        {product.brand || "Unknown brand"}
                      </p>
                    </div>

                    <span style={styles.badge}>Tracking</span>
                  </div>

                  <div style={styles.info}>
                    <p>
                      <strong>SKU:</strong>{" "}
                      {product.sku || "N/A"}
                    </p>

                    <p>
                      <strong>Store ID:</strong>{" "}
                      {product.store_product_id}
                    </p>

                    {productData[product.id] ? (
                      <>
                        <p>
                          <strong>Current Price:</strong>{" "}
                          ₹
                          {productData[
                            product.id
                          ].price.toLocaleString("en-IN")}
                        </p>

                        <p>
                          <strong>Stock:</strong>{" "}
                          {productData[product.id].in_stock
                            ? `${productData[product.id].stock} left`
                            : "Out of stock"}
                        </p>

                        <p>
                          <strong>Last Scraped:</strong>{" "}
                          {new Date(
                            productData[product.id].scraped_at
                          ).toLocaleString("en-IN")}
                        </p>
                      </>
                    ) : (
                      <p>
                        <strong>Price:</strong> Not scraped yet
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => scrapeProduct(product.id)}
                    disabled={scrapingId === product.id}
                    style={{
                      ...styles.scrapeButton,
                      opacity:
                        scrapingId === product.id ? 0.6 : 1,
                    }}
                  >
                    {scrapingId === product.id
                      ? "Scraping..."
                      : "Scrape Current Price"}
                  </button>

                  <button
                    onClick={() => openProductDetails(product)}
                    style={styles.detailsButton}
                  >
                    View History & Logs
                  </button>

                  <a
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    View Store Product →
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {selectedProduct && (
          <section style={styles.detailsPanel}>
            <div style={styles.detailsHeader}>
              <div>
                <h2 style={styles.detailsTitle}>
                  {selectedProduct.name}
                </h2>

                <p style={styles.detailsSubtitle}>
                  Price history and scraping activity
                </p>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                style={styles.closeButton}
              >
                Close
              </button>
            </div>

            {detailsLoading ? (
              <p>Loading history and logs...</p>
            ) : (
              <>
                <h3>Price History</h3>

                {history.length === 0 ? (
                  <p>No price history available.</p>
                ) : (
                  <>
                    <div style={styles.chart}>
                      {history
                        .slice()
                        .reverse()
                        .map((item) => {
                          const maxPrice = Math.max(
                            ...history.map(
                              (entry) => entry.price
                            )
                          );

                          const width =
                            maxPrice > 0
                              ? (item.price / maxPrice) * 100
                              : 0;

                          return (
                            <div
                              key={`chart-${item.id}`}
                              style={styles.chartRow}
                            >
                              <span style={styles.chartLabel}>
                                ₹
                                {item.price.toLocaleString(
                                  "en-IN"
                                )}
                              </span>

                              <div style={styles.chartTrack}>
                                <div
                                  style={{
                                    ...styles.chartBar,
                                    width: `${width}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div style={styles.historyList}>
                      {history.map((item) => (
                        <div
                          key={item.id}
                          style={styles.historyRow}
                        >
                          <div>
                            <strong>
                              ₹
                              {item.price.toLocaleString(
                                "en-IN"
                              )}
                            </strong>

                            <span style={styles.historyDate}>
                              {new Date(
                                item.scraped_at
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div>
                            {item.in_stock
                              ? `${item.stock} left`
                              : "Out of stock"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h3 style={{ marginTop: "28px" }}>
                  Scrape Logs
                </h3>

                {logs.length === 0 ? (
                  <p>No scrape logs available.</p>
                ) : (
                  <div style={styles.historyList}>
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        style={styles.historyRow}
                      >
                        <div>
                          <strong>{log.status}</strong>

                          <span style={styles.historyDate}>
                            {new Date(
                              log.scraped_at
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div>
                          Attempts: {log.attempts}

                          {log.error_message && (
                            <div style={styles.logError}>
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    marginTop: "8px",
    color: "#666",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  sectionSubtitle: {
    marginTop: "6px",
    color: "#666",
  },

  refreshButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  discoveryPanel: {
    background: "#fff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    marginBottom: "30px",
  },

  discoveryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  discoverButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  discoveryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },

  discoveryCard: {
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },

  discoveryName: {
    margin: 0,
    fontSize: "17px",
  },

  discoveryId: {
    margin: "8px 0",
    fontSize: "13px",
    color: "#555",
  },

  discoveryUrl: {
    margin: "8px 0 14px",
    fontSize: "12px",
    color: "#6b7280",
    wordBreak: "break-all",
  },

  addButton: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  productName: {
    margin: 0,
    fontSize: "21px",
  },

  brand: {
    color: "#666",
  },

  badge: {
    height: "fit-content",
    padding: "5px 10px",
    borderRadius: "20px",
    background: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "12px",
  },

  info: {
    margin: "20px 0",
    color: "#555",
  },

  scrapeButton: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: "15px",
  },

  detailsButton: {
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: "14px",
  },

  link: {
    display: "block",
    marginTop: "14px",
    textAlign: "center",
    color: "#2563eb",
    textDecoration: "none",
  },

  detailsPanel: {
    margin: "30px 0",
    padding: "24px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "24px",
  },

  detailsTitle: {
    margin: 0,
    fontSize: "24px",
  },

  detailsSubtitle: {
    marginTop: "6px",
    color: "#666",
  },

  closeButton: {
    padding: "8px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
  },

  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },

  historyDate: {
    display: "block",
    marginTop: "4px",
    fontSize: "13px",
    color: "#6b7280",
  },

  logError: {
    marginTop: "4px",
    color: "#991b1b",
    fontSize: "13px",
  },

  error: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    padding: "14px",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#991b1b",
  },

  notice: {
    maxWidth: "1100px",
    margin: "0 auto 20px",
    padding: "14px",
    borderRadius: "8px",
    background: "#e8f5e9",
    color: "#2e7d32",
  },

  searchInput: {
    width: "100%",
    margin: "14px 0 18px",
    padding: "11px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
  },

  message: {
    margin: "80px auto",
    textAlign: "center",
  },

  empty: {
    margin: "40px auto",
    padding: "40px",
    textAlign: "center",
    background: "#fff",
    borderRadius: "14px",
  },

  chart: {
    margin: "20px 0 30px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  chartRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  chartLabel: {
    width: "110px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  chartTrack: {
    flex: 1,
    height: "18px",
    background: "#e5e7eb",
    borderRadius: "9px",
    overflow: "hidden",
  },

  chartBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "9px",
  },
};

export default App;