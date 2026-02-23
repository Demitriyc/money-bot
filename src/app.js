require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Telegraf, Markup } = require('telegraf')

require('./database/db')

const {
  findOrCreateUser,
  addTransaction,
  getBalance,
  getAll,
  deleteById,
  deleteLast
} = require('./services/transaction.service')

/* ============================= */
/*  EXPRESS (Render API)         */
/* ============================= */

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Bot is alive 🚀')
})

/* ===== API ===== */

app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const data = await getAll(req.params.userId)
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка получения данных' })
  }
})

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await deleteById(req.params.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка удаления' })
  }
})

app.delete('/api/transactions/last/:userId', async (req, res) => {
  try {
    await deleteLast(req.params.userId)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка удаления' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🌐 HTTP Server running on port ${PORT}`)
})

/* ============================= */
/*  TELEGRAM BOT                 */
/* ============================= */

const bot = new Telegraf(process.env.BOT_TOKEN)

const userState = {}

/* ===== ГЛАВНОЕ МЕНЮ ===== */

function mainMenu(ctx) {
  const webUrl = `https://money-bot-1-96mu.onrender.com/?telegramId=${ctx.from.id}`

  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Доход', 'income'),
      Markup.button.callback('➖ Расход', 'expense')
    ],
    [
      Markup.button.callback('📊 Баланс', 'balance')
    ],
    [
      Markup.button.webApp('🌐 Открыть веб', webUrl)
    ]
  ])
}

function backButton() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅ Назад', 'back')]
  ])
}

/* ===== BOT START ===== */

bot.start(async (ctx) => {
  await ctx.reply(
    '💰 Финансовый бот\n\nВыберите действие:',
    mainMenu(ctx)
  )
})

bot.action('income', async (ctx) => {
  userState[ctx.from.id] = 'income'
  await ctx.editMessageText(
    '➕ Введите сумму дохода:',
    backButton()
  )
})

bot.action('expense', async (ctx) => {
  userState[ctx.from.id] = 'expense'
  await ctx.editMessageText(
    '➖ Введите сумму расхода:',
    backButton()
  )
})

bot.action('balance', async (ctx) => {
  try {
    const user = await findOrCreateUser(ctx.from.id)
    const balance = await getBalance(user.id)

    await ctx.editMessageText(
      `📊 Ваш баланс:\n\n💰 ${balance}`,
      mainMenu(ctx)
    )
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка получения баланса')
  }
})

bot.action('back', async (ctx) => {
  userState[ctx.from.id] = null

  await ctx.editMessageText(
    '💰 Финансовый бот\n\nВыберите действие:',
    mainMenu(ctx)
  )
})

bot.on('text', async (ctx) => {
  const state = userState[ctx.from.id]
  if (!state) return

  const amount = parseFloat(ctx.message.text)

  if (isNaN(amount)) {
    return ctx.reply('Введите корректное число')
  }

  try {
    const user = await findOrCreateUser(ctx.from.id)

    await addTransaction(user.id, amount, state, null)

    userState[ctx.from.id] = null

    await ctx.reply('✅ Сохранено')
    await ctx.reply(
      'Выберите действие:',
      mainMenu(ctx)
    )
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка сохранения')
  }
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

bot.launch()
  .then(() => console.log('🤖 Bot started'))
  .catch(err => console.error('Bot launch error:', err))