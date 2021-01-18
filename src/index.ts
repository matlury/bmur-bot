import { closeDbConnection, createConnection, migrate } from './db/eventDb'
import { pollEvents, todaysEvents } from './services/eventsService'
import { foodListByRestaurant } from './services/foodlistService'
import { sendMessage } from './services/telegramService'
import { JobMode } from './types'

exports.handler = async ({ jobMode }: { jobMode: JobMode }) => {
  await migrate()
  await createConnection()

  try {
    switch (jobMode) {
      case 'postFood':
        await foodListByRestaurant('exactum').then(sendMessage('daily', false))
        await foodListByRestaurant('chemicum').then(sendMessage('daily', false))
        break
      case 'todaysEvents':
        await pollEvents().then(sendMessage('announcements', true))
        await todaysEvents().then(sendMessage('announcements', true))
        break
      case 'pollEvents':
        await pollEvents().then(sendMessage('announcements', true))
        break
      default:
        break
    }
  } catch (error) {
    console.error(error)
  }

  await closeDbConnection()
}
