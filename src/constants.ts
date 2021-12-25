require('dotenv').config({ silent: true })

export const config = {
  telegramAPIToken: process.env.API_TOKEN as string,
  databaseUrl: process.env.DATABASE_URL,
}

export const channels = {
  announcements: process.env.TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID as string,
}
