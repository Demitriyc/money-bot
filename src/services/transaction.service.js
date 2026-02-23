const pool = require('../database/db')

async function findOrCreateUser(telegramId) {
  let user = await pool.query(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId]
  )

  if (user.rows.length === 0) {
    user = await pool.query(
      'INSERT INTO users (telegram_id) VALUES ($1) RETURNING *',
      [telegramId]
    )
  }

  return user.rows[0]
}

async function addTransaction(userId, amount, type, note) {
  await pool.query(
    `
    INSERT INTO transactions (user_id, amount, type, note)
    VALUES ($1, $2, $3, $4)
    `,
    [userId, amount, type, note]
  )
}

async function getBalance(userId) {
  const result = await pool.query(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) -
      COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)
      AS balance
    FROM transactions
    WHERE user_id=$1
    `,
    [userId]
  )

  return result.rows[0].balance
}

module.exports = {
  findOrCreateUser,
  addTransaction,
  getBalance
}