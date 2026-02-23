const express = require('express')
const path = require('path')
require('dotenv').config()

const {
  findOrCreateUser,
  getAll
} = require('./services/transaction.service')

require('./database/db')

const app = express()
app.use(express.json())

/* ------------------------ */
/* API: Получить транзакции */
/* ------------------------ */

app.get('/api/transactions/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId
    const user = await findOrCreateUser(telegramId)
    const transactions = await getAll(user.id)

    res.json(transactions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Ошибка получения данных' })
  }
})

/* ------------------------ */
/* Раздача фронтенда */
/* ------------------------ */

const publicPath = path.join(__dirname, 'public')

// Раздаём статику (assets, css, js)
app.use(express.static(publicPath))

// SPA fallback (без wildcard роутов — Express 5 safe)
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

/* ------------------------ */

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})