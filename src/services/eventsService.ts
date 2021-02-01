import axios from 'axios'
import { format, formatISO, isToday, parseISO, sub } from 'date-fns'
import fi from 'date-fns/locale/fi'
import * as R from 'remeda'

import { addNewEvent, fetchPostedEvents } from '../db/eventDb'
import { EventObject } from '../types'

export const todaysEvents = async (): Promise<string> => {
  const events = await retrieveEvents()
  const eventsToday = R.filter(events, e => isToday(parseISO(e.starts)))

  const registrationToday = R.filter(events, e =>
    isToday(parseISO(e.registration_starts))
  )

  if (eventsToday?.length > 0 || registrationToday?.length > 0) {
    return `*Tänään:* \n ${listEvents(eventsToday, 'HH:mm', false)} ${listEvents(
      registrationToday,
      'HH:mm',
      true
    )}`
  }
}

export const pollEvents = async (): Promise<string> => {
  const events = await retrieveEvents()
  const filteredEvents = await filterPostedEvents(events)
  const addedEvents = await R.pipe(filteredEvents, R.map(addNewEvent), promises =>
    Promise.all(promises)
  )
  return newEvents(addedEvents)
}

const retrieveEvents = async () => {
  const { data } = await axios.get<EventObject[]>(
    `https://event-api.tko-aly.fi/api/events?fromDate=${formatISO(
      sub(Date.now(), { months: 3 })
    )}`
  )

  return R.filter(data, e => e.deleted === 0)
}

const newEvents = (events: EventObject[]) => {
  if (!events || events.length === 0) return

  const eventHeader =
    events.length > 1 ? '*Uusia tapahtumia:* \n' : '*Uusi tapahtuma:* \n'

  const message = eventHeader + listEvents(events, 'dd.MM.yyy HH:MM', false)
  return message.trim()
}

const listEvents = (
  events: EventObject[],
  dateFormat: string,
  showRegistrationTimes: boolean
) =>
  R.pipe(
    events,
    R.map(formatEvents(dateFormat, showRegistrationTimes)),
    R.reduce((response, event) => (response += `${event} \n`), '')
  )

const formatEvents = (dateFormat: string, showRegistration: boolean) => (
  event: EventObject
) => {
  const prefix = showRegistration
    ? `Ilmo aukeaa ${format(parseISO(event.registration_starts), dateFormat, {
        locale: fi,
      })}`
    : format(parseISO(event.starts), dateFormat, {
        locale: fi,
      })

  return `${prefix}: [${event.name.trim()}](http://tko-aly.fi/event/${event.id})`
}

const filterPostedEvents = async (data: EventObject[]) => {
  const postedEvents = await fetchPostedEvents()
  const ids = R.map(data, ({ id }) => id)
  return R.filter(data, ({ id }) => R.difference(ids, postedEvents).includes(id))
}
