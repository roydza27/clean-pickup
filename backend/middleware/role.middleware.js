const pool = require("../config/database");

module.exports = (...roles) => async (req, res, next) => {
  const [users] = await pool.query(
    "SELECT role FROM users WHERE user_id = ?",
    [req.userId]
  );

  if (!users.length || !roles.includes(users[0].role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  req.userRole = users[0].role;
  next();
};
