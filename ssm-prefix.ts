#!/usr/bin/env node

/**
 * /cdk-ecs-ec2/vpc-id
 * 
 * ecs-ec2-cluster:
 *   /cdk-ecs-ec2/cluster-securitygroup-id
 * 
 * iam-role:
 *   /cdk-ecs-ec2/task-execution-role-arn
 *   /cdk-ecs-ec2/default-task-role-arn
 * 
 */
export const SSM_PREFIX = '/cdk-ecs-ec2';