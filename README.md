# EC2 ECS with CDK

[![Build](https://github.com/DevSecOpsSamples/ecs-ec2-cdk/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/DevSecOpsSamples/ecs-ec2-cdk/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DevSecOpsSamples_ecs-ec2-cdk&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DevSecOpsSamples_ecs-ec2-cdk) [![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=DevSecOpsSamples_ecs-ec2-cdk&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=DevSecOpsSamples_ecs-ec2-cdk)

## Table of Contents

1. Deploy VPC stack
2. Deploy ECS cluster stack
3. Deploy IAM Role stack
4. Deploy ECS Service stack
5. Scaling Test
6. Execute a command using ECS Exec

## Prerequisites

```bash
npm install -g aws-cdk@2.55.1

# install packages in the root folder
npm install
cdk bootstrap
```

Use the `cdk` command-line toolkit to interact with your project:

* `cdk deploy`: deploys your app into an AWS account
* `cdk synth`: synthesizes an AWS CloudFormation template for your app
* `cdk diff`: compares your app with the deployed stack
* `cdk watch`: deployment every time a file change is detected

## CDK Stack

|   | Stack                         | Time    |
|---|-------------------------------|---------|
| 1 | VPC                           | 3m      |
| 2 | ECS EC2 cluster               | 5m      |
| 3 | IAM roles                     | 1m      |
| 4 | ECS Service and ALB           | 3m      |
|   | Total                         | 11m     |

## Steps

Use the [deploy-all.sh](./deploy-all.sh) file if you want to deploy all stacks without prompt at a time.

### Step 1: VPC

The VPC ID will be saved into the SSM Parameter Store to refer from other stacks.

Parameter Name : `/ecs-ec2-cdk/vpc-id`

Use the `-c vpcId` context parameter to use the existing VPC.

```bash
cd vpc
cdk deploy
```

[vpc/lib/vpc-stack.ts](./vpc/lib/vpc-stack.ts)

### Step 2: ECS cluster

```bash
cd ../ecs-ec2-cluster
cdk deploy 

# or define your VPC id with context parameter
cdk deploy -c vpcId=<vpc-id>
```

SSM parameter:

* /ecs-ec2-cdk/vpc-id

Cluster Name: [ecs-ec2-cluster/lib/cluster-config.ts](./ecs-ec2-cluster/lib/cluster-config.ts)

[ecs-ec2-cluster/lib/cluster-stack.ts](./ecs-ec2-cluster/lib/cluster-stack.ts)

### Step 3: IAM Role

Create the ECS Task Execution role and default Task Role.

* AmazonECSTaskExecutionRole
* ECSDefaultTaskRole including a policy for ECS Exec

```bash
cd ../iam-role
cdk deploy 
```

[iam-role/lib/ecs-iam-role-stack.ts](./iam-role/lib/ecs-iam-role-stack.ts)

### Step 4: ECS Service

```bash
cd ../ecs-restapi-service
cdk deploy 
```

SSM parameters:

* /ecs-ec2-cdk/vpc-id
* /ecs-ec2-cdk/cluster-capacityprovider-name
* /ecs-ec2-cdk/cluster-securitygroup-id
* /ecs-ec2-cdk/task-execution-role-arn
* /ecs-ec2-cdk/default-task-role-arn

[ecs-restapi-service/lib/ecs-restapi-service-stack.ts](./ecs-restapi-service/lib/ecs-restapi-service-stack.ts)

**IMPORTANT**

If the ECS cluster was re-created, you HAVE to deploy after cdk.context.json files deletion with the below:

`find . -name "cdk.context.json" -exec rm -f {} \;`

### Step 5: Scaling Test

```bash
aws ecs update-service --cluster ecs-ec2-cdk-local --service restapi --desired-count 5

aws ecs update-service --cluster ecs-ec2-cdk-local --service restapi2 --desired-count 13
```

### Step 6: Execute a command using ECS Exec

Install the Session Manager plugin for the AWS CLI:

https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html#install-plugin-linux

```bash
aws ecs list-tasks --cluster ecs-ec2-cdk-local --service-name restapi
```

```json
{
    "taskArns": [
        "arn:aws:ecs:us-east-1:123456789:task/ecs-ec2-cdk-local/0a244ff8b8654b3abaaed0880b2b78f1",
        "arn:aws:ecs:us-east-1:123456789:task/ecs-ec2-cdk-local/ac3d5a4e7273460a80aa18264e4a8f5e"
    ]
}
```

```bash
TASK_ID=$(aws ecs list-tasks --cluster ecs-ec2-cdk-local --service-name restapi | jq '.taskArns[0]' | cut -d '/' -f3 | cut -d '"' -f1)

aws ecs execute-command --cluster ecs-ec2-cdk-local --task $TASK_ID --container restapi-container  --interactive --command "/bin/sh"
```

```bash
The Session Manager plugin was installed successfully. Use the AWS CLI to start a session.

Starting session with SessionId: ecs-execute-command-0dfcb1f8c2e47585a
/app # top
Mem: 1253428K used, 6610268K free, 540K shrd, 2088K buff, 827656K cached
CPU:   0% usr   0% sys   0% nic 100% idle   0% io   0% irq   0% sirq
Load average: 0.00 0.02 0.00 4/301 75
  PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND
   22     8 root     S    1525m  19%   2   0% /ecs-execute-command-2daf7b7a-7ad7-457d-a33d-ca639508cfa7/ssm-agent-worker
   57    22 root     S    1518m  19%   2   0% /ecs-execute-command-2daf7b7a-7ad7-457d-a33d-ca639508cfa7/ssm-session-worker ecs-execute-command-0dfcb1f8c2e47585a
    8     0 root     S    1440m  18%   1   0% /ecs-execute-command-2daf7b7a-7ad7-457d-a33d-ca639508cfa7/amazon-ssm-agent
   14     1 root     S    32632   0%   2   0% {gunicorn} /usr/local/bin/python /usr/local/bin/gunicorn flask_api:app --bind 0.0.0.0:8080
    1     0 root     S    22976   0%   0   0% {gunicorn} /usr/local/bin/python /usr/local/bin/gunicorn flask_api:app --bind 0.0.0.0:8080
   66    57 root     S     1676   0%   0   0% /bin/sh
   74    66 root     R     1604   0%   1   0% top
/app # exit
```

## Cleanup

[cleanup.sh](./cleanup.sh)

## Structure

```text
├── build.gradle
├── package.json
├── ssm-prefix.ts
├── tsconfig.json
├── vpc
│   ├── bin
│   │   └── index.ts
│   ├── cdk.json
│   └── lib
│       └── vpc-stack.ts
├── ecs-ec2-cluster
│   ├── bin
│   │   └── index.ts
│   ├── cdk.json
│   ├── lib
│   │   ├── cluster-config.ts
│   │   └── ec2ecs-cluster-stack.ts
│   └── settings.yaml
├── ecs-iam-role
│   ├── bin
│   │   └── index.ts
│   ├── cdk.json
│   └── lib
│       └── ecs-iam-role-stack.ts
├── ecs-restapi-service
│   ├── bin
│   │   └── index.ts
│   ├── cdk.json
│   ├── lib
│   │   └── ecs-restapi-service-stack.ts
├── app
│   ├── Dockerfile
│   ├── README.md
│   ├── build.sh
│   ├── flask_api.py
│   ├── gunicorn.config.py
│   └── requirements.txt
```

## Reference

### Docs

* [Networking > networkmode > bridge](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/networking-networkmode-bridge.html)

* [Dynamic Port Mapping](https://aws.amazon.com/premiumsupport/knowledge-center/dynamic-port-mapping-ecs) - The host and awsvpc network modes do not support dynamic host port mapping.

* [ECS Exec](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html) for debugging

### CDK Lib

* [ECS](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs-readme.html)

* [ECR Assets](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr_assets-readme.html)

* [IAM](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam-readme.html)

* [SSM](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html)

### IAM Role & Policy

* [Task Role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)

* [Exec Role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)