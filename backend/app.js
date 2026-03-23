const express = require("express");
const cors = require("cors");

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
    origin: "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/localities", localityRoutes);
app.use("/api/scrap-rates", scrapRateRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/kabadiwala", kabadiwalaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/garbage-schedule", garbageRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = app;
