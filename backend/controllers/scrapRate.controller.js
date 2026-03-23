const { query, queryOne } = require('../shared/db/index');
const NotFoundError = require('../shared/errors/NotFoundError');

exports.getRates = async (req, res, next) => {
  try {
    const { localityId } = req.params;

    const result = await query(
      `SELECT sr.*, l.name AS locality_name
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

    res.json({ success: true, rates: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.updateRate = async (req, res, next) => {
  try {
    const { localityId, category, ratePerKg, effectiveDate } = req.body;

    // Deactivate old rate for this locality+category
    await query(
      `UPDATE scrap_rates SET is_active = FALSE WHERE locality_id = $1 AND category = $2`,
      [localityId, category]
    );

    const result = await query(
      `INSERT INTO scrap_rates (locality_id, category, rate_per_kg, effective_date)
       VALUES ($1, $2, $3, $4)
       RETURNING rate_id`,
      [localityId, category, ratePerKg, effectiveDate || new Date()]
    );

    res.status(201).json({ success: true, rateId: result.rows[0].rate_id });
  } catch (err) {
    next(err);
  }
};
