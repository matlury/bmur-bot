terraform {
  backend "s3" {
    bucket = "eventbird-state"
    key    = "eventbird-tf-state"
    region = "eu-west-1"
  }
}

provider "aws" {
  region  = "eu-west-1"
  profile = "tekis"
}

data "aws_ecr_repository" "eventbird_repository" {
  name = "eventbird"
}

data "aws_ssm_parameter" "eventbird_api_token" {
  name = "eventbird-api-token"
}

data "aws_ssm_parameter" "eventbird_event_api_token" {
  name = "eventbird-event-api-token"
}

data "aws_ssm_parameter" "eventbird_announcement_channel_id" {
  name = "eventbird-telegram-announcement-brodcast-channel-id"
}

data "aws_ssm_parameter" "eventbird_daily_channel_id" {
  name = "eventbird-telegram-daily-broadcast-channel-id"
}

data "aws_ssm_parameter" "eventbird_database_url" {
  name = "eventbird-database-url"
}

data "aws_vpc" "tekis_vpc" {
  filter {
    name   = "tag:Name"
    values = ["tekis-VPC"]
  }
}

data "aws_subnet_ids" "private_subnet_ids" {
  vpc_id = "${data.aws_vpc.tekis_vpc.id}"
  filter {
    name   = "tag:Name"
    values = ["tekis-private-subnet-1a", "tekis-private-subnet-1b"]
  }
}

data "aws_ecs_cluster" "christina_regina" {
  cluster_name = "christina-regina"
}

resource "aws_iam_role" "eventbird_execution_role" {
  name               = "eventbird-execution-role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "eventbird_execution_role_policy" {
  name = "eventbird-execution-role-policy"
  role = "${aws_iam_role.eventbird_execution_role.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role" "eventbird_event_role" {
  name               = "eventbird-event-role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "eventbird_event_role_policy" {
  name = "eventbird-event-role-policy"
  role = "${aws_iam_role.eventbird_event_role.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ecs:RunTask"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
          "*"
      ]
    }
  ]
}
EOF
}

resource "aws_security_group" "eventbird_task_sg" {
  name   = "eventbird_task_sg"
  vpc_id = "${data.aws_vpc.tekis_vpc.id}"
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_cloudwatch_log_group" "eventbird_cw" {
  name = "/ecs/christina-regina/eventbird"
}

resource "aws_ecs_task_definition" "eventbird_todays_events_task" {
  family                   = "eventbird-todays-events"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = "${aws_iam_role.eventbird_execution_role.arn}"
  container_definitions    = <<DEFINITION
[
  {
    "name": "eventbird-todays-events",
    "image": "${data.aws_ecr_repository.eventbird_repository.repository_url}:latest",
    "cpu": 256,
    "memory": null,
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${aws_cloudwatch_log_group.eventbird_cw.name}",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-datetime-format": "%Y-%m-%d %H:%M:%S"
      }
    },
    "environment": [
      {"name": "JOB_MODE", "value": "todaysEvents"}
    ],
    "secrets": [
      {"name": "API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.eventbird_api_token.arn}"},
      {"name": "TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID", "valueFrom": "${data.aws_ssm_parameter.eventbird_announcement_channel_id.arn}"},
      {"name": "TELEGRAM_DAILY_BROADCAST_CHANNEL_ID", "valueFrom": "${data.aws_ssm_parameter.eventbird_daily_channel_id.arn}"},
      {"name": "EVENT_API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.eventbird_event_api_token.arn}"},
      {"name": "DATABASE_URL", "valueFrom": "${data.aws_ssm_parameter.eventbird_database_url.arn}"}
    ]
  }
]
DEFINITION
}

resource "aws_ecs_task_definition" "eventbird_todays_food_task" {
  family                   = "eventbird-todays-food"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = "${aws_iam_role.eventbird_execution_role.arn}"
  container_definitions    = <<DEFINITION
[
  {
    "name": "eventbird-todays-food",
    "image": "${data.aws_ecr_repository.eventbird_repository.repository_url}:latest",
    "cpu": 256,
    "memory": null,
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${aws_cloudwatch_log_group.eventbird_cw.name}",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-datetime-format": "%Y-%m-%d %H:%M:%S"
      }
    },
    "environment": [
      {"name": "JOB_MODE", "value": "postFood"}
    ],
    "secrets": [
      {"name": "API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.eventbird_api_token.arn}"},
      {"name": "TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID", "valueFrom": "${data.aws_ssm_parameter.eventbird_announcement_channel_id.arn}"},
      {"name": "TELEGRAM_DAILY_BROADCAST_CHANNEL_ID", "valueFrom": "${data.aws_ssm_parameter.eventbird_daily_channel_id.arn}"},
      {"name": "EVENT_API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.eventbird_event_api_token.arn}"},
      {"name": "DATABASE_URL", "valueFrom": "${data.aws_ssm_parameter.eventbird_database_url.arn}"}
    ]
  }
]
DEFINITION
}

