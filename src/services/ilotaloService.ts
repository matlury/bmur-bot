import { format, formatISO, isToday, parseISO, sub } from 'date-fns'
import fi from 'date-fns/locale/fi'
import * as R from 'remeda'
import axios from 'axios'

import { addNewEvent, fetchPostedEvents } from '../db/eventDb'
import { EventObject } from '../types'

export const todaysEvents = async (): Promise<string> => {
  const events = await retrieveEvents()
  const eventsToday = R.filter(events, e => isToday(parseISO(e.starts)))
  if (eventsToday?.length > 0) {
    return `*Today:* \n ${listEvents(eventsToday, 'HH:mm')}`
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
  const data = await axios
    .get<EventObject[]>(
      `https://ilotalo-api.hugis.workers.dev/reservations/all?from=${formatISO(
        sub(Date.now(), { months: 3 })
      )}`
    )
    .then(res => res.data)
  return R.filter(data, e => e.closed === false)
}

const newEvents = (events: EventObject[]) => {
  if (!events || events.length === 0) return

  const eventHeader = events.length > 1 ? '*New events:* \n' : '*New event:* \n'

  const message = eventHeader + listEvents(events, 'dd.MM.yyy HH:mm')
  return message.trim()
}

const listEvents = (events: EventObject[], dateFormat: string) =>
  R.pipe(
    events,
    R.map(formatEvents(dateFormat)),
    R.reduce((response, event) => (response += `${event} \n`), '')
  )

const formatEvents = (dateFormat: string) => (event: EventObject) => {
  const prefix = format(parseISO(event.starts), dateFormat, {
    locale: fi,
  })

  return `${prefix}: [${event.name.trim()}](https://ilotalo.matlu.fi/index.php?page=res&id=${
    event.id
  }) (${event.association})`
}

const filterPostedEvents = async (data: EventObject[]) => {
  const postedEvents = await fetchPostedEvents()
  const ids = R.map(data, ({ id }) => id)
  return R.filter(data, ({ id }) => R.difference(ids, postedEvents).includes(id))
}
