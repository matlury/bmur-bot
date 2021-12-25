# Bmur bot

Telegram bot that posts ilotalo events.

## 5 steps to contributing

1. Create your own bot using BotFather. Go to the Telegram API pages for more info.
2. Install postgresql and create a database. You can also use `docker-compose -f local-psql.yml up -d`, and connect via adminer to manage the database http://localhost:8080 (default username is postgres and password example).
3. Run `cp .env.example .env` and fill in the variables is `.env`
4. Run `yarn knex:migrate latest`
5. Run `JOB_MODE=todaysEvents|pollEvents yarn watch`