resource "aws_ecs_task_definition" "eventbird_poll_events_task" {
  family                   = "eventbird-poll-events"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = "${aws_iam_role.eventbird_execution_role.arn}"
  container_definitions    = <<DEFINITION
[
  {
    "name": "eventbird-poll-events",
    "image": "${data.aws_ecr_repository.eventbird_repository.repository_url}:latest",
    "cpu": 256,
    "memory": null,
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${aws_cloudwatch_log_group.eventbird_cw.name}",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-datetime-format": "%Y-%m-%d %H:%M:%S"
      }
    },
    "environment": [
      {"name": "JOB_MODE", "value": "pollEvents"}
    ],
    "secrets": [
      {"name": "API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.eventbird_api_token.arn}"},
      {"name": "TELEGRAM_ANNOUNCEMENT_BROADCAST_CHANNEL_ID", "valueFrom": "${data.aws_ssm_parameter.eventbird_announcement_channel_id.arn}"},
      {"name": "TELEGRAM_DAILY_BROADCAST_CHANNEL_ID", "valueFrom": "${data.aws_ssm_parameter.eventbird_daily_channel_id.arn}"},
      {"name": "EVENT_API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.eventbird_event_api_token.arn}"},
      {"name": "DATABASE_URL", "valueFrom": "${data.aws_ssm_parameter.eventbird_database_url.arn}"}
    ]
  }
]
DEFINITION
}

resource "aws_cloudwatch_event_rule" "eventbird_poll_events_event" {
  name                = "eventbird-poll-events"
  is_enabled          = true
  schedule_expression = "cron(/15 * * * ? *)"
}

resource "aws_cloudwatch_event_target" "eventbird_poll_events_event_target" {
  target_id = "eventbird-poll-events"
  arn       = "${data.aws_ecs_cluster.christina_regina.arn}"
  rule      = "${aws_cloudwatch_event_rule.eventbird_poll_events_event.name}"
  role_arn  = "${aws_iam_role.eventbird_event_role.arn}"

  ecs_target {
    launch_type         = "FARGATE"
    task_count          = 1
    task_definition_arn = "${aws_ecs_task_definition.eventbird_poll_events_task.arn}"

    network_configuration {
      assign_public_ip = true
      security_groups  = ["${aws_security_group.eventbird_task_sg.id}"]
      subnets          = "${data.aws_subnet_ids.private_subnet_ids.ids}"
    }
  }
}

resource "aws_cloudwatch_event_rule" "eventbird_todays_events_event" {
  name                = "eventbird-todays-events"
  is_enabled          = true
  schedule_expression = "cron(0 4 * * ? *)"
}

resource "aws_cloudwatch_event_target" "eventbird_todays_events_event_target" {
  target_id = "eventbird-todays-events"
  arn       = "${data.aws_ecs_cluster.christina_regina.arn}"
  rule      = "${aws_cloudwatch_event_rule.eventbird_todays_events_event.name}"
  role_arn  = "${aws_iam_role.eventbird_event_role.arn}"

  ecs_target {
    launch_type         = "FARGATE"
    task_count          = 1
    task_definition_arn = "${aws_ecs_task_definition.eventbird_todays_events_task.arn}"

    network_configuration {
      assign_public_ip = true
      security_groups  = ["${aws_security_group.eventbird_task_sg.id}"]
      subnets          = "${data.aws_subnet_ids.private_subnet_ids.ids}"
    }
  }
}

resource "aws_cloudwatch_event_rule" "eventbird_todays_food_event" {
  name                = "eventbird-todays-food"
  is_enabled          = true
  schedule_expression = "cron(0 7 ? * MON-FRI *)"
}

resource "aws_cloudwatch_event_target" "eventbird_todays_food_event_target" {
  target_id = "eventbird-todays-food"
  arn       = "${data.aws_ecs_cluster.christina_regina.arn}"
  rule      = "${aws_cloudwatch_event_rule.eventbird_todays_food_event.name}"
  role_arn  = "${aws_iam_role.eventbird_event_role.arn}"

  ecs_target {
    launch_type         = "FARGATE"
    task_count          = 1
    task_definition_arn = "${aws_ecs_task_definition.eventbird_todays_food_task.arn}"

    network_configuration {
      assign_public_ip = true
      security_groups  = ["${aws_security_group.eventbird_task_sg.id}"]
      subnets          = "${data.aws_subnet_ids.private_subnet_ids.ids}"
    }
  }
}
