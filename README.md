# CDK ECS EC2 Sample

## Prequisets

```bash
npm install -g aws-cdk@2.25.0

# install packages in the root folder
npm install

export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
```

Use the `cdk` command-line toolkit to interact with your project:

* `cdk deploy`: deploys your app into an AWS account
* `cdk synth`: synthesizes an AWS CloudFormation template for your app
* `cdk diff`: compares your app with the deployed stack
* `cdk watch`: deployment every time a file change is detected

## CDK Stack

| Stack                         | Time    |
|-------------------------------|---------|
| VPC                           | 3m      |
| Key Pair on AWS web console   |         |
| IAM roles                     | 1m      |
| ECS EC2 cluster               | 5m      |
| ECS Service and ALB           | 3m      |

# Install

## Step 1: VPC

The VPC ID will be saved into the SSM Parameter Store to refer from other stacks.

Parameter Name : `/cdk-ecs-ec2/vpc-id`

Use the `-c vpcId` context parameter if you want to use the existing VPC.

```bash
cd vpc
cdk deploy
```

[vpc/lib/vpc-stack.ts](./vpc/lib/vpc-stack.ts)

## Step 2: EC2 Key Pair (optional)

SSM is recommended to connect to EC2 instances with SSH.

If you want to connect to EC2 with SSH, create the Key Pair with `dev-ecs-ec2-cluster` and .ppk file format.
https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#KeyPairs:

## Step 3: ECS cluster

```bash
cd ../ecs-ec2-cluster
cdk deploy 

# or define your VPC id with context parameter
cdk deploy -c vpcId=<vpc-id>
```

SSM parameter:

* /cdk-ecs-ec2/vpc-id

Cluster Name: [ecs-ec2-cluster/lib/cluster-config.ts](./ecs-ec2-cluster/lib/cluster-config.ts)

[ecs-ec2-cluster/lib/cluster-stack.ts](./ecs-ec2-cluster/lib/cluster-stack.ts)

## Step 4: IAM Role

```bash
cd ../iam-role
cdk deploy 
```

[iam-role/lib/ecs-iam-role-stack.ts](./iam-role/lib/ecs-iam-role-stack.ts)

## Step 5: ECS Service

```bash
cd ../iam-role
cdk deploy 
```

SSM parameters:

* /cdk-ecs-ec2/vpc-id
* /cdk-ecs-ec2/cluster-securitygroup-id
* /cdk-ecs-ec2/task-execution-role-arn
* /cdk-ecs-ec2/default-task-role-arn

[ecs-restapi-service/lib/ecs-restapi-service-stack.ts](./ecs-restapi-service/lib/ecs-restapi-service-stack.ts)

## Step 6: Deploy Sample RESTFul API

```bash
cd ../app

docker build -t sample-rest-api .

docker tag sample-rest-api:latest <account>.dkr.ecr.<region>.amazonaws.com/sample-rest-api:latest

aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker push <account>.dkr.ecr.<region>.amazonaws.com/sample-rest-api:latest

```

## Step 7: Scaling Test

```bash
aws ecs update-service --cluster dev-cdk-ecs-ec2 --service restapi --desired-count 8

aws ecs update-service --cluster dev-cdk-ecs-ec2 --service restapi2 --desired-count 12

```

# Uninstall

```bash
cd ecs-restapi-service
cdk destroy

cd ../ecs-ec2-cluster
cdk deploy

cd ../iam-role
cdk deploy

cd ../vpc
cdk deploy
```

# Structure


```
├── build.gradle
├── package.json
├── ssm-prefix.ts
├── tsconfig.json
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
└── vpc
    ├── bin
    │   └── index.ts
    ├── cdk.json
    └── lib
        └── vpc-stack.ts
├── app
│   ├── Dockerfile
│   ├── README.md
│   ├── build.sh
│   ├── cpu-api-template.yaml
│   ├── cpu-api.yaml
│   ├── flask_api.py
│   ├── gunicorn.config.py
│   └── requirements.txt
```


# Reference