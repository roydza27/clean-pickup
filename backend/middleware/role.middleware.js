const pool = require("../config/database");

module.exports = (...roles) => async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE user_id = $1",
      [req.userId]
    );

    const users = result.rows;

    if (!users.length || !roles.includes(users[0].role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.userRole = users[0].role;
    next();
  } catch (error) {
    console.error("Role middleware error:", error);
    res.status(500).json({ error: "Authorization failed" });
  }
};