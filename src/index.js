const TelegramBotApi = require('node-telegram-bot-api')
const { fetchPostedEvents, addNewEvent } = require('./db/eventDb')
const moment = require('moment')
const R = require('ramda')
const request = require('request-promise')
const fetchRestaurantFoodlist = require('./services/FoodlistService')
const knex = require('knex')

moment.locale('fi')
knex({
  client: 'pg',
  connection: process.env.DATABASE_URL
})
  .migrate
  .latest()
  .catch(e => {
    console.error('Unable to migrate database', e)
    process.exit(1)
  })

if (!process.env.API_TOKEN) {
  console.error('No api token found.')
  process.exit(1)
}

const telegramApi = new TelegramBotApi(process.env.API_TOKEN)

const filterPostedEvents = data => 
  fetchPostedEvents()
    .then(postedEvents => {
      const ids = data.map(R.view(R.lensProp('id')))
      return R.filter(({ id }) => R.difference(ids, postedEvents).includes(id), data)
    })


function pollEvents() {
  console.log('polling events...')
  return retrieveEvents()
    .then(filterPostedEvents)
    .then(
      R.pipe(
        R.map(addNewEvent),
        promises => Promise.all(promises)
      )
    )
    .then(newEvents)
}

function getEventURL(id) {
  return 'http://tko-aly.fi/event/' + id
}

function makeEventHumanReadable(dateFormat) {
  return function(e) {
    return moment(e.starts).format(dateFormat) + ': [' + e.name.trim() + '](' + getEventURL(e.id) + ')'
  }
}

function makeRegistHumanReadable(dateFormat) {
  return function(e) {
    return 'Ilmo aukeaa ' + moment(e.registration_starts).format(dateFormat) + ': [' + e.name.trim() + '](' + getEventURL(e.id) + ')'
  }
}

function retrieveEvents() {
  const opts = {
    headers: {
      'X-Token': process.env.EVENT_API_TOKEN
    }
  }

  return request
    .get('https://members.tko-aly.fi/api/events?fromDate=' + moment(Date.now() + (1000 * 60 * 60 * 2)).toISOString(), opts)
    .then(JSON.parse)
    .then(filterDeletedEvents)
}

function filterDeletedEvents(events) {
  return events.filter(e => e.deleted === 0)
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

const todaysEvents = () =>
  pollEvents()
    .then(events => {
      var today = moment()
      var eventsToday = events.filter(e => moment(e.starts).isSame(today, 'day'))
      var registsToday = events.filter(e => moment(e.registration_starts).isSame(today, 'day'))
      
      if ((eventsToday && eventsToday.length > 0) || (registsToday && registsToday.length > 0)) {
        var message = '*Tänään:* \n' + listEvents(eventsToday, 'HH:mm') + listEvents(registsToday, 'HH:mm', true)
        broadcastMessage(message.trim(), true)
      }
    })

function newEvents(events) {
  if (!events || events.length === 0) {
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

const createFoodList = groupedList => {
  const keys = R.keys(groupedList)
  return keys
    .reduce((prev, key) => {
      const values = groupedList[key]
      const joinedValues = values
        .reduce((prev, { name, warnings }) => `${prev}  -  ${name} ${warnings.length !== 0 ? '_(' : ''}${warnings.join(', ')}${warnings.length !== 0 ? ')_' : ''}\n`, '')
      return `${prev}${key}\n${joinedValues}\n\n`
  }, '')
}

function todaysFood(id) {
  fetchRestaurantFoodlist('exactum').then(list => {
    const header = `*Päivän ruoka:* \n\n*UniCafe ${list.restaurantName}:* \n\n`
    if (!list.foodList) return
    if (!list.foodList.length) {
      broadcastToDaily(header + 'ei ruokaa 😭😭😭'.trim())
    } else {
      R.pipe(
        R.groupBy(({ price }) => price.name),
        createFoodList,
        list => `${header} ${list}`,
        broadcastToDaily
      )(list.foodList)
    }
  })
  .catch(err => console.error(err))

  fetchRestaurantFoodlist('chemicum').then(list => {
    const header = `*Päivän ruoka:* \n\n*UniCafe ${list.restaurantName}:* \n\n`
    if (!list.foodList) return
    if (!list.foodList.length) {
      broadcastToDaily(header + 'ei ruokaa 😭😭😭'.trim())
    } else {
      R.pipe(
        R.groupBy(({ price }) => price.name),
        createFoodList,
        list => `${header} ${list}`,
        broadcastToDaily
      )(list.foodList)
    }
  })
  .catch(err => console.error(err))
}

process.env.JOB_MODE === 'postFood' && todaysFood()
process.env.JOB_MODE === 'todaysEvents' && todaysEvents()
process.env.JOB_MODE === 'pollEvents' && pollEvents()

function broadcastMessage(message, disableWebPagePreview) {
  if (!message) return
  return telegramApi.sendMessage(process.env.TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: !!disableWebPagePreview
  })
}

function broadcastToDaily(message, disableWebPagePreview) {
  if (!message) return
  return telegramApi.sendMessage(process.env.TELEGRAM_DAILY_BROADCAST_CHANNEL_ID, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: !!disableWebPagePreview
  })
}
