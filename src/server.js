const express = require('express')
require('./app')

const app = express()

app.get('/', (req, res) => {
  res.send('Bot is running 🚀')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})