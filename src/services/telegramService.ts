import axios from 'axios'
import { channels, config } from '../constants'

type Channel = keyof typeof channels

export const sendMessage = async (
  channel: Channel,
  message: string,
  disableWebPagePreview: boolean
): Promise<void> => {
  if (!message) return

  await axios.post(`https://api.telegram.org/bot${config.telegramAPIToken}/sendMessage`, {
    chat_id: channels[channel],
    text: message,
    parse_mode: 'Markdown',
    disable_web_page_preview: disableWebPagePreview,
  })
}
