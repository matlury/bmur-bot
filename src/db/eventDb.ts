import { ScanOutput } from '@aws-sdk/client-dynamodb'
import { getAll, putItem } from '../clients/dynamodb'
import { EventObject } from '../types'

const table = 'bmur_bot'

export const addNewEvent = ({ id, ...event }: EventObject) =>
  putItem(table, 'id', id).then(() => ({ ...event, id }))

const parseDynamodbResult = (items: ScanOutput['Items']) =>
  items.map(item => Number(item.id.N!))

export const fetchPostedEvents = () =>
  getAll(table)
    .then(parseDynamodbResult)
    .catch(e => {
      console.error('failed to fetch events', e)
      return [] as number[]
    })
