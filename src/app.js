require('dotenv').config()
const express = require('express')
const { Telegraf, Markup } = require('telegraf')
require('./database/db')

const {
  findOrCreateUser,
  addTransaction,
  getBalance
} = require('./services/transaction.service')

const app = express()

/* ============================= */
/*  EXPRESS (нужно для Render)   */
/* ============================= */

app.get('/', (req, res) => {
  res.send('Bot is alive 🚀')
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

/* -------- Меню -------- */

function mainMenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Доход', 'income'),
      Markup.button.callback('➖ Расход', 'expense')
    ],
    [
      Markup.button.callback('📊 Баланс', 'balance')
    ]
  ])
}

function backButton() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅ Назад', 'back')]
  ])
}

/* -------- Команды -------- */

bot.start(async (ctx) => {
  await ctx.reply(
    '💰 Финансовый бот\n\nВыберите действие:',
    mainMenu()
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
      mainMenu()
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
    mainMenu()
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
      mainMenu()
    )
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка сохранения')
  }
})

/* ============================= */
/*  ВАЖНО: graceful shutdown     */
/* ============================= */

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

/* ============================= */
/*  Запуск                       */
/* ============================= */

bot.launch()
  .then(() => console.log('🤖 Bot started'))
  .catch(err => console.error('Bot launch error:', err))