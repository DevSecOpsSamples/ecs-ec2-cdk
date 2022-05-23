# CDK EKS Blueprints Sample

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

## CDK Stack Time Taken

| Stack                         | Time    |
|-------------------------------|---------|
| VPC                           | 3m      |
| Key Pair on AWS web console   |         |
| IAM roles                     | 1m      |
| ECS EC2 cluster               | 295.09s   |
| ECS Service                   |      |

# Install

## Step 1: VPC

The VPC ID will be saved into the SSM parameter store to refer from other stacks.

Parameter Name : `/cdk-ecs-ec2/vpc-id`

Use the `-c vpcId` context parameter if you want to use the existing VPC.

```bash
cd vpc
cdk bootstrap
cdk deploy
```

[vpc/lib/vpc-stack.ts](./vpc/lib/vpc-stack.ts)

## Step 2: EC2 Key Pair

https://us-east-1.console.aws.amazon.com/ec2/v2/home?region=us-east-1#KeyPairs:

Check your region before creating a Key Pair.

Create the Key Pair with `dev-ecs-ec2-cluster` and .ppk file format.
This key pair is required to connect to EC2 with SSH.

## Step 3: ECS cluster

```bash
cd ../ecs-ec2-cluster
cdk bootstrap
cdk deploy 

# or define your VPC id with context parameter
cdk deploy -c vpcId=<vpc-id>
```

Cluster Name: [ecs-ec2-cluster/lib/cluster-config.ts](./ecs-ec2-cluster/lib/cluster-config.ts)

[ecs-ec2-cluster/lib/cluster-stack.ts](./ecs-ec2-cluster/lib/cluster-stack.ts)

## Step 4: IAM Role

```bash
cd ../iam-role
cdk deploy 
```

[ecs-ec2-cluster/lib/cluster-stack.ts](./ecs-ec2-cluster/lib/cluster-stack.ts)

## Step 5: ECS Service

```bash
cd ../iam-role
cdk deploy 
```

[ecs-restapi-service/lib/ecs-restapi-service-stack.ts](./ecs-restapi-service/lib/ecs-restapi-service-stack.ts)

## Step 6: Deploy Sample RESTFul API

```bash
cd app

docker build -t sample-rest-api .

docker tag sample-rest-api:latest <account>.dkr.ecr.<region>.amazonaws.com/sample-rest-api:latest

aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker push <account>.dkr.ecr.<region>.amazonaws.com/sample-rest-api:latest

```

# Uninstall

```bash

```

# Reference


