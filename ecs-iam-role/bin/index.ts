#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { EcsIamRoleStack } from '../lib/ecs-iam-role-stack';

const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
};
const stage = app.node.tryGetContext('stage') || 'local';

new EcsIamRoleStack(app, `ecs-iam-role-${stage}`,  {
    env,
    description: 'EC2 ECS IAM Role',
    terminationProtection: stage!='local'
});