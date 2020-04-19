# tkoalybot

Telegram bot for TKO-äly related things.

## 5 steps to contributing

1. Create your own bot using BotFather. Go to the Telegram API pages for more info.
2. Install posgresql and create a database
3. Run `cp .env.example .env` and fill in the variables is `.env`
4. Run `yarn knex:migrate latest`
5. Run `JOB_MODE=postEvents|todaysFood|pollEvents yarn watch`

## Infrastructure

Trvis CI builds and pushes new docker images of the app when pushed to master branch. The next time a task is executed, it will pull the latest image from AWS Elastic Container Registry.

The bot is running in AWS ECS Tasks. Each job mode has it's own task which is executed by a cloudwatch event with a cron expression. The idea is to run the bot only when needed, for reduced usage costs.

The infrastructure definition can be found in [main.tf](/deploy/main.tf). You need access to TKO-äly's AWS account and a configured aws-cli to deploy it.

Deployment:
1. Run `terraform plan` and review your changes.
2. Run `terraform apply` which deploys the infrastructure to AWS.
