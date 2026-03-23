const express = require("express");
const cors = require("cors");

const requestLogger = require("./middleware/requestLogger");
const sanitize = require("./middleware/sanitize");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const localityRoutes = require("./routes/locality.routes");
const scrapRateRoutes = require("./routes/scrapRate.routes");
const citizenRoutes = require("./routes/citizen.routes");
const pickupRoutes = require("./routes/pickup.routes");
const kabadiwalaRoutes = require("./routes/kabadiwala.routes");
const adminRoutes = require("./routes/admin.routes");
const garbageRoutes = require("./routes/garbage.routes");
const paymentRoutes = require("./routes/payment.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Request logging (before routes)
app.use(requestLogger);

// XSS sanitization
app.use(sanitize);

// Routes
app.use("/api/auth",             authRoutes);
app.use("/api/localities",       localityRoutes);
app.use("/api/scrap-rates",      scrapRateRoutes);
app.use("/api/citizen",          citizenRoutes);
app.use("/api/pickups",          pickupRoutes);
app.use("/api/kabadiwala",       kabadiwalaRoutes);
app.use("/api/admin",            adminRoutes);
app.use("/api/garbage-schedule", garbageRoutes);
app.use("/api/payments",         paymentRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success:   false,
    errorCode: "NOT_FOUND",
    message:   `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralised error handler (must be last)
app.use(errorHandler);

module.exports = app;
