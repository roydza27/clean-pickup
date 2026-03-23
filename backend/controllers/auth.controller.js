const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const { transaction, queryOne } = require('../shared/db/index');
const RateLimitError = require('../shared/errors/RateLimitError');
const AuthError = require('../shared/errors/AuthError');
const ValidationError = require('../shared/errors/ValidationError');
const logger = require('../shared/utils/logger');

const OTP_TTL_SECONDS       = 300;   // AUTH-02: 5 minutes
const OTP_FAIL_TTL_SECONDS  = 900;   // AUTH-04: 15-minute lockout
const OTP_MAX_FAILS         = 5;     // AUTH-04
const OTP_RATE_LIMIT        = 5;     // AUTH-01: 5 per hour
const OTP_RATE_TTL_SECONDS  = 3600;  // AUTH-01: 1 hour window
const BCRYPT_ROUNDS         = 8;

// ─── Send OTP ────────────────────────────────────────────────────────────────

exports.sendOTP = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      throw new ValidationError('Invalid phone number', [
        { field: 'phoneNumber', message: 'Must be a 10-digit number' },
      ]);
    }

    const redis = getRedisClient();

    // AUTH-01: Rate limit — 5 OTPs per hour per phone number
    const rateKey = `otp_req:${phoneNumber}`;
    const count = await redis.incr(rateKey);
    if (count === 1) {
      await redis.expire(rateKey, OTP_RATE_TTL_SECONDS);
    }
    if (count > OTP_RATE_LIMIT) {
      throw new RateLimitError(
        'Too many OTP requests. Try again in 1 hour.',
        'OTP_RATE_EXCEEDED'
      );
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // AUTH-02: Store hashed OTP in Redis with 5-minute TTL
    const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
    await redis.setex(`otp:${phoneNumber}`, OTP_TTL_SECONDS, otpHash);

    // AUTH-05: Never return OTP in response. Log only in development.
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[DEV ONLY] OTP for ${phoneNumber.slice(0, 4)}XXXXXX: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────

exports.verifyOTP = async (req, res, next) => {
  try {
    const { phoneNumber, otp, role } = req.body;

    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      throw new ValidationError('Invalid phone number', [
        { field: 'phoneNumber', message: 'Must be a 10-digit number' },
      ]);
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new ValidationError('Invalid OTP', [
        { field: 'otp', message: 'Must be a 6-digit number' },
      ]);
    }

    const redis = getRedisClient();

    // AUTH-04: Check lockout before verifying
    const failKey = `otp_fail:${phoneNumber}`;
    const failCount = parseInt((await redis.get(failKey)) ?? '0', 10);
    if (failCount >= OTP_MAX_FAILS) {
      throw new RateLimitError(
        'Account locked. Request a new OTP after 15 minutes.',
        'OTP_MAX_ATTEMPTS'
      );
    }

    // AUTH-02: Retrieve stored OTP hash
    const otpKey = `otp:${phoneNumber}`;
    const otpHash = await redis.get(otpKey);
    if (!otpHash) {
      throw new AuthError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    // Verify OTP against stored hash
    const isValid = await bcrypt.compare(otp, otpHash);
    if (!isValid) {
      // AUTH-04: Increment failed attempts
      const newCount = await redis.incr(failKey);
      if (newCount === 1) {
        await redis.expire(failKey, OTP_FAIL_TTL_SECONDS);
      }
      throw new AuthError('Invalid OTP', 400, 'OTP_INVALID');
    }

    // AUTH-03: Delete OTP immediately on success (single-use)
    await redis.multi()
      .del(otpKey)
      .del(failKey)
      .exec();

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT user_id, phone_number, role, name, is_active FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    let user;
    let isNewUser = false;

    if (!existingUser) {
      // AUTH-06: Role required for new users; admin excluded (AUTH-08)
      if (!role) {
        throw new AuthError('Role is required for new users', 400, 'ROLE_REQUIRED');
      }
      if (!['citizen', 'kabadiwala'].includes(role)) {
        throw new AuthError('Invalid role', 403, 'ROLE_MISMATCH');
      }

      // Create user + profile in ONE transaction
      user = await transaction(async (db) => {
        const newUser = await db.queryOne(
          `INSERT INTO users (phone_number, role)
           VALUES ($1, $2)
           RETURNING user_id, phone_number, role, name, is_active`,
          [phoneNumber, role]
        );

        if (role === 'citizen') {
          await db.query(
            'INSERT INTO citizen_profiles (user_id) VALUES ($1)',
            [newUser.user_id]
          );
        } else if (role === 'kabadiwala') {
          await db.query(
            'INSERT INTO kabadiwala_profiles (user_id) VALUES ($1)',
            [newUser.user_id]
          );
        }

        return newUser;
      });

      isNewUser = true;
    } else {
      user = existingUser;

      // USER-04: Inactive user cannot authenticate
      if (!user.is_active) {
        throw new AuthError(
          'Account is deactivated. Please contact support.',
          403,
          'ACCOUNT_DEACTIVATED'
        );
      }

      // AUTH-06: Returning users — role mismatch check
      if (role && role !== user.role) {
        throw new AuthError(
          'Role mismatch. This account is registered as a different role.',
          403,
          'ROLE_MISMATCH'
        );
      }
    }

    // Issue JWT
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, phoneNumber: user.phone_number },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // AUTH-07: Store session in Redis
    const sessionKey = `session:${user.user_id}`;
    await redis.setex(
      sessionKey,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({ userId: user.user_id, role: user.role })
    );

    res.json({
      success: true,
      token,
      user: {
        userId:      user.user_id,
        phoneNumber: user.phone_number,
        role:        user.role,
        name:        user.name,
      },
      isNewUser,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    const redis = getRedisClient();
    // AUTH-07: Delete Redis session on logout
    if (req.user?.userId) {
      await redis.del(`session:${req.user.userId}`);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};