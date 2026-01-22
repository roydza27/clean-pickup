const pool = require("../config/database");

exports.getAllLocalities = async (req, res) => {
  try {
    const [localities] = await pool.query(
      "SELECT * FROM localities WHERE is_serviceable = TRUE ORDER BY city, name"
    );
    res.json({ localities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch localities" });
  }
};

exports.getByPincode = async (req, res) => {
  try {
    const [localities] = await pool.query(
      "SELECT * FROM localities WHERE pincode = ? AND is_serviceable = TRUE",
      [req.params.pincode]
    );
    res.json({ localities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locality" });
  }
};
