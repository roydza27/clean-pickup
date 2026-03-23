const pool = require("../config/database");
const { generateOTP } = require("../utils/otp.util");

exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.length !== 10) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate old OTPs
    await pool.query(
      `UPDATE otp_verification 
       SET is_verified = TRUE 
       WHERE phone_number = $1`,
      [phoneNumber]
    );

    // Insert new OTP
    await pool.query(
      `INSERT INTO otp_verification (phone_number, otp_code, expires_at)
       VALUES ($1,$2,$3)`,
      [phoneNumber, otp, expiresAt]
    );

    res.json({
      success: true,
      otp, // only for dev
    });

  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, role } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: "Missing data",
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM otp_verification
       WHERE phone_number = $1
       AND otp_code = $2
       AND is_verified = FALSE
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [phoneNumber, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    const otpRecord = result.rows[0];

    // mark OTP verified
    await pool.query(
      `UPDATE otp_verification
       SET is_verified = TRUE
       WHERE otp_id = $1`,
      [otpRecord.otp_id]
    );

    // check if user exists
    const userResult = await pool.query(
      `SELECT * FROM users WHERE phone_number = $1`,
      [phoneNumber]
    );

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {

      const insertUser = await pool.query(
        `INSERT INTO users (phone_number, role)
         VALUES ($1,$2)
         RETURNING user_id, phone_number, role`,
        [phoneNumber, role || "citizen"]
      );

      user = insertUser.rows[0];

      if (user.role === "citizen") {
        await pool.query(
          `INSERT INTO citizen_profiles (user_id)
           VALUES ($1)`,
          [user.user_id]
        );
      }

      if (user.role === "kabadiwala") {
        await pool.query(
          `INSERT INTO kabadiwala_profiles (user_id)
           VALUES ($1)`,
          [user.user_id]
        );
      }

      isNewUser = true;

    } else {
      user = userResult.rows[0];
    }

    // MVP token
    const token = user.user_id.toString();

    res.json({
      success: true,
      token,
      user: {
        userId: user.user_id,
        phoneNumber: user.phone_number,
        role: user.role,
        name: user.name,
      },
      isNewUser,
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
};