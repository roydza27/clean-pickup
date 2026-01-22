const pool = require("../config/database");

exports.getRates = async (req, res) => {
  try {
    const { localityId } = req.params;
    const [rates] = await pool.query(
      `SELECT sr.*, l.name as locality_name
       FROM scrap_rates sr
       JOIN localities l ON sr.locality_id = l.locality_id
       WHERE sr.locality_id = ? AND sr.is_active = TRUE
       AND sr.effective_date = (
         SELECT MAX(effective_date)
         FROM scrap_rates
         WHERE locality_id = ? AND is_active = TRUE
       )
       ORDER BY sr.category`,
      [localityId, localityId]
    );
    res.json({ rates });
  } catch {
    res.status(500).json({ error: "Failed to fetch rates" });
  }
};

exports.updateRate = async (req, res) => {
  try {
    const { localityId, category, ratePerKg, effectiveDate } = req.body;

    await pool.query(
      "UPDATE scrap_rates SET is_active = FALSE WHERE locality_id = ? AND category = ?",
      [localityId, category]
    );

    const [result] = await pool.query(
      "INSERT INTO scrap_rates (locality_id, category, rate_per_kg, effective_date) VALUES (?, ?, ?, ?)",
      [localityId, category, ratePerKg, effectiveDate || new Date()]
    );

    res.json({ success: true, rateId: result.insertId });
  } catch {
    res.status(500).json({ error: "Failed to update rate" });
  }
};
