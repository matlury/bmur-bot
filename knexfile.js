require('dotenv').config({ silent: true })

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL
}