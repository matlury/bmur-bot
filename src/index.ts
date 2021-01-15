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
        await sendMessage('daily', await foodListByRestaurant('exactum'), false)
        await sendMessage('daily', await foodListByRestaurant('chemicum'), false)
        break
      case 'todaysEvents':
        await sendMessage('announcements', await pollEvents(), true)
        await sendMessage('announcements', await todaysEvents(), true)
        break
      case 'pollEvents':
        await sendMessage('announcements', await pollEvents(), true)
        break
      default:
        break
    }
  } catch (error) {
    console.error(error)
  }

  await closeDbConnection()
}
