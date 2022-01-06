import { cronEvents } from './constants'
import { pollEvents, todaysEvents } from './services/ilotaloService'
import { sendMessage } from './services/telegramService'
import { JobMode } from './types'

const logJobMode = (jobMode: string) => console.log('Job mode is', jobMode)

export const handleEvent = async ({ jobMode }: { jobMode: JobMode }) => {
  logJobMode(jobMode)

  try {
    switch (jobMode) {
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
}

exports.handler = handleEvent
