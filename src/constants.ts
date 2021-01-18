require('dotenv').config({ silent: true })

export const config = {
  telegramAPIToken: process.env.API_TOKEN as string,
  databaseUrl: process.env.DATABASE_URL,
}

export const restaurants = {
  chemicum: 10,
  exactum: 11,
  porthania: 39,
  yolo: 9,
}

export const channels = {
  daily: process.env.TELEGRAM_DAILY_BROADCAST_CHANNEL_ID as string,
  announcements: process.env.TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID as string,
}
