import {
  DynamoDBClient,
  Endpoint,
  PutItemCommand,
  ScanCommand,
  ScanOutput,
} from '@aws-sdk/client-dynamodb'

const db = new DynamoDBClient({
  region: 'eu-central-1',
  endpoint: process.env.NODE_ENV === 'dev' ? 'http://localhost:8000' : undefined,
})

export const putItem = (table: string, key: string, value: number) => {
  const cmd = new PutItemCommand({
    Item: {
      [key]: {
        N: `${value}`,
      },
    },
    TableName: table,
  })

  return db.send(cmd)
}

export const getAll = (table: string): Promise<ScanOutput['Items']> => {
  const cmd = new ScanCommand({
    TableName: table,
  })

  return db.send(cmd).then(result => result.Items)
}
