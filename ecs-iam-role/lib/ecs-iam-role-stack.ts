import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';

import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { SSM_PREFIX } from '../../ssm-prefix';

/**
 * This stack is written to share IAM role among multiple-cluster
 * 
 * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html
 * 
 * https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
 * 
 */
export class EcsIamRoleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // AmazonECSTaskExecutionRole based on https://us-east-1.console.aws.amazon.com/iam/home#/policies/arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy$jsonEditor
    const taskExecutionRole = new iam.Role(this, 'task-execution-role', {
      roleName: 'AmazonECSTaskExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ]
    });

    const defaultTaskRole = new iam.Role(this, 'default-task-role', {
      roleName: 'ECSDefaultTaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSXrayWriteOnlyAccess',
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMReadOnlyAccess',
        )
      ],
      inlinePolicies: {
        ECSExec: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "ssmmessages:CreateControlChannel",
                "ssmmessages:CreateDataChannel",
                "ssmmessages:OpenControlChannel",
                "ssmmessages:OpenDataChannel",
              ],
              resources: ["*"],
            }),
          ],
        }),
      }
    });

    const taskExecRoleParam = new ssm.StringParameter(this, 'ssm-task-execution-role', { parameterName: `${SSM_PREFIX}/task-execution-role-arn`, stringValue: taskExecutionRole.roleArn });
    const defaultTaskRoleParam = new ssm.StringParameter(this, 'ssm-default-task-role', { parameterName: `${SSM_PREFIX}/default-task-role-arn`, stringValue: defaultTaskRole.roleArn });

    new CfnOutput(this, 'SSMTaskExecRoleParam', { value: taskExecRoleParam.parameterName });
    new CfnOutput(this, 'SSMTaskExecRoleParamValue', { value: taskExecRoleParam.stringValue });
    new CfnOutput(this, 'SSMDefaultTaskRoleParam', { value: defaultTaskRoleParam.parameterName });
    new CfnOutput(this, 'SSMDefaultTaskRoleParamValue', { value: defaultTaskRoleParam.stringValue });
  }
}
