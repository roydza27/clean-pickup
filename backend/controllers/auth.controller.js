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

    await pool.query(
      "UPDATE otp_verification SET is_verified = TRUE WHERE phone_number = ?",
      [phoneNumber]
    );

    await pool.query(
      `INSERT INTO otp_verification (phone_number, otp_code, expires_at)
       VALUES (?, ?, ?)`,
      [phoneNumber, otp, expiresAt]
    );

    res.json({ success: true, otp });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, role } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, error: "Missing data" });
    }

    const [otpRecords] = await pool.query(
      `SELECT * FROM otp_verification
       WHERE phone_number = ?
         AND otp_code = ?
         AND is_verified = FALSE
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [phoneNumber, otp]
    );

    if (!otpRecords.length) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Mark OTP verified
    await pool.query(
      "UPDATE otp_verification SET is_verified = TRUE WHERE otp_id = ?",
      [otpRecords[0].otp_id]
    );

    // Check user
    let [users] = await pool.query(
      "SELECT * FROM users WHERE phone_number = ?",
      [phoneNumber]
    );

    let user;
    let isNewUser = false;

    if (!users.length) {
      const [result] = await pool.query(
        "INSERT INTO users (phone_number, role) VALUES (?, ?)",
        [phoneNumber, role || "citizen"]
      );

      const userId = result.insertId;

      if (role === "citizen") {
        await pool.query(
          "INSERT INTO citizen_profiles (user_id) VALUES (?)",
          [userId]
        );
      }

      if (role === "kabadiwala") {
        await pool.query(
          "INSERT INTO kabadiwala_profiles (user_id) VALUES (?)",
          [userId]
        );
      }

      user = {
        user_id: userId,
        phone_number: phoneNumber,
        role,
      };

      isNewUser = true;
    } else {
      user = users[0];
    }

    // MVP token = userId
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

