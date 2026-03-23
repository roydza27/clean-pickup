const pool = require('../../config/database');
const logger = require('../utils/logger');

const SLOW_QUERY_THRESHOLD_MS = 500;

/**
 * Execute a parameterized query.
 * Logs slow queries (>500 ms). Params are redacted in logs.
 * @param {string} text  SQL text
 * @param {Array}  params Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      logger.warn('Slow query detected', {
        duration,
        query: text,
        params: '[REDACTED]',
      });
    }
    return result;
  } catch (err) {
    logger.error('Database query error', {
      query: text,
      params: '[REDACTED]',
      error: err.message,
    });
    throw err;
  }
}

/**
 * Execute a query and return a single row, or null.
 */
async function queryOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] ?? null;
}

/**
 * Run multiple operations inside a single PostgreSQL transaction.
 * @param {Function} fn  Async function receiving a transactional `query` helper.
 * @returns {Promise<*>} Whatever fn returns.
 */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn({
      query: (text, params = []) => client.query(text, params),
      queryOne: async (text, params = []) => {
        const res = await client.query(text, params);
        return res.rows[0] ?? null;
      },
    });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, queryOne, transaction };
