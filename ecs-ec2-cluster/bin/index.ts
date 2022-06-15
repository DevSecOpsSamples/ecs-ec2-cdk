#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { CLUSTER_NAME } from '../lib/cluster-config';
import { EcsEc2ClusterStack } from '../lib/ec2ecs-cluster-stack';

const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};
const stage = app.node.tryGetContext('stage') || 'local';

new EcsEc2ClusterStack(app, `ecs-cluster-${CLUSTER_NAME}-${stage}`, {
    env,
    description: `ECS ECS cluster, cluster name: ${CLUSTER_NAME}`,
    terminationProtection: stage!='local'
});
