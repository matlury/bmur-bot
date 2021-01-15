import pg from 'pg'
import knex from 'knex'

import { EventObject } from '../types'
import { config } from '../constants'

const db = new pg.Client({
  connectionString: config.databaseUrl,
})

export const createConnection = (): Promise<void> => db.connect()

export const addNewEvent = ({ id, ...event }: EventObject): Promise<EventObject> =>
  db
    .query('INSERT INTO posted_events VALUES ($1)', [id])
    .then(() => ({ ...event, id }))
    .catch(e => {
      console.error('failed to save events', e)
      /* If we can't save the event to the database, we also shouldn't send the 
      message to the telegram as that would lead to it being shown multiple times */
      process.exit(1)
    })

export const fetchPostedEvents = (): Promise<number[]> =>
  db
    .query<{ eventid: number }>('SELECT * FROM posted_events')
    .then(({ rows }) => rows.map(({ eventid }) => eventid))
    .catch(e => {
      console.error('failed to fetch events', e)
      return [] as number[]
    })

export const migrate = (): Promise<unknown> => {
  const instance = knex({
    client: 'pg',
    connection: config.databaseUrl,
  })

  return instance.migrate
    .latest()
    .catch(e => {
      console.error('Unable to migrate database', e)
      instance.destroy()
      process.exit(1)
    })
    .finally(() => instance.destroy())
}

export const closeDbConnection = (): Promise<void> => db.end()
