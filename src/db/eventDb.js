const pg = require('pg')
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
})

db.connect()

const addNewEvent = ({ id, ...event }) =>
  db
    .query('INSERT INTO posted_events VALUES ($1)', [id])
    .then(() => ({ ...event, id }))
    .catch(e => {
      console.error('failed to save events', e)
    })

const fetchPostedEvents = () =>
  db
    .query('SELECT * FROM posted_events')
    .then(({ rows }) => rows.map(({ eventid }) => eventid))
    .catch(e => {
      console.error('failed to fetch events', e)
      return []
    })

const closeDbConnection = () => db.end()

module.exports = {
  fetchPostedEvents,
  addNewEvent,
  closeDbConnection,
}
