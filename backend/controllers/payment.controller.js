const { query, queryOne } = require('../shared/db/index');
const NotFoundError = require('../shared/errors/NotFoundError');
const AuthError = require('../shared/errors/AuthError');
const ConflictError = require('../shared/errors/ConflictError');

exports.getCitizenPayments = async (req, res, next) => {
  try {
    const citizenId = req.user.userId;

    const result = await query(
      `SELECT p.*,
              ku.name AS kabadiwala_name,
              pr.category, pr.pickup_address,
              pa.actual_weight, pa.pickup_completed_at
       FROM payment_records p
       JOIN pickup_assignments pa ON p.assignment_id = pa.assignment_id
       JOIN pickup_requests pr    ON pa.request_id   = pr.request_id
       JOIN users ku              ON p.kabadiwala_id  = ku.user_id
       WHERE p.citizen_id = $1
       ORDER BY p.created_at DESC`,
      [citizenId]
    );

    res.json({ success: true, payments: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*,
              cu.name AS citizen_name,
              ku.name AS kabadiwala_name,
              pr.category
       FROM payment_records p
       JOIN users cu ON p.citizen_id    = cu.user_id
       JOIN users ku ON p.kabadiwala_id = ku.user_id
       JOIN pickup_assignments pa ON p.assignment_id = pa.assignment_id
       JOIN pickup_requests pr    ON pa.request_id   = pr.request_id
       ORDER BY p.created_at DESC`
    );

    res.json({ success: true, payments: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentByPickup = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const row = await queryOne(
      `SELECT p.*
       FROM payment_records p
       JOIN pickup_assignments pa ON p.assignment_id = pa.assignment_id
       WHERE pa.request_id = $1
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [requestId]
    );

    if (!row) {
      throw new NotFoundError('Payment not found for this pickup', 'PAYMENT_NOT_FOUND');
    }

    // Citizens can only see their own payment
    if (req.user.role === 'citizen' && row.citizen_id !== req.user.userId) {
      throw new AuthError('Access denied', 403, 'FORBIDDEN');
    }

    res.json({ success: true, payment: row });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, upiReference } = req.body;

    const payment = await queryOne(
      'SELECT payment_id, payment_status, citizen_id FROM payment_records WHERE payment_id = $1',
      [paymentId]
    );

    if (!payment) {
      throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    }

    // Citizens can only update their own payments
    if (req.user.role === 'citizen' && payment.citizen_id !== req.user.userId) {
      throw new AuthError('Access denied', 403, 'FORBIDDEN');
    }

    // Require UPI reference when marking as paid
    if (paymentStatus === 'paid' && !upiReference) {
      throw new ConflictError('UPI reference is required when marking payment as paid', 'UPI_REFERENCE_REQUIRED');
    }

    await query(
      `UPDATE payment_records
       SET payment_status = $1,
           upi_reference  = $2,
           payment_date   = NOW()
       WHERE payment_id = $3`,
      [paymentStatus, upiReference, paymentId]
    );

    res.json({ success: true, message: 'Payment status updated' });
  } catch (err) {
    next(err);
  }
};
