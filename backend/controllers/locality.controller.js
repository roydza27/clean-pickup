const { query, queryOne } = require('../shared/db/index');
const NotFoundError = require('../shared/errors/NotFoundError');

exports.getAllLocalities = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM localities WHERE is_serviceable = TRUE ORDER BY city, name'
    );
    res.json({ success: true, localities: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getByPincode = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM localities WHERE pincode = $1 AND is_serviceable = TRUE',
      [req.params.pincode]
    );
    if (!result.rows.length) {
      throw new NotFoundError('No serviceable locality found for this pincode', 'LOCALITY_NOT_FOUND');
    }
    res.json({ success: true, localities: result.rows });
  } catch (err) {
    next(err);
  }
};
