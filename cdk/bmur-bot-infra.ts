import * as cdk from '@aws-cdk/core'
import * as ddb from '@aws-cdk/aws-dynamodb'
import * as lambda from '@aws-cdk/aws-lambda'
import * as events from '@aws-cdk/aws-events'
import * as eventTargets from '@aws-cdk/aws-events-targets'
import assert from 'assert'

const resolveSecrets = () => {
  const { API_TOKEN, TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID } = process.env
  assert(API_TOKEN, 'API_TOKEN needs to be defined')
  assert(
    TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID,
    'TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID needs to be defined'
  )

  return {
    API_TOKEN,
    TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID,
  }
}

const createStack = (app: cdk.App) => {
  const stack = new cdk.Stack(app, 'BmurBot', {
    env: {
      region: 'eu-central-1',
    },
  })

  const dynamoDb = new ddb.Table(stack, 'BmurBotStore', {
    billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    tableName: 'bmur_bot',
    partitionKey: {
      name: 'id',
      type: ddb.AttributeType.NUMBER,
    },
  })

  const bmurBotFn = new lambda.DockerImageFunction(stack, 'BmurBotFunction', {
    code: lambda.DockerImageCode.fromImageAsset('.', {
      cmd: ['/app/build/index.handler'],
    }),
    functionName: 'bmur-bot',
    environment: resolveSecrets(),
  })

  const todaysEvents = new events.Rule(stack, 'TodaysEventsRule', {
    ruleName: 'bmur-bot-todays-events',
    schedule: events.Schedule.expression('cron(0 7 ? * * *)'),
  })

  const pollEvents = new events.Rule(stack, 'PollEventsRule', {
    ruleName: 'bmur-bot-poll-events',
    schedule: events.Schedule.expression('cron(/15 * * * ? *)'),
  })

  todaysEvents.addTarget(
    new eventTargets.LambdaFunction(bmurBotFn, {
      event: events.RuleTargetInput.fromObject({
        jobMode: 'todaysEvents',
      }),
    })
  )

  pollEvents.addTarget(
    new eventTargets.LambdaFunction(bmurBotFn, {
      event: events.RuleTargetInput.fromObject({
        jobMode: 'pollEvents',
      }),
    })
  )

  dynamoDb.grantReadWriteData(bmurBotFn)
}

const app = new cdk.App()
createStack(app)
