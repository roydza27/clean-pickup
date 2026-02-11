require("dotenv").config();
const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {

  const start = Date.now();

  res.on("finish", async () => {

    const responseTime = Date.now() - start;

    try {
      await fetch("http://localhost:3002/api/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: req.originalUrl,
          method: req.method,
          status: res.statusCode,
          responseTime,
          isError: res.statusCode >= 400,
          service: "Scrapper"
        })
      });
    } catch {
      // NEVER crash app if collector is down
    }

  });

  next();
});

// Fast route
app.get("/fast", (req, res) => {
  res.json({ message: "Fast response ⚡" });
});


// Slow route (simulates DB call)
app.get("/slow", async (req, res) => {

  await new Promise(r => setTimeout(r, 1200));

  res.json({ message: "Slow response 🐢" });
});


// Random error generator
app.get("/error", (req, res) => {

  if (Math.random() > 0.5) {
    return res.status(500).json({ error: "Random failure!" });
  }

  res.json({ message: "Lucky — no error 🍀" });
});


// Traffic generator (VERY useful)
app.get("/traffic", async (req, res) => {

  const routes = ["/fast", "/slow", "/error"];

  for (let i = 0; i < 5; i++) {

    const route = routes[Math.floor(Math.random() * routes.length)];

    fetch(`http://localhost:${PORT}${route}`).catch(()=>{});
  }

  res.json({
    message: "Traffic burst triggered 🚀"
  });
});

// DB check
pool.getConnection()
  .then(conn => {
    console.log("✅ MySQL connected");
    conn.release();
  })
  .catch(err => console.error("❌ DB error:", err.message));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
