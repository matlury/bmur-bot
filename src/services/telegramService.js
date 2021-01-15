const axios = require('axios')

const sendMessage = (chatId, message, disableWebPagePreview) =>
  axios
    .post(`https://api.telegram.org/bot${process.env.API_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: disableWebPagePreview,
    })
    .then(_ => console.log('message sent'))
    .catch(error => console.error(error))

module.exports = { sendMessage }
