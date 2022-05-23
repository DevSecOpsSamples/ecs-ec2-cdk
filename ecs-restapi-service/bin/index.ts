#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { EcsRestAPIServiceStack } from '../lib/ecs-restapi-service-stack';


const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
    stage: app.node.tryGetContext('stage') || 'local'
};

new EcsRestAPIServiceStack(app, `EcsRestAPIService-${env.stage}`, { env });
