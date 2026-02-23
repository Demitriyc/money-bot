require('dotenv').config()
const { Telegraf, Markup } = require('telegraf')
require('./database/db')

const {
  findOrCreateUser,
  addTransaction,
  getBalance
} = require('./services/transaction.service')

const bot = new Telegraf(process.env.BOT_TOKEN)

const userState = {}

function mainMenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('➕ Доход', 'income'),
      Markup.button.callback('➖ Расход', 'expense')
    ],
    [
      Markup.button.callback('📊 Баланс', 'balance'),
      Markup.button.callback('📤 CSV', 'csv')
    ]
  ])
}

function backButton() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅ Назад', 'back')]
  ])
}

bot.start(async (ctx) => {
  await ctx.reply('💰 Финансовый бот\n\nВыберите действие:', mainMenu())
})

bot.action('income', async (ctx) => {
  userState[ctx.from.id] = 'income'
  await ctx.editMessageText('➕ Введите сумму дохода:', backButton())
})

bot.action('expense', async (ctx) => {
  userState[ctx.from.id] = 'expense'
  await ctx.editMessageText('➖ Введите сумму расхода:', backButton())
})

bot.action('balance', async (ctx) => {
  const user = await findOrCreateUser(ctx.from.id)
  const balance = await getBalance(user.id)

  await ctx.editMessageText(
    `📊 Ваш баланс:\n\n💰 ${balance}`,
    mainMenu()
  )
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
    return ctx.reply('Введите число')
  }

  const user = await findOrCreateUser(ctx.from.id)

  await addTransaction(user.id, amount, state, null)

  userState[ctx.from.id] = null

  await ctx.reply('✅ Сохранено')
  await ctx.reply('Выберите действие:', mainMenu())
})

bot.launch()

console.log('🚀 Bot started')