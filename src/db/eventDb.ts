import pg from 'pg'
import knex from 'knex'

import { EventObject } from '../types'
import { config } from '../constants'

const db = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 2,
  min: 0,
})

export const withConnection = <T extends any[], R>(
  fn: (client: pg.PoolClient, ...args: T) => Promise<R>
): ((...args: T) => Promise<R>) => async (...args) => {
  const connection = await db.connect()
  return fn(connection, ...args).finally(() => connection.release())
}

export const addNewEvent = withConnection((client, { id, ...event }: EventObject) =>
  client
    .query('INSERT INTO posted_events VALUES ($1)', [id])
    .then(() => ({ ...event, id }))
)
export const fetchPostedEvents = withConnection(client =>
  client
    .query<{ eventid: number }>('SELECT * FROM posted_events')
    .then(({ rows }) => rows.map(({ eventid }) => eventid))
    .catch(e => {
      console.error('failed to fetch events', e)
      return [] as number[]
    })
)

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
