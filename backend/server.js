require("dotenv").config();
const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 3000;

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
