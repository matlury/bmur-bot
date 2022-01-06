require('dotenv').config()

export const config = {
  telegramAPIToken: process.env.API_TOKEN as string,
}

export const channels = {
  announcements: process.env.TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID as string,
}

export const cronEvents = {
  '*/10 * * * *': 'pollEvents',
  '00 12 * * *': 'todaysEvents',
} as const
