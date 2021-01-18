// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ silent: true })

module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
}
