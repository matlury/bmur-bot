require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const moment = require('moment')
const cron = require('node-cron')
const tkoalyevents = require('tkoalyevents')
const R = require('ramda')
const request = require('request-promise')
const translations = require('./translations')
const fetchRestaurantFoodlist = require('./services/FoodlistService')

const EVENTS_FILE = 'events.json'

const WEATHER_URL = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22helsinki%22)%20and%20u=%27c%27&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys'

moment.locale('fi')

if (!process.env.API_TOKEN) {
  console.error('No api token found.')
  process.exit(1)
}

var bot = new TelegramBot(process.env.API_TOKEN, { polling: true })

var events = []
fs.readFile(EVENTS_FILE, (err, eventsData) => {
  if (!err) {
    events = JSON.parse(eventsData)
    console.log('read', events.length, 'events')
  }
})

function saveEvents(data, cb) {
  fs.writeFile(EVENTS_FILE, JSON.stringify(data), cb)
  return data
}

function eventDifference(data, events) {
  var difference = R.difference(data.map(e => e.id), events.map(e => e.id))
  return data.filter(e => difference.includes(e.id))
}

function pollEvents() {
  retrieveEvents()
    .then(saveEvents)
    .then(data => {
      var difference = eventDifference(data, events)
      if (difference && difference.length > 0) {
        newEvents(difference)
      }
      events = data
  })
}

function getEventURL(id) {
  return 'http://tko-aly.fi/event/' + id
}

function makeEventHumanReadable(dateFormat) {
  return function (e) {
    return moment(e.starts).format(dateFormat) + ': [' + e.name.trim() + '](' + getEventURL(e.id) + ')'
  }
}

function makeRegistHumanReadable(dateFormat) {
  return function (e) {
    return 'Ilmo aukeaa ' + moment(e.registration_starts).format(dateFormat) + ': [' + e.name.trim() + '](' + getEventURL(e.id) + ')'
  }
}

function retrieveEvents(cb) {
  return new Promise((resolve, reject) => {
    tkoalyevents(resolve)
  })
}

function listEvents(events, dateFormat, showRegistTimes) {
  var data = []
  if (showRegistTimes) {
    data = events.map(makeRegistHumanReadable(dateFormat))
  } else {
    data = events.map(makeEventHumanReadable(dateFormat))
  }
  var res = ''
  for (var i = 0; i < data.length; i++) {
    var event = data[i]
    res += event + '\n'
  }
  return res
}

function todaysEvents() {
  var today = moment()
  var eventsToday = events.filter(e => moment(e.starts).isSame(today, 'day'))
  var registsToday = events.filter(e => moment(e.registration_starts).isSame(today, 'day'))
  
  if ((eventsToday && eventsToday.length > 0) || (registsToday && registsToday.length > 0)) {
    var message = '*Tänään:* \n' + listEvents(eventsToday, 'HH:mm') + listEvents(registsToday, 'HH:mm', true)
    broadcastMessage(message.trim(), true)
  }
}

function newEvents(events) {
  if (!events) {
    return
  }
  var res
  if (events.length > 1) {
    res = '*Uusia tapahtumia:* \n'
  } else {
    res = '*Uusi tapahtuma:* \n'
  }
  res += listEvents(events, 'DD.MM.YYYY HH:mm')
  broadcastMessage(res.trim(), true)
}

function todaysFood(id) {
  this.createFoodList = (str, array) => {
    var res = str
    var edullisesti = '*Edullisesti:* \n'
    var makeasti = '*Makeasti:*\n'
    var maukkaasti = '*Maukkaasti:*\n'
    for (var i of array) {
      switch (i.price.name) {
        case 'Edullisesti':
          // Kaunista...
          edullisesti += `  -  ${i.name} ${i.warnings.length !== 0 ? '_(' : ''}${i.warnings.join(', ')}${i.warnings.length !== 0 ? ')_' : ''} \n\n`
          break
        case 'Makeasti':
          makeasti += `  -  ${i.name} ${i.warnings.length !== 0 ? '_(' : ''}${i.warnings.join(', ')}${i.warnings.length !== 0 ? ')_' : ''} \n\n`
          break
        case 'Maukkaasti':
          maukkaasti += `  -  ${i.name} ${i.warnings.length !== 0 ? '_(' : ''}${i.warnings.join(', ')}${i.warnings.length !== 0 ? ')_' : ''} \n\n`
          break
      }
    }
    let footer = '\n[Äänestä suosikkia!](https://kumpulafood.herokuapp.com)'
    return res + edullisesti + maukkaasti + makeasti + footer
  }

  fetchRestaurantFoodlist('exactum').then(list => {
    var header = `*Päivän ruoka:* \n\n*UniCafe ${list.restaurantName}:* \n\n`
    if (!list) return
    if (!list.length) {
      broadcastMessage(header + 'ei ruokaa 😭😭😭'.trim())
    } else {
      const foodList = this.createFoodList(header,list)
      broadcastMessage(foodList)
    }
  })
  .catch(err => console.error(err))


  fetchRestaurantFoodlist('chemicum').then(list => {
    var header = `*Päivän ruoka:* \n\n*UniCafe ${list.restaurantName}:* \n\n`
    if (!list) return
    if (!list.length) {
      broadcastMessage(header + 'ei ruokaa 😭😭😭'.trim())
    } else {
      const foodList = this.createFoodList(header,list)
      broadcastMessage(foodList)
    }
  })
  .catch(err => console.error(err))
}

function createWeatherString(body) {
  var obj = JSON.parse(body).query.results.channel

  let sunrise = moment(obj.astronomy.sunrise, ["h:mm A"])
  let sunset = moment(obj.astronomy.sunset, ["h:mm A"])

  var resStr = `*Lämpötila on Helsingissä ${obj.item.condition.temp}°C,  ${translations.conditions[obj.item.condition.code]} ${translations.emoji[obj.item.condition.code]} . `
  resStr += `Aurinko ${moment().isBefore(moment(obj.astronomy.sunrise, ['h:mm A'])) ? 'nousee' : 'nousi'} ${moment(obj.astronomy.sunrise, ["h:mm A"]).format('HH:mm')} ja laskee ${moment(obj.astronomy.sunset, ["h:mm A"]).format('HH:mm')}.*`
  return resStr.trim()
}

function weather() {
  request.get(WEATHER_URL)
    .then(createWeatherString)
    .then(broadcastMessage)
    .catch(err => console.log(err))
}

if (process.argv.indexOf('pfl') > -1) {
  todaysFood();
}

cron.schedule('0 0 7 * * *', () => {
  todaysEvents()
  weather()
})

cron.schedule('0 0 10 * * 1-5', todaysFood)

function broadcastMessage(message, disableWebPagePreview) {
  if (!message) return
  return bot.sendMessage(process.env.TELEGRAM_BROADCAST_CHANNEL_ID, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: !!disableWebPagePreview
  })
}