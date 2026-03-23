const pool = require("../config/database");

exports.getRates = async (req, res) => {
  try {
    const { localityId } = req.params;

    const result = await pool.query(
      `SELECT sr.*, l.name as locality_name
       FROM scrap_rates sr
       JOIN localities l ON sr.locality_id = l.locality_id
       WHERE sr.locality_id = $1
       AND sr.is_active = TRUE
       AND sr.effective_date = (
         SELECT MAX(effective_date)
         FROM scrap_rates
         WHERE locality_id = $1
         AND is_active = TRUE
       )
       ORDER BY sr.category`,
      [localityId]
    );

    res.json({ rates: result.rows });

  } catch (error) {
    console.error("Get rates error:", error);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
};

exports.updateRate = async (req, res) => {
  try {
    const { localityId, category, ratePerKg, effectiveDate } = req.body;

    // deactivate old rate
    await pool.query(
      `UPDATE scrap_rates
       SET is_active = FALSE
       WHERE locality_id = $1
       AND category = $2`,
      [localityId, category]
    );

    // insert new rate
    const result = await pool.query(
      `INSERT INTO scrap_rates
       (locality_id, category, rate_per_kg, effective_date)
       VALUES ($1,$2,$3,$4)
       RETURNING rate_id`,
      [
        localityId,
        category,
        ratePerKg,
        effectiveDate || new Date()
      ]
    );

    res.json({
      success: true,
      rateId: result.rows[0].rate_id
    });

  } catch (error) {
    console.error("Update rate error:", error);
    res.status(500).json({ error: "Failed to update rate" });
  }
};
