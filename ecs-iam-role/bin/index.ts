#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { EcsIamRoleStack } from '../lib/ecs-iam-role-stack';


const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
    stage: app.node.tryGetContext('stage') || 'local'
};

new EcsIamRoleStack(app, `EcsIamRole-${env.stage}`, { env });
