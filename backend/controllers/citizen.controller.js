const pool = require("../config/database");

// ================================
// GET CITIZEN PROFILE
// ================================
exports.getProfile = async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT u.*, cp.*, 
              l.name as locality_name, 
              l.pincode, 
              l.city
       FROM users u
       JOIN citizen_profiles cp ON u.user_id = cp.user_id
       LEFT JOIN localities l ON cp.locality_id = l.locality_id
       WHERE u.user_id = $1`,
      [req.userId]
    );

    res.json({ profile: result.rows[0] });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// ================================
// UPDATE CITIZEN PROFILE
// ================================
exports.updateProfile = async (req, res) => {
  try {

    const {
      name,
      age,
      preferred_language,
      preferredLanguage,
      localityId,
      addressLine1,
      addressLine2,
      landmark,
    } = req.body;

    // update users table
    if (name !== undefined) {
      await pool.query(
        `UPDATE users SET name = $1 WHERE user_id = $2`,
        [name, req.userId]
      );
    }

    const fields = [];
    const values = [];
    let index = 1;

    if (age !== undefined && age !== null) {
      const parsedAge = Number(age);

      if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
        return res.status(400).json({ error: "Invalid age" });
      }

      fields.push(`age = $${index++}`);
      values.push(parsedAge);
    }

    if (preferred_language !== undefined) {
      fields.push(`preferred_language = $${index++}`);
      values.push(preferred_language);
    } 
    else if (preferredLanguage !== undefined) {
      fields.push(`preferred_language = $${index++}`);
      values.push(preferredLanguage);
    }

    if (localityId !== undefined) {
      fields.push(`locality_id = $${index++}`);
      values.push(localityId);
    }

    if (addressLine1 !== undefined) {
      fields.push(`address_line1 = $${index++}`);
      values.push(addressLine1);
    }

    if (addressLine2 !== undefined) {
      fields.push(`address_line2 = $${index++}`);
      values.push(addressLine2);
    }

    if (landmark !== undefined) {
      fields.push(`landmark = $${index++}`);
      values.push(landmark);
    }

    if (fields.length > 0) {

      const result = await pool.query(
        `UPDATE citizen_profiles
         SET ${fields.join(", ")}
         WHERE user_id = $${index}`,
        [...values, req.userId]
      );

      // insert if profile doesn't exist
      if (result.rowCount === 0) {

        const columns = fields.map(f => f.split(" = ")[0]).join(", ");

        const placeholders = values
          .map((_, i) => `$${i + 2}`)
          .join(", ");

        await pool.query(
          `INSERT INTO citizen_profiles
           (user_id, ${columns})
           VALUES ($1, ${placeholders})`,
          [req.userId, ...values]
        );
      }
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ================================
// UPDATE NOTIFICATION PREFERENCES
// ================================
exports.updatePreferences = async (req, res) => {
  try {

    const {
      notifyPickupUpdates,
      notifyPaymentUpdates,
      notifyGeneral,
    } = req.body;

    await pool.query(
      `UPDATE citizen_profiles
       SET notify_pickup_updates = $1,
           notify_payment_updates = $2,
           notify_general = $3
       WHERE user_id = $4`,
      [
        notifyPickupUpdates,
        notifyPaymentUpdates,
        notifyGeneral,
        req.userId,
      ]
    );

    res.json({
      success: true,
      message: "Preferences updated successfully",
    });

  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
};
